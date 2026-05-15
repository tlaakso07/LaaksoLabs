import { Router } from "express";
import { requireAuth } from "../lib/require-auth";

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
