import './globals.css'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Crypto Signals - AI Trading Intelligence',
  description: 'AI-powered crypto trading signals and market intelligence platform',
}

const Sidebar = dynamic(() => import('../components/layout/sidebar').then(m => m.default), { ssr: false })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <main className="w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
