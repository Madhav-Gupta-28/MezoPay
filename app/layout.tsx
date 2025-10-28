import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { WalletProvider } from "@/components/wallet-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "@rainbow-me/rainbowkit/styles.css"

export const metadata: Metadata = {
  title: "MezoPay",
  description: "Use Bitcoin like money. Spend in MUSD. Redeem anytime.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
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
