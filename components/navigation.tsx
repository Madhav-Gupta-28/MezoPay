"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm group-hover:shadow-md transition-shadow" />
            <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              M-Pockets
            </span>
          </Link>

          {/* Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Home
            </Link>
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
              href="/activity"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Activity
            </Link>
            <Link
              href="#help"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors duration-200"
            >
              Help
            </Link>
          </div>

          {/* Connect Button */}
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all duration-200">
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  )
}
