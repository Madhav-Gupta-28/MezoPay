'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button 
                    onClick={openConnectModal}
                    variant="outline"
                    className="gap-2 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button 
                    onClick={openChainModal}
                    variant="destructive"
                  >
                    Wrong network
                  </Button>
                )
              }

              return (
                <div className="flex gap-2">
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex border-border/50 bg-transparent"
                  >
                    {chain.name}
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    variant="outline" 
                    className="border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
                  >
                    {account.displayName}
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
