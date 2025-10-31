"use client"

import Link from "next/link"
import { WalletButton } from "@/components/wallet-button"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image className="h-12 w-12 rounded-lg bg-linear-to-r from-primary to-primary/70 hover:scale-105 transition-all duration-200"
            src="/logo.jpg" alt="MezoPay" width={50} height={50} />
            <span className="text-2xl font-bold">
              <span className="text-primary">Mezo</span>
              <span className="text-foreground">Pay</span>
            </span>
          </Link>

          {/* Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/pockets"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Pockets
            </Link>
            <Link
              href="/pay"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Pay
            </Link>
            <Link
              href="/redeem"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Redeem
            </Link>
            <Link
              href="/activity"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Activity
            </Link>
            {/* <Link
              href="#help"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Help
            </Link> */}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
