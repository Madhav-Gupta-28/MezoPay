import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { WalletProvider } from "@/components/wallet-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "@rainbow-me/rainbowkit/styles.css"

export const metadata: Metadata = {
  title: "MezoPay",
  description: "Use Bitcoin like money. Spend in MUSD. Redeem anytime.",
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MezoPay",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "MezoPay",
    title: "MezoPay",
    description: "Use Bitcoin like money. Spend in MUSD. Redeem anytime.",
  },
  twitter: {
    card: "summary",
    title: "MezoPay",
    description: "Use Bitcoin like money. Spend in MUSD. Redeem anytime.",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressContentEditableWarning>
      <body className={`font-sans antialiased`} suppressContentEditableWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          <WalletProvider>
            {children}
            <Analytics />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
