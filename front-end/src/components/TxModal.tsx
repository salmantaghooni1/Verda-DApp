import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function TxModal() {
  const { tx, confirmInWallet, rejectInWallet, closeTx, chain } = useDApp()
  const symbol = chain === 'ethereum' ? 'ETH' : 'SOL'

  if (tx.status === 'idle') return null

  const steps = [
    { label: 'Confirm', done: tx.stepIndex > 1 },
    { label: 'Submit', done: tx.stepIndex > 2 },
    { label: 'Mining', done: tx.stepIndex > 3 },
    { label: 'Complete', done: tx.stepIndex > 4 },
  ]

  const isError = tx.status === 'error'
  const isSuccess = tx.status === 'success'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="card" style={{ maxWidth: 500, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {isError ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{Icons.alert}</div>
              <h2 style={{ margin: 0, color: '#ef4444' }}>{tx.error?.title}</h2>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>{tx.error?.desc}</p>
            </>
          ) : isSuccess ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12, color: '#10b981' }}>{Icons.check}</div>
              <h2 style={{ margin: 0, color: '#10b981' }}>Transaction Successful!</h2>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 2s linear infinite' }}>{Icons.clock}</div>
              <h2 style={{ margin: 0 }}>Confirm Transaction</h2>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Please sign the transaction in your wallet
              </p>
            </>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Type</div>
              <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{tx.kind}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Amount</div>
              <div style={{ fontWeight: 700 }}>{tx.amount} {symbol}</div>
            </div>
          </div>
          {tx.hash && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Hash</div>
              <div className="mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>{tx.hash.slice(0, 20)}...{tx.hash.slice(-10)}</div>
            </div>
          )}
          {tx.block && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Block</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{tx.block.toLocaleString()}</div>
            </div>
          )}
          {tx.gas && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Gas</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{tx.gas.toLocaleString()} units</div>
            </div>
          )}
        </div>

        {!isError && !isSuccess && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: step.done ? '#10b981' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 6px',
                      color: step.done ? 'white' : 'var(--text-muted)',
                      fontWeight: 700,
                    }}
                  >
                    {step.done ? Icons.check : i + 1}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {tx.status === 'awaiting' && (
            <>
              <button className="btn btn-ghost btn-block" onClick={rejectInWallet}>
                Reject
              </button>
              <button className="btn btn-primary btn-block" onClick={confirmInWallet}>
                Confirm in Wallet
              </button>
            </>
          )}
          {(isError || isSuccess) && (
            <button className="btn btn-primary btn-block" onClick={closeTx}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
