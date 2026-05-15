import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FIFTEEN_MIN_MS = 15 * 60 * 1000

interface StatePayload {
  client_id: string
  client_secret: string
  developer_token: string
  customer_id: string
  redirect_uri: string
}

interface TokenExchangeResponse {
  access_token?: string
  refresh_token?: string
  error?: string
  error_description?: string
}

interface OAuthStateRow {
  state: string
  payload: StatePayload
  created_at: string
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  const sb = createAdminClient()

  async function storeError(stateKey: string, message: string) {
    await sb.from('oauth_states').update({ error: message }).eq('state', stateKey)
  }

  if (oauthError) {
    if (state) await storeError(state, oauthError)
    return htmlResponse(errorPage(oauthError))
  }

  if (!state || !code) {
    return htmlResponse(errorPage('Invalid or expired session — please restart the connection flow.'), 400)
  }

  const { data: stored } = await sb
    .from('oauth_states')
    .select('state, payload, created_at')
    .eq('state', state)
    .single<OAuthStateRow>()

  if (!stored) {
    return htmlResponse(errorPage('OAuth state not found. Please restart the connection flow.'), 400)
  }

  if (Date.now() - new Date(stored.created_at).getTime() > FIFTEEN_MIN_MS) {
    await sb.from('oauth_states').delete().eq('state', state)
    return htmlResponse(errorPage('OAuth session expired. Please try again.'), 400)
  }

  const payload = stored.payload
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: payload.client_id,
        client_secret: payload.client_secret,
        code,
        redirect_uri: payload.redirect_uri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = (await tokenRes.json()) as TokenExchangeResponse

    if (tokenData.refresh_token) {
      await sb
        .from('oauth_states')
        .update({ refresh_token: tokenData.refresh_token })
        .eq('state', state)

      return htmlResponse(
        successPage({
          refresh_token: tokenData.refresh_token,
          client_id: payload.client_id,
          client_secret: payload.client_secret,
          developer_token: payload.developer_token,
          customer_id: payload.customer_id,
        }),
      )
    }

    const msg = tokenData.error_description ?? tokenData.error ?? 'No refresh token returned'
    await storeError(state, msg)
    return htmlResponse(errorPage(msg))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await storeError(state, msg)
    return htmlResponse(errorPage(msg))
  }
}

// ─── HTML result pages ────────────────────────────────────────────────────────

const BG = '#0f0f0f'
const SURFACE = '#1a1a1a'
const BORDER = '#2a2a2a'
const TEXT = '#e8e8e8'
const MUTED = '#888'
const ACCENT = '#B42020'
const GREEN = '#22c55e'

function errorPage(error: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Ads — Connection Failed</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};color:${TEXT};display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;padding:40px;max-width:480px;width:100%;text-align:center}
h1{font-size:20px;font-weight:700;margin-bottom:8px;color:#ef4444}p{font-size:13px;color:${MUTED};line-height:1.6;margin-bottom:16px}
.err{background:#1f0a0a;border:1px solid #3f1a1a;border-radius:8px;padding:12px 16px;font-size:12px;color:#ef8888;text-align:left;word-break:break-all}
</style></head><body><div class="card"><h1>Connection Failed</h1><p>Something went wrong during Google authorization.</p><div class="err">${escapeHtml(error)}</div>
<p style="margin-top:16px">Close this tab and try again from the Campaigns page.</p></div></body></html>`
}

function successPage(creds: {
  refresh_token: string
  client_id: string
  client_secret: string
  developer_token: string
  customer_id: string
}): string {
  const secrets = [
    { label: 'GOOGLE_ADS_DEVELOPER_TOKEN', value: creds.developer_token },
    { label: 'GOOGLE_ADS_CUSTOMER_ID', value: creds.customer_id },
    { label: 'GOOGLE_ADS_CLIENT_ID', value: creds.client_id },
    { label: 'GOOGLE_ADS_CLIENT_SECRET', value: creds.client_secret },
    { label: 'GOOGLE_ADS_REFRESH_TOKEN', value: creds.refresh_token },
  ]
  const rows = secrets
    .map(
      (s) => `
    <div class="row">
      <div class="key">${s.label}</div>
      <div class="val-wrap"><code class="val" id="${s.label}">${escapeHtml(s.value)}</code>
        <button onclick="copy('${s.label}')" class="copy-btn">Copy</button></div>
    </div>`,
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Ads Connected!</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};color:${TEXT};min-height:100vh;padding:32px 16px}
.wrap{max-width:640px;margin:0 auto}
.badge{display:inline-flex;align-items:center;gap:6px;background:#0d2e1a;border:1px solid #1a5c35;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:${GREEN};margin-bottom:20px}
h1{font-size:24px;font-weight:700;margin-bottom:8px}
p{font-size:13px;color:${MUTED};line-height:1.6;margin-bottom:24px}
.card{background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;padding:24px;margin-bottom:20px}
.card-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${MUTED};margin-bottom:16px}
.row{display:flex;flex-direction:column;gap:4px;padding:12px 0;border-bottom:1px solid ${BORDER}}
.row:last-child{border-bottom:none}
.key{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${MUTED}}
.val-wrap{display:flex;align-items:center;gap:8px}
.val{font-size:12px;color:${TEXT};flex:1;word-break:break-all;background:#111;padding:6px 10px;border-radius:6px;border:1px solid ${BORDER}}
.copy-btn{flex-shrink:0;padding:5px 12px;border-radius:6px;border:1px solid ${BORDER};background:transparent;color:${MUTED};font-size:11px;font-weight:500;cursor:pointer}
.copy-btn:hover{background:#2a2a2a;color:${TEXT}}
.steps{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:20px}
.steps-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${GREEN};margin-bottom:12px}
ol{padding-left:20px}li{font-size:13px;color:${MUTED};line-height:1.8}
li strong{color:${TEXT}}
a{color:${ACCENT};text-decoration:none}
.close-hint{text-align:center;margin-top:24px;font-size:12px;color:${MUTED}}
</style></head>
<body><div class="wrap">
  <div class="badge">✓ Authorization successful</div>
  <h1>Google Ads Connected</h1>
  <p>Copy each secret below into your Vercel project, then redeploy. The Campaigns page will show <strong>Connected</strong> when ready.</p>
  <div class="card">
    <div class="card-title">Environment variables to add</div>
    ${rows}
  </div>
  <div class="steps">
    <div class="steps-title">Next steps</div>
    <ol>
      <li>Open <a href="https://vercel.com/dashboard" target="_blank">Vercel dashboard</a> → your <strong>laaksolabs</strong> project → <strong>Settings → Environment Variables</strong></li>
      <li>Add each variable above for <strong>Production</strong> (exact names as shown)</li>
      <li>Go to <strong>Deployments → ⋯ → Redeploy</strong> on the latest production build</li>
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
    const btn=el.nextElementSibling;btn.textContent='Copied!';btn.style.color='${GREEN}';
    setTimeout(()=>{btn.textContent='Copy';btn.style.color='';},2000);
  });
}
</script>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
