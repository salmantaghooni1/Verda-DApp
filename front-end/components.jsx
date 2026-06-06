/* ============================================================
   VERDA · components.jsx — presentational + interactive UI
   Consumes window.DAppCtx provided by app.jsx
   ============================================================ */
const { useState, useEffect, useRef, useContext } = React;

const useDApp = () => useContext(window.DAppCtx);

/* ---------- Chain dot ---------- */
function ChainDot({ chain, style }) {
  const c = window.CHAINS[chain];
  return <span className="chain-dot" style={{ background: c.color, ...style }} />;
}

/* ============================================================
   HEADER
   ============================================================ */
function Header() {
  const { chain, setChain, theme, toggleTheme, wallet } = useDApp();
  return (
    <header className="hdr">
      <div className="hdr-in">
        <div className="brand">
          <div className="brand-mark">{window.I.logo}</div>
          <div>
            <div className="brand-name">Ver<b>da</b></div>
            <div className="brand-tag">On-chain Yield</div>
          </div>
        </div>

        <div className="seg" role="tablist" aria-label="Network">
          {Object.values(window.CHAINS).map(c => (
            <button key={c.id} className={chain === c.id ? 'on' : ''} onClick={() => setChain(c.id)} role="tab" aria-selected={chain === c.id}>
              <span className="chain-dot" style={{ background: c.color }} />
              <span className="lbl">{c.name}</span>
            </button>
          ))}
        </div>

        <button className="iconbtn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme === 'dark' ? window.I.sun : window.I.moon}
        </button>

        <WalletButton compact />
      </div>
    </header>
  );
}

/* ============================================================
   WALLET BUTTON (header)
   ============================================================ */
function WalletButton() {
  const { wallet, chain, connect, disconnect } = useDApp();
  const c = window.CHAINS[chain];
  const [open, setOpen] = useState(false);

  if (wallet.status === 'connecting') {
    return <button className="btn btn-ghost" disabled><span className="spin spin-light" /> Connecting…</button>;
  }
  if (wallet.status === 'connected' || wallet.status === 'wrong-network') {
    return (
      <div style={{ position: 'relative' }}>
        <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>
          <span className="id-blob" style={{ width: 18, height: 18, borderRadius: 6, ...window.blobStyle(c.address) }} />
          <span className="mono">{window.shortAddr(c.address)}</span>
        </button>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
            <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 250, padding: 8, zIndex: 10, borderRadius: 16 }}>
              <div style={{ padding: '12px 12px 14px', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>Connected with {c.wallet}</div>
                <div className="mono" style={{ fontSize: 12.5, marginTop: 4, wordBreak: 'break-all' }}>{window.shortAddr(c.address, 10, 8)}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }} className="tnum">{window.fmtNum(c.balance, c.decimals)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{c.symbol}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 8, justifyContent: 'flex-start' }}
                onClick={() => { disconnect(); setOpen(false); }}>
                {window.I.x} Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  return <button className="btn btn-primary" onClick={connect}>{window.I.wallet} Connect Wallet</button>;
}

/* ============================================================
   PAGE HEAD
   ============================================================ */
function PageHead() {
  const { wallet } = useDApp();
  return (
    <div className="pagehead">
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Portfolio overview</div>
        <h1>Grow your assets, transparently.</h1>
        <p>Deposit, track yield, and withdraw — every action settled on-chain.</p>
      </div>
      <div className="live-pill"><span className="live-dot" /> Live · syncing on-chain events</div>
    </div>
  );
}

/* ============================================================
   PORTFOLIO HERO CARD
   ============================================================ */
function PortfolioCard() {
  const { chain, wallet, portfolio, lastUpdate, connect } = useDApp();
  const c = window.CHAINS[chain];
  const connected = wallet.status === 'connected' || wallet.status === 'wrong-network';
  const total = portfolio.invested + portfolio.returns;
  const series = useRef(window.genSeries(total || 1)).current;
  const pct = portfolio.invested > 0 ? (portfolio.returns / portfolio.invested) * 100 : 0;

  return (
    <div className="pf">
      <div className="pf-top">
        <span className="eyebrow">My Portfolio</span>
        {connected && (
          <span className="pf-wallet">
            <span className="id-blob" style={window.blobStyle(c.address)} />
            <span className="mono">{window.shortAddr(c.address)}</span>
          </span>
        )}
      </div>

      <div className="pf-total-label">Total position value</div>
      <div className="pf-total">
        <span className="amt tnum">{window.fmtNum(total, c.decimals)}</span>
        <span className="unit">{c.symbol}</span>
      </div>
      <div className="pf-delta">{window.I.arrowUp} +{window.fmtNum(portfolio.returns, c.decimals)} {c.symbol} · {pct.toFixed(1)}% all-time</div>

      <svg className="pf-spark" viewBox="0 0 520 64" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={window.sparkPath(series, 520, 64) + ' L518,62 L2,62 Z'} fill="url(#sparkfill)" />
        <path d={window.sparkPath(series, 520, 64)} fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="pf-breakdown">
        <div>
          <div className="pf-mini-label"><span className="swatch" style={{ background: 'var(--brand)' }} /> Principal invested</div>
          <div className="pf-mini-val tnum">{window.fmtNum(portfolio.invested, c.decimals)}<span className="u">{c.symbol}</span></div>
        </div>
        <div>
          <div className="pf-mini-label"><span className="swatch" style={{ background: 'var(--positive)' }} /> Accrued returns</div>
          <div className="pf-mini-val tnum" style={{ color: 'var(--positive)' }}>+{window.fmtNum(portfolio.returns, c.decimals)}<span className="u">{c.symbol}</span></div>
        </div>
      </div>
      <div className="pf-updated">{window.I.clock} Last updated {lastUpdate}</div>

      {!connected && (
        <div className="locked">
          <div className="locked-in">
            <div className="lk-ic">{window.I.lock}</div>
            <h4>Your portfolio is private</h4>
            <p>Connect {c.wallet} to view balances, deposit funds and claim returns.</p>
            <button className="btn btn-primary btn-block" onClick={connect}>{window.I.wallet} Connect Wallet</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PROTOCOL STATS COLUMN
   ============================================================ */
function StatsColumn() {
  const { chain, protocol, statFlash } = useDApp();
  const c = window.CHAINS[chain];
  const items = [
    { key: 'tvl', ic: window.I.bank, label: 'Total Value Locked', val: window.fmtNum(protocol.tvl, c.decimals), u: c.symbol },
    { key: 'investors', ic: window.I.users, label: 'Active Investors', val: protocol.investors.toLocaleString(), u: '' },
    { key: 'apr', ic: window.I.trend, label: 'Current APR', val: protocol.apr.toFixed(1), u: '%' },
  ];
  return (
    <div className="stats-col">
      {items.map(it => (
        <div className="stat" key={it.key}>
          <div className="stat-ic">{it.ic}</div>
          <div className="stat-body">
            <div className="stat-label">{it.label}</div>
            <div className={'stat-val tnum' + (statFlash === it.key ? ' flash' : '')}>
              {it.val}{it.u && <span className="u">{it.u}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   INVESTMENT FORM
   ============================================================ */
function InvestmentForm() {
  const { chain, wallet, amount, setAmount, invest, protocol, scenarios } = useDApp();
  const c = window.CHAINS[chain];
  const connected = wallet.status === 'connected';
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState(null);
  const bal = scenarios.insufficient ? 0.04 : c.balance;

  const num = parseFloat(amount);
  let err = '';
  if (amount !== '' ) {
    if (isNaN(num)) err = 'Enter a valid number';
    else if (num <= 0) err = 'Amount must be greater than 0';
    else if (num > bal) err = 'Amount exceeds your balance';
  }
  const valid = !err && num > 0;
  const estReturn = valid ? num * (protocol.apr / 100) : 0;

  const setPct = (p) => {
    setActive(p);
    const v = bal * (p / 100);
    setAmount(p === 100 ? String(+bal.toFixed(c.decimals)) : String(+v.toFixed(c.decimals)));
  };

  return (
    <div className="card card-pad">
      <div className="card-head">
        <div className="card-title">{window.I.coins} Invest</div>
        <span className="apr-chip" style={{ marginTop: 0 }}>{window.I.trend} {protocol.apr.toFixed(1)}% APR</span>
      </div>

      <label className="field-foot" style={{ marginBottom: 6, justifyContent: 'space-between' }}>
        <span className="bal" style={{ fontWeight: 600 }}>Amount to deposit</span>
      </label>

      <div className="amt-field">
        <div className={'amt-input-wrap' + (focus ? ' focus' : '') + (err ? ' err' : '')}>
          <input className="amt-input" inputMode="decimal" placeholder="0.00" value={amount}
            disabled={!connected}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            onChange={e => { setAmount(e.target.value); setActive(null); }} />
          <span className="amt-unit"><ChainDot chain={chain} /> {c.symbol}</span>
        </div>
        <div className="field-foot">
          <span className="bal">Balance: <b className="tnum">{window.fmtNum(bal, c.decimals)} {c.symbol}</b></span>
          {err ? <span className="err-msg">{window.I.alert} {err}</span>
               : <span className="bal" style={{ color: 'var(--text-faint)' }}>≈ ${window.fmtNum(num * 3120 || 0, 2)} USD</span>}
        </div>
      </div>

      <div className="quick">
        {[25, 50, 75, 100].map(p => (
          <button key={p} className={active === p ? 'on' : ''} disabled={!connected} onClick={() => setPct(p)}>
            {p === 100 ? 'MAX' : p + '%'}
          </button>
        ))}
      </div>

      <div className={'preview' + (valid ? '' : ' empty')}>
        <div className="prow"><span className="k">{window.I.bolt} You deposit</span><span className="v tnum">{valid ? window.fmtNum(num, c.decimals) : '0.00'} {c.symbol}</span></div>
        <div className="prow"><span className="k">{window.I.spark} Est. annual return</span><span className="v pos tnum">+{window.fmtNum(estReturn, c.decimals)} {c.symbol}</span></div>
        <div className="prow"><span className="k">{window.I.doc} Network fee (est.)</span><span className="v tnum">~0.0012 {c.symbol}</span></div>
        <div className="prow total"><span className="k" style={{ fontWeight: 700, color: 'var(--text)' }}>Projected 1-yr value</span><span className="v tnum">{window.fmtNum(num + estReturn || 0, c.decimals)} {c.symbol}</span></div>
      </div>

      <button className="btn btn-primary btn-lg mt24" disabled={!connected || !valid} onClick={invest}>
        {window.I.shield} {connected ? 'Invest securely' : 'Connect wallet to invest'}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, fontSize: 11.5, color: 'var(--text-faint)' }}>
        {window.I.shield} Audited contract · Non-custodial · You keep your keys
      </div>
    </div>
  );
}

/* ============================================================
   RETURNS CARD
   ============================================================ */
function ReturnsCard() {
  const { chain, wallet, portfolio, withdraw, protocol } = useDApp();
  const c = window.CHAINS[chain];
  const connected = wallet.status === 'connected';
  const has = portfolio.returns > 0;
  return (
    <div className="card card-pad">
      <div className="card-head">
        <div className="card-title">{window.I.coins} Available Returns</div>
      </div>
      <div className="returns-hero">
        <div className="rlabel">Ready to withdraw</div>
        <div className="rval tnum">+{window.fmtNum(portfolio.returns, c.decimals)}<span className="u">{c.symbol}</span></div>
        <div className="rsub">Yield accrues continuously at {protocol.apr.toFixed(1)}% APR</div>
        <div className="apr-chip">{window.I.trend} Auto-compounding</div>
      </div>
      <button className="btn btn-ghost btn-block" disabled={!connected || !has} onClick={withdraw}>
        {window.I.arrowDn} {has ? 'Withdraw Returns' : 'No returns to withdraw'}
      </button>
    </div>
  );
}

/* ============================================================
   ACTIVITY FEED (live event listener)
   ============================================================ */
function ActivityFeed() {
  const { feed, chain } = useDApp();
  const c = window.CHAINS[chain];
  return (
    <div className="card card-pad">
      <div className="card-head">
        <div className="card-title">{window.I.bolt} Live Activity</div>
        <span className="live-pill" style={{ padding: '5px 10px', fontSize: 11 }}><span className="live-dot" /> on-chain</span>
      </div>
      <div className="feed">
        {feed.map(ev => (
          <div className={'feed-item' + (ev.fresh ? ' fresh' : '')} key={ev.id}>
            <div className={'feed-ic ' + (ev.type === 'withdraw' ? '' : 'in')}>{ev.type === 'withdraw' ? window.I.arrowDn : window.I.arrowUp}</div>
            <div className="feed-body">
              <div className="feed-t">
                {ev.you ? <b>You</b> : <span className="who">{ev.who}</span>} {ev.type === 'withdraw' ? 'withdrew returns' : 'invested'}
              </div>
              <div className="feed-sub">{ev.label} · {ev.time}</div>
            </div>
            <div className={'feed-amt ' + (ev.type === 'withdraw' ? '' : 'pos')}>
              {ev.type === 'withdraw' ? '−' : '+'}{window.fmtNum(ev.amount, c.decimals)} {c.symbol}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   TRANSACTION HISTORY
   ============================================================ */
function History() {
  const { history, chain } = useDApp();
  const c = window.CHAINS[chain];
  return (
    <div className="card card-pad section-gap">
      <div className="card-head">
        <div className="card-title">{window.I.doc} Transaction History</div>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{history.length} on-chain</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr><th>Type</th><th>Amount</th><th>Time</th><th>Status</th><th className="r">Transaction</th></tr>
          </thead>
          <tbody>
            {history.length === 0 && <tr><td colSpan="5" className="empty-row">No transactions yet — your first deposit will appear here.</td></tr>}
            {history.map(tx => (
              <tr key={tx.id}>
                <td><span className={'tag ' + tx.type}>{tx.type === 'withdraw' ? window.I.arrowDn : window.I.arrowUp}{tx.type === 'withdraw' ? 'Withdraw' : 'Invest'}</span></td>
                <td className="tnum" style={{ fontWeight: 700 }}>{tx.type === 'withdraw' ? '−' : '+'}{window.fmtNum(tx.amount, c.decimals)} {c.symbol}</td>
                <td style={{ color: 'var(--text-muted)' }}>{tx.time}</td>
                <td><span className="tag withdraw" style={{ background: 'var(--positive-soft)', color: 'var(--positive)' }}>{window.I.check} Confirmed</span></td>
                <td className="r">
                  <a className="tx-link mono" href={`https://${c.explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer" title={tx.hash}>
                    {window.shortAddr(tx.hash, 8, 6)} {window.I.ext}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   BANNERS
   ============================================================ */
function NetworkBanner() {
  const { wallet, switchNetwork, chain } = useDApp();
  if (wallet.status !== 'wrong-network') return null;
  const c = window.CHAINS[chain];
  return (
    <div className="netbanner">
      <span className="nb-ic">{window.I.alert}</span>
      <span className="nb-t">Wrong network detected. Switch to {c.name} {c.network} to continue.</span>
      <button onClick={switchNetwork}>{window.I.swap} Switch Network</button>
    </div>
  );
}

function ErrorBanner() {
  const { error, clearError } = useDApp();
  if (!error) return null;
  return (
    <div className="errbanner">
      <span className="eb-ic">{window.I.alert}</span>
      <div className="eb-body">
        <div className="eb-t">{error.title}</div>
        <div className="eb-d">{error.desc}</div>
      </div>
      <button className="eb-x" onClick={clearError} aria-label="Dismiss">{window.I.x}</button>
    </div>
  );
}

window.VerdaUI = {
  Header, WalletButton, PageHead, PortfolioCard, StatsColumn,
  InvestmentForm, ReturnsCard, ActivityFeed, History, NetworkBanner, ErrorBanner, ChainDot,
};
