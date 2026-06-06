import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function ErrorBanner() {
  const { error, clearError } = useDApp()

  if (!error) return null

  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 8,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ color: '#ef4444', marginTop: 2 }}>{Icons.alert}</span>
        <div>
          <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: 2 }}>{error.title}</div>
          <div style={{ fontSize: 13, color: '#ef4444', opacity: 0.8 }}>{error.desc}</div>
        </div>
      </div>
      <button
        onClick={clearError}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#ef4444',
          padding: 0,
          marginTop: 2,
        }}
      >
        {Icons.x}
      </button>
    </div>
  )
}
