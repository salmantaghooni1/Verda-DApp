import { useDApp } from '@services/DAppContext'

export function Toasts() {
  const { toasts } = useDApp()

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            animation: 'slideIn 0.3s ease-out',
            background: toast.kind === 'pos' ? '#10b981' : '#627EEA',
            color: 'white',
            maxWidth: 280,
          }}
        >
          {toast.msg}
        </div>
      ))}
    </div>
  )
}
