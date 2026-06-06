import { useState, useEffect } from 'react'
import { useDApp } from '@services/DAppContext'
import { walletService } from '@services/wallet'
import { Icons } from '@utils/icons'

const CHAIN_META = {
  ethereum: { name: 'Ethereum', color: '#627EEA' },
  solana:   { name: 'Solana',   color: '#9945FF' },
} as const

export function Header() {
  const { chain, setChain, theme, toggleTheme, wallet, connect, disconnect, switchNetwork } = useDApp()
  const [walletOpen, setWalletOpen] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    return walletService.subscribe(s => setAddress(s.address))
  }, [])

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '0x???'

  return (
    <header className="hdr">
      <div className="hdr-in">
        <div className="brand">
          <div className="brand-mark">{Icons.logo}</div>
          <div>
            <div className="brand-name">Ver<b>da</b></div>
            <div className="brand-tag">On-chain Yield</div>
          </div>
        </div>

        <div className="seg" role="tablist">
          {(['ethereum', 'solana'] as const).map(c => (
            <button
              key={c}
              className={chain === c ? 'on' : ''}
              onClick={() => setChain(c)}
              role="tab"
              aria-selected={chain === c}
            >
              <span className="chain-dot" style={{ background: CHAIN_META[c].color }} />
              <span className="lbl">{CHAIN_META[c].name}</span>
            </button>
          ))}
        </div>

        <button className="iconbtn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? Icons.sun : Icons.moon}
        </button>

        {wallet.status === 'connecting' ? (
          <button className="btn btn-ghost" disabled>
            <span className="spin" /> Connecting…
          </button>
        ) : wallet.status === 'wrong-network' ? (
          <button className="btn btn-primary" onClick={switchNetwork}>
            {Icons.swap} Switch Network
          </button>
        ) : wallet.status === 'connected' && address ? (
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost" onClick={() => setWalletOpen(o => !o)}>
              <span
                className="id-blob"
                style={{ width: 18, height: 18, borderRadius: 6, display: 'inline-block', background: addrGradient(address) }}
              />
              <span className="mono">{shortAddr}</span>
            </button>

            {walletOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setWalletOpen(false)} />
                <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 260, padding: 8, zIndex: 10 }}>
                  <div style={{ padding: '12px 12px 14px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Connected via MetaMask
                    </div>
                    <div className="mono" style={{ fontSize: 12, marginTop: 6, wordBreak: 'break-all', color: 'var(--text)' }}>
                      {address}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-block"
                    style={{ marginTop: 8, justifyContent: 'flex-start', gap: 8 }}
                    onClick={() => { disconnect(); setWalletOpen(false) }}
                  >
                    {Icons.x} Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={connect}>
            {Icons.wallet} Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}

function addrGradient(addr: string): string {
  let h = 0
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) % 360
  return `linear-gradient(135deg, oklch(0.7 0.15 ${h}), oklch(0.6 0.16 ${(h + 60) % 360}))`
}
