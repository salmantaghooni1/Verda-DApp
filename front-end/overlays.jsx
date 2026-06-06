/* ============================================================
   VERDA · overlays.jsx — tx flow modal, wallet popup, toasts, demo bar
   ============================================================ */
const useDApp2 = () => React.useContext(window.DAppCtx);

/* ---------- Transaction step definitions ---------- */
const TX_STEPS = [
  { key: 'prepare', title: 'Preparing transaction', desc: 'Encoding call data & estimating gas' },
  { key: 'confirm', title: 'Awaiting your confirmation', desc: 'Approve the request in your wallet' },
  { key: 'submit',  title: 'Transaction submitted', desc: 'Broadcast to the network' },
  { key: 'mining',  title: 'Waiting for confirmation', desc: 'Sealing into a block' },
  { key: 'done',    title: 'Investment completed', desc: 'Funds are now earning yield' },
];
const WITHDRAW_STEPS = [
  { key: 'prepare', title: 'Preparing withdrawal', desc: 'Encoding call data & estimating gas' },
  { key: 'confirm', title: 'Awaiting your confirmation', desc: 'Approve the request in your wallet' },
  { key: 'submit',  title: 'Transaction submitted', desc: 'Broadcast to the network' },
  { key: 'mining',  title: 'Waiting for confirmation', desc: 'Sealing into a block' },
  { key: 'done',    title: 'Returns withdrawn', desc: 'Sent to your wallet' },
];

/* ============================================================
   TRANSACTION FLOW MODAL
   ============================================================ */
function TxModal() {
  const { tx, closeTx, chain, confirmInWallet, rejectInWallet } = useDApp2();
  const c = window.CHAINS[chain];
  if (tx.status === 'idle') return null;

  const steps = tx.kind === 'withdraw' ? WITHDRAW_STEPS : TX_STEPS;
  const stepIndex = tx.stepIndex;
  const isError = tx.status === 'error';
  const isSuccess = tx.status === 'success';

  /* wallet confirmation popup (step "confirm") */
  if (tx.status === 'awaiting') {
    return (
      <div className="overlay">
        <div className="wpop">
          <div className="wpop-head">
            <span className={'wl ' + (chain === 'ethereum' ? 'mm' : 'ph')} aria-hidden>
              <span style={{ fontSize: 16 }}>{chain === 'ethereum' ? '🦊' : '👻'}</span>
            </span>
            <b>{c.wallet}</b>
            <span className="net">{c.network}</span>
          </div>
          <div className="wpop-body">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
              {tx.kind === 'withdraw' ? 'Withdraw request' : 'Deposit request'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Verda Vault wants to {tx.kind === 'withdraw' ? 'send' : 'receive'} funds</div>
            <div className="wpop-row"><span className="k">{tx.kind === 'withdraw' ? 'Amount out' : 'Amount'}</span><span className="mono" style={{ fontWeight: 700 }}>{window.fmtNum(tx.amount, c.decimals)} {c.symbol}</span></div>
            <div className="wpop-row"><span className="k">To contract</span><span className="mono">{window.shortAddr('0xVerdaVault000000000a1b2c3d4e5f6789', 6, 4)}</span></div>
            <div className="wpop-row"><span className="k">Network fee</span><span className="mono">~0.0012 {c.symbol}</span></div>
            <div className="wpop-actions">
              <button className="btn btn-ghost" onClick={rejectInWallet}>Reject</button>
              <button className="btn btn-primary" onClick={confirmInWallet}>Confirm</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={(isSuccess || isError) ? closeTx : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isSuccess ? 'Transaction confirmed' : isError ? 'Transaction failed' : tx.kind === 'withdraw' ? 'Withdrawing returns' : 'Confirming investment'}</h3>
          {(isSuccess || isError) && <button className="iconbtn" style={{ width: 34, height: 34 }} onClick={closeTx}>{window.I.x}</button>}
        </div>

        {isSuccess && (
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div className="modal-success-ic">{window.I.check}</div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{tx.kind === 'withdraw' ? 'Returns withdrawn successfully' : 'Investment completed'}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
              {window.fmtNum(tx.amount, c.decimals)} {c.symbol} {tx.kind === 'withdraw' ? 'sent to your wallet' : 'is now earning yield'}
            </div>
          </div>
        )}

        {!isSuccess && (
          <div className="timeline">
            {steps.map((s, i) => {
              let cls = '';
              if (isError && i === stepIndex) cls = 'error';
              else if (i < stepIndex) cls = 'done';
              else if (i === stepIndex) cls = 'active';
              return (
                <div className={'tl-step ' + cls} key={s.key}>
                  <div className="tl-rail">
                    <div className="tl-node">
                      {cls === 'done' ? window.I.check
                        : cls === 'error' ? window.I.x
                        : cls === 'active' ? <span className="spin spin-light" />
                        : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                    </div>
                    {i < steps.length - 1 && <div className="tl-line" />}
                  </div>
                  <div className="tl-text">
                    <div className="tl-title">{cls === 'error' && i === stepIndex ? (tx.error?.title || s.title) : s.title}</div>
                    <div className="tl-desc">{cls === 'error' && i === stepIndex ? tx.error?.desc : s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* receipt — shown once hash exists */}
        {(tx.hash && (tx.stepIndex >= 2 || isSuccess)) && !isError && (
          <div className="receipt">
            <div className="rc-row"><span className="k">Transaction hash</span>
              <a className="v tx-link" href={`https://${c.explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer">{window.shortAddr(tx.hash, 8, 6)} {window.I.ext}</a>
            </div>
            {tx.block && <div className="rc-row"><span className="k">Block</span><span className="v">#{tx.block.toLocaleString()}</span></div>}
            {tx.gas && <div className="rc-row"><span className="k">Gas used</span><span className="v">{tx.gas.toLocaleString()}</span></div>}
            <div className="rc-row"><span className="k">View on</span>
              <a className="v tx-link" href={`https://${c.explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer">{c.explorerName} {window.I.ext}</a>
            </div>
          </div>
        )}

        {isError && (
          <button className="btn btn-ghost btn-block mt24" onClick={closeTx}>Dismiss</button>
        )}
        {isSuccess && (
          <button className="btn btn-primary btn-block mt24" onClick={closeTx}>Done</button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TOASTS
   ============================================================ */
function Toasts() {
  const { toasts } = useDApp2();
  return (
    <div className="toasts">
      {toasts.map(t => (
        <div className={'toast ' + (t.kind || 'brand')} key={t.id}>
          <span className="t-ic">{t.kind === 'pos' ? window.I.check : window.I.bolt}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   DEMO / SCENARIO BAR  (lets reviewer trigger edge states)
   ============================================================ */
function DemoBar() {
  const { scenarios, toggleScenario, wallet, simulateWrongNetwork } = useDApp2();
  return (
    <div className="demo-bar">
      <span className="dl">{window.I.flask} Demo states</span>
      <button className={'demo-chip' + (scenarios.reject ? ' on' : '')} onClick={() => toggleScenario('reject')}>
        Reject next tx
      </button>
      <button className={'demo-chip' + (scenarios.insufficient ? ' on' : '')} onClick={() => toggleScenario('insufficient')}>
        Insufficient funds
      </button>
      <button className={'demo-chip' + (scenarios.contract ? ' on' : '')} onClick={() => toggleScenario('contract')}>
        Contract error
      </button>
      <button className="demo-chip" disabled={wallet.status === 'disconnected'} onClick={simulateWrongNetwork}>
        Wrong network
      </button>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto' }}>Simulated wallet — no real funds</span>
    </div>
  );
}

window.VerdaOverlays = { TxModal, Toasts, DemoBar };
