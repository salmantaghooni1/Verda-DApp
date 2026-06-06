import { useDApp } from '@services/DAppContext'
import type { Scenario } from '@types'

const LABELS: Record<keyof Scenario, string> = {
  reject:       'Reject TX',
  insufficient: 'Low funds',
  contract:     'Revert',
}

export function DemoBar() {
  const { scenarios, toggleScenario } = useDApp()

  if (import.meta.env.PROD) return null

  return (
    <div className="demo-bar">
      <span className="demo-bar__label">Demo</span>
      {(Object.keys(LABELS) as (keyof Scenario)[]).map(k => (
        <button
          key={k}
          className={`demo-bar__pill${scenarios[k] ? ' demo-bar__pill--on' : ''}`}
          onClick={() => toggleScenario(k)}
          aria-pressed={scenarios[k]}
        >
          {LABELS[k]}
        </button>
      ))}
    </div>
  )
}
