import { randomBytes } from "crypto";
import { Router } from "express";
import { requireAuth } from "../lib/require-auth";

// ─── OAuth State Store ────────────────────────────────────────────────────────

interface OAuthState {
  client_id: string;
  client_secret: string;
  developer_token: string;
  customer_id: string;
  redirect_uri: string;
  created_at: number;
  refresh_token?: string;
  error?: string;
}

const oauthStates = new Map<string, OAuthState>();

// Clean up states older than 15 minutes
setInterval(
  () => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of oauthStates) {
      if (v.created_at < cutoff) oauthStates.delete(k);
    }
  },
  2 * 60 * 1000,
);

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status?: string;
  daily_budget?: string;
}

interface MetaInsight {
  campaign_id: string;
  spend?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
}

interface MetaApiResponse<T> {
  data?: T[];
  error?: { message: string; type: string; code: number };
  paging?: unknown;
}

interface GoogleSearchRow {
  campaign?: { id: string; name: string; status: string };
  campaignBudget?: { amountMicros: string };
  metrics?: { costMicros: string; conversions: string; ctr: string };
}

interface GoogleSearchResponse {
  results?: GoogleSearchRow[];
  error?: { message: string; status: string };
}

interface OAuthTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export interface NormalizedCampaign {
  platform_id: string;
  platform: "meta" | "google";
  campaign_name: string;
  status: "active" | "paused" | "draft" | "completed";
  daily_budget: number | null;
  spend_mtd: number | null;
  leads_mtd: number | null;
  cost_per_lead: number | null;
  ctr: number | null;
  last_synced: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapMetaStatus(
  status: string,
): "active" | "paused" | "draft" | "completed" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "paused";
    case "ARCHIVED":
    case "DELETED":
    case "COMPLETED":
      return "completed";
    default:
      return "paused";
  }
}

function mapGoogleStatus(
  status: string,
): "active" | "paused" | "draft" | "completed" {
  switch (status) {
    case "ENABLED":
      return "active";
    case "PAUSED":
      return "paused";
    default:
      return "paused";
  }
}

// ─── Google OAuth helpers ─────────────────────────────────────────────────────

/**
 * POST /api/campaigns/google/auth-start
 * Stores credentials in memory under a random state key, returns the Google
 * OAuth authorization URL for the frontend to open in a new tab.
 */
router.post("/campaigns/google/auth-start", requireAuth, (req, res) => {
  const { client_id, client_secret, developer_token, customer_id, redirect_uri } =
    req.body as Record<string, string>;

  if (!client_id || !client_secret || !developer_token || !customer_id || !redirect_uri) {
    res.status(400).json({ error: "client_id, client_secret, developer_token, customer_id, and redirect_uri are required" });
    return;
  }

  const state = randomBytes(20).toString("hex");
  oauthStates.set(state, {
    client_id,
    client_secret,
    developer_token,
    customer_id,
    redirect_uri,
    created_at: Date.now(),
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", client_id);
  authUrl.searchParams.set("redirect_uri", redirect_uri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/adwords");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  res.json({ auth_url: authUrl.toString(), state });
});

/**
 * GET /api/campaigns/google/oauth-callback
 * Google redirects here after the user grants access.
 * Exchanges the code for tokens, stores the refresh token, returns a result page.
 */
router.get("/campaigns/google/oauth-callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query as Record<string, string>;

  const stored = state ? oauthStates.get(state) : undefined;

  if (oauthError) {
    if (stored) { stored.error = oauthError; oauthStates.set(state, stored); }
    res.send(oauthResultPage(null, oauthError));
    return;
  }

  if (!stored || !code) {
    res.status(400).send(oauthResultPage(null, "Invalid or expired session — please restart the connection flow."));
    return;
  }

  try {
    interface TokenExchangeResponse {
      access_token?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    }
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: stored.client_id,
        client_secret: stored.client_secret,
        code,
        redirect_uri: stored.redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as TokenExchangeResponse;

    if (tokenData.refresh_token) {
      stored.refresh_token = tokenData.refresh_token;
      oauthStates.set(state, stored);
      res.send(oauthResultPage(
        {
          refresh_token: tokenData.refresh_token,
          client_id: stored.client_id,
          client_secret: stored.client_secret,
          developer_token: stored.developer_token,
          customer_id: stored.customer_id,
        },
        null,
      ));
    } else {
      const msg = tokenData.error_description ?? tokenData.error ?? "No refresh token returned";
      stored.error = msg;
      oauthStates.set(state, stored);
      res.send(oauthResultPage(null, msg));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (stored) { stored.error = msg; oauthStates.set(state, stored); }
    res.send(oauthResultPage(null, msg));
  }
});

/**
 * GET /api/campaigns/google/oauth-status/:state
 * Frontend polls this after the auth tab is opened.
 * Returns pending | complete (with refresh_token) | error.
 */
router.get("/campaigns/google/oauth-status/:state", requireAuth, (req, res) => {
  const stateKey = String(req.params.state);
  const stored = oauthStates.get(stateKey);
  if (!stored) {
    res.json({ status: "expired" });
    return;
  }
  if (stored.refresh_token) {
    const result = {
      status: "complete",
      refresh_token: stored.refresh_token,
      client_id: stored.client_id,
      client_secret: stored.client_secret,
      developer_token: stored.developer_token,
      customer_id: stored.customer_id,
    };
    oauthStates.delete(stateKey);
    res.json(result);
  } else if (stored.error) {
    res.json({ status: "error", error: stored.error });
    oauthStates.delete(stateKey);
  } else {
    res.json({ status: "pending" });
  }
});

// ─── OAuth result HTML page ────────────────────────────────────────────────────

function oauthResultPage(
  creds: {
    refresh_token: string;
    client_id: string;
    client_secret: string;
    developer_token: string;
    customer_id: string;
  } | null,
  error: string | null,
): string {
  const bg = "#0f0f0f";
  const surface = "#1a1a1a";
  const border = "#2a2a2a";
  const text = "#e8e8e8";
  const muted = "#888";
  const accent = "#B42020";
  const green = "#22c55e";

  if (error) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Ads — Connection Failed</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${bg};color:${text};display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{background:${surface};border:1px solid ${border};border-radius:16px;padding:40px;max-width:480px;width:100%;text-align:center}
h1{font-size:20px;font-weight:700;margin-bottom:8px;color:#ef4444}p{font-size:13px;color:${muted};line-height:1.6;margin-bottom:16px}
.err{background:#1f0a0a;border:1px solid #3f1a1a;border-radius:8px;padding:12px 16px;font-size:12px;color:#ef8888;text-align:left;word-break:break-all}
</style></head><body><div class="card"><h1>Connection Failed</h1><p>Something went wrong during Google authorization.</p><div class="err">${error}</div>
<p style="margin-top:16px">Close this tab and try again from the Campaigns page.</p></div></body></html>`;
  }

  if (!creds) return "<p>Unknown error</p>";

  const secrets = [
    { label: "GOOGLE_ADS_DEVELOPER_TOKEN", value: creds.developer_token },
    { label: "GOOGLE_ADS_CUSTOMER_ID", value: creds.customer_id },
    { label: "GOOGLE_ADS_CLIENT_ID", value: creds.client_id },
    { label: "GOOGLE_ADS_CLIENT_SECRET", value: creds.client_secret },
    { label: "GOOGLE_ADS_REFRESH_TOKEN", value: creds.refresh_token },
  ];

  const rows = secrets.map(s => `
    <div class="row">
      <div class="key">${s.label}</div>
      <div class="val-wrap"><code class="val" id="${s.label}">${s.value}</code>
        <button onclick="copy('${s.label}')" class="copy-btn">Copy</button></div>
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Ads Connected!</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${bg};color:${text};min-height:100vh;padding:32px 16px}
.wrap{max-width:600px;margin:0 auto}
.badge{display:inline-flex;align-items:center;gap:6px;background:#0d2e1a;border:1px solid #1a5c35;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:${green};margin-bottom:20px}
h1{font-size:24px;font-weight:700;margin-bottom:8px}
p{font-size:13px;color:${muted};line-height:1.6;margin-bottom:24px}
.card{background:${surface};border:1px solid ${border};border-radius:16px;padding:24px;margin-bottom:20px}
.card-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${muted};margin-bottom:16px}
.row{display:flex;flex-direction:column;gap:4px;padding:12px 0;border-bottom:1px solid ${border}}
.row:last-child{border-bottom:none}
.key{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${muted}}
.val-wrap{display:flex;align-items:center;gap:8px}
.val{font-size:12px;color:${text};flex:1;word-break:break-all;background:#111;padding:6px 10px;border-radius:6px;border:1px solid ${border}}
.copy-btn{flex-shrink:0;padding:5px 12px;border-radius:6px;border:1px solid ${border};background:transparent;color:${muted};font-size:11px;font-weight:500;cursor:pointer}
.copy-btn:hover{background:#2a2a2a;color:${text}}
.steps{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:20px}
.steps-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${green};margin-bottom:12px}
ol{padding-left:20px}li{font-size:13px;color:${muted};line-height:1.8}
li strong{color:${text}}
a{color:${accent};text-decoration:none}
.close-hint{text-align:center;margin-top:24px;font-size:12px;color:${muted}}
</style></head>
<body><div class="wrap">
  <div class="badge">✓ Authorization successful</div>
  <h1>Google Ads Connected</h1>
  <p>Copy each secret below and add it to your Replit project under <strong>Secrets</strong> (the lock icon in the sidebar). Then restart the API server.</p>
  <div class="card">
    <div class="card-title">Replit Secrets to set</div>
    ${rows}
  </div>
  <div class="steps">
    <div class="steps-title">Next steps</div>
    <ol>
      <li>Open your Replit project → click the <strong>lock (Secrets)</strong> icon in the sidebar</li>
      <li>Add each secret above with the exact name shown</li>
      <li>Restart the <strong>API Server</strong> workflow</li>
      <li>Return to the <strong>Campaigns</strong> page — the Google card will show <strong>Connected</strong></li>
      <li>Click <strong>Sync Now</strong> to pull your campaigns</li>
    </ol>
  </div>
  <div class="close-hint">You can close this tab once you've saved all the secrets.</div>
</div>
<script>
function copy(id){
  const el=document.getElementById(id);
  navigator.clipboard.writeText(el.textContent.trim()).then(()=>{
    const btn=el.nextElementSibling;btn.textContent='Copied!';btn.style.color='${green}';
    setTimeout(()=>{btn.textContent='Copy';btn.style.color='';},2000);
  });
}
</script>
</body></html>`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/campaigns/connections
 * Returns which ad platforms are configured via env vars.
 */
router.get("/campaigns/connections", requireAuth, (_req, res) => {
  const metaConnected = !!(
    process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID
  );
  const googleConnected = !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  );

  res.json({
    meta: {
      connected: metaConnected,
      hint: metaConnected ? null : "Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID secrets",
    },
    google: {
      connected: googleConnected,
      hint: googleConnected
        ? null
        : "Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN secrets",
    },
  });
});

/**
 * POST /api/campaigns/sync/meta
 * Fetches campaign list + this-month insights from Meta Marketing API.
 * Returns normalized campaign array — client is responsible for upserting to Supabase.
 */
router.post("/campaigns/sync/meta", requireAuth, async (_req, res) => {
  const token = process.env.META_ACCESS_TOKEN;
  const rawAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !rawAccountId) {
    res
      .status(400)
      .json({ error: "META_ACCESS_TOKEN and META_AD_ACCOUNT_ID are not configured" });
    return;
  }

  // Strip leading "act_" if user included it, then re-add for API calls
  const accountId = rawAccountId.replace(/^act_/, "");

  try {
    // 1. Fetch all campaigns in the ad account
    const campaignsUrl = new URL(
      `https://graph.facebook.com/v20.0/act_${accountId}/campaigns`,
    );
    campaignsUrl.searchParams.set(
      "fields",
      "id,name,status,effective_status,daily_budget",
    );
    campaignsUrl.searchParams.set("access_token", token);
    campaignsUrl.searchParams.set("limit", "200");

    const campaignsRes = await fetch(campaignsUrl.toString());
    const campaignsData =
      (await campaignsRes.json()) as MetaApiResponse<MetaCampaign>;

    if (campaignsData.error) {
      res.status(400).json({ error: `Meta API: ${campaignsData.error.message}` });
      return;
    }

    // 2. Fetch this-month insights at campaign level
    const insightsUrl = new URL(
      `https://graph.facebook.com/v20.0/act_${accountId}/insights`,
    );
    insightsUrl.searchParams.set(
      "fields",
      "campaign_id,spend,ctr,actions,cost_per_action_type",
    );
    insightsUrl.searchParams.set("date_preset", "this_month");
    insightsUrl.searchParams.set("level", "campaign");
    insightsUrl.searchParams.set("access_token", token);
    insightsUrl.searchParams.set("limit", "200");

    const insightsRes = await fetch(insightsUrl.toString());
    const insightsData =
      (await insightsRes.json()) as MetaApiResponse<MetaInsight>;

    // Build lookup map
    const insightMap = new Map<string, MetaInsight>();
    for (const row of insightsData.data ?? []) {
      insightMap.set(row.campaign_id, row);
    }

    const now = new Date().toISOString();

    const campaigns: NormalizedCampaign[] = (campaignsData.data ?? []).map(
      (c) => {
        const insight = insightMap.get(c.id);
        const leadAction = insight?.actions?.find(
          (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped",
        );
        const cplAction = insight?.cost_per_action_type?.find(
          (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped",
        );

        const spendMtd = insight?.spend ? Number(insight.spend) : null;
        const leadsMtd = leadAction ? Number(leadAction.value) : null;
        const costPerLead =
          cplAction
            ? Number(cplAction.value)
            : spendMtd != null && leadsMtd != null && leadsMtd > 0
              ? Math.round((spendMtd / leadsMtd) * 100) / 100
              : null;

        return {
          platform_id: c.id,
          platform: "meta",
          campaign_name: c.name,
          status: mapMetaStatus(c.effective_status ?? c.status),
          // Meta returns daily_budget in account currency cents
          daily_budget: c.daily_budget
            ? Math.round(Number(c.daily_budget) / 100)
            : null,
          spend_mtd: spendMtd,
          leads_mtd: leadsMtd != null ? Math.round(leadsMtd) : null,
          cost_per_lead: costPerLead,
          // Meta ctr is already a percentage like 2.15 — store as decimal
          ctr: insight?.ctr ? Number(insight.ctr) / 100 : null,
          last_synced: now,
        };
      },
    );

    res.json({ campaigns, synced_at: now });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Meta sync failed: ${msg}` });
  }
});

/**
 * POST /api/campaigns/sync/google
 * Uses refresh token to get an access token, then queries Google Ads API via GAQL.
 * Returns normalized campaign array — client upserts to Supabase.
 */
router.post("/campaigns/sync/google", requireAuth, async (_req, res) => {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (
    !developerToken ||
    !customerId ||
    !clientId ||
    !clientSecret ||
    !refreshToken
  ) {
    res.status(400).json({ error: "Google Ads credentials are not fully configured" });
    return;
  }

  try {
    // 1. Exchange refresh token for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = (await tokenRes.json()) as OAuthTokenResponse;
    if (!tokenData.access_token) {
      res.status(400).json({
        error: `Google OAuth failed: ${tokenData.error_description ?? tokenData.error ?? "no access token returned"}`,
      });
      return;
    }

    // 2. Query Google Ads via GAQL
    const cleanId = customerId.replace(/-/g, "");
    const searchRes = await fetch(
      `https://googleads.googleapis.com/v17/customers/${cleanId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
          "developer-token": developerToken,
        },
        body: JSON.stringify({
          query: `
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              campaign_budget.amount_micros,
              metrics.cost_micros,
              metrics.conversions,
              metrics.ctr
            FROM campaign
            WHERE segments.date DURING THIS_MONTH
              AND campaign.status != 'REMOVED'
          `,
        }),
      },
    );

    const searchData = (await searchRes.json()) as GoogleSearchResponse;

    if (searchData.error) {
      res.status(400).json({ error: `Google Ads API: ${searchData.error.message}` });
      return;
    }

    const now = new Date().toISOString();

    const campaigns: NormalizedCampaign[] = (searchData.results ?? []).map(
      (row) => {
        const spendMtd = row.metrics?.costMicros
          ? Math.round(Number(row.metrics.costMicros) / 1_000_000)
          : null;
        const leadsMtd = row.metrics?.conversions
          ? Math.round(Number(row.metrics.conversions))
          : null;
        const costPerLead =
          spendMtd != null && leadsMtd != null && leadsMtd > 0
            ? Math.round((spendMtd / leadsMtd) * 100) / 100
            : null;

        return {
          platform_id: row.campaign?.id ?? "",
          platform: "google",
          campaign_name: row.campaign?.name ?? "Unknown",
          status: mapGoogleStatus(row.campaign?.status ?? ""),
          daily_budget: row.campaignBudget?.amountMicros
            ? Math.round(Number(row.campaignBudget.amountMicros) / 1_000_000)
            : null,
          spend_mtd: spendMtd,
          leads_mtd: leadsMtd,
          cost_per_lead: costPerLead,
          // Google ctr is already a decimal like 0.0215
          ctr: row.metrics?.ctr ? Number(row.metrics.ctr) : null,
          last_synced: now,
        };
      },
    );

    res.json({ campaigns, synced_at: now });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Google sync failed: ${msg}` });
  }
});

export default router;
