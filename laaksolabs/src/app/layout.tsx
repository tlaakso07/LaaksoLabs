import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar, BottomNav } from '@/components/layout/sidebar'
import { GlobalShortcuts } from '@/components/layout/global-shortcuts'
import { createAdminClient } from '@/lib/supabase/server'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Laakso Labs',
  description: 'Command Center',
}

async function getCurrentMRR(): Promise<number> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('clients')
      .select('retainer_amount')
      .eq('status', 'active')
    return (data ?? []).reduce((s, c) => s + (c.retainer_amount ?? 0), 0)
  } catch {
    return 0
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentMRR = await getCurrentMRR()

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="flex h-screen overflow-hidden">
        <div className="app-sidebar-wrap w-60 shrink-0 h-full">
          <Sidebar currentMRR={currentMRR} />
        </div>
        <main className="app-main flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
        <BottomNav />
        <GlobalShortcuts />
      </body>
    </html>
  )
}
