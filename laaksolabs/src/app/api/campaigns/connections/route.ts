import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const metaConnected = !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID)
  const googleConnected = !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  )

  return NextResponse.json({
    meta: {
      connected: metaConnected,
      hint: metaConnected ? null : 'Set META_ACCESS_TOKEN, META_AD_ACCOUNT_ID',
    },
    google: {
      connected: googleConnected,
      hint: googleConnected
        ? null
        : 'Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN',
    },
  })
}
