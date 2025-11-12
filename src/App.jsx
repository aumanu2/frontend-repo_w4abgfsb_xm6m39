import { useState } from 'react'

function Input({ label, type = 'text', value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        {...props}
      />
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function Stat({ title, value }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-lg font-semibold text-gray-800">{value}</p>
    </div>
  )
}

function severityColor(sev) {
  switch (sev) {
    case 'high':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'medium':
      return 'bg-amber-50 border-amber-200 text-amber-800';
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
}

function App() {
  const [email, setEmail] = useState('')
  const [income, setIncome] = useState('5000')
  const [expenses, setExpenses] = useState('3500')
  const [savings, setSavings] = useState('8000')
  const [dependents, setDependents] = useState('0')
  const [risk, setRisk] = useState('medium')
  const [insHealth, setInsHealth] = useState(false)
  const [insRenters, setInsRenters] = useState(false)
  const [insAuto, setInsAuto] = useState(false)
  const [insLife, setInsLife] = useState(false)
  const [budgets, setBudgets] = useState(`{
  "groceries": 400,
  "dining": 200,
  "transport": 150
}`)
  const [txText, setTxText] = useState('date,description,merchant,category,amount,type\n2025-01-05,Grocery run,Whole Foods,groceries,180,debit\n2025-01-12,Uber rides,Uber,transport,62,debit\n2025-01-13,Paycheck,Employer,payroll,-2500,credit\n2025-01-15,Dinner out,Local Bistro,dining,85,debit')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [savedAlerts, setSavedAlerts] = useState([])

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  function parseBudgets(text) {
    if (!text?.trim()) return null
    try {
      return JSON.parse(text)
    } catch (e) {
      return null
    }
  }

  function parseTransactions(text) {
    if (!text.trim()) return []
    // Simple CSV parser; expects header line
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return []
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idx = {
      date: header.indexOf('date'),
      description: header.indexOf('description'),
      merchant: header.indexOf('merchant'),
      category: header.indexOf('category'),
      amount: header.indexOf('amount'),
      type: header.indexOf('type'),
    }
    const arr = []
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',')
      if (!parts.length) continue
      const obj = {
        date: idx.date >= 0 ? parts[idx.date] : null,
        description: idx.description >= 0 ? parts[idx.description] : '',
        merchant: idx.merchant >= 0 ? parts[idx.merchant] : null,
        category: idx.category >= 0 ? parts[idx.category] : null,
        amount: idx.amount >= 0 ? Number(parts[idx.amount]) : 0,
        type: idx.type >= 0 ? parts[idx.type] : null,
      }
      if (!isNaN(obj.amount)) arr.push(obj)
    }
    return arr
  }

  async function analyze() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const body = {
        profile: {
          email,
          monthly_income: Number(income) || 0,
          monthly_expenses: Number(expenses) || 0,
          savings: Number(savings) || 0,
          dependents: Number(dependents) || 0,
          risk_tolerance: risk,
          insurance_health: insHealth,
          insurance_renters: insRenters,
          insurance_auto: insAuto,
          insurance_life: insLife,
          budgets: parseBudgets(budgets),
        },
        transactions: parseTransactions(txText),
      }
      const res = await fetch(`${backend}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadAlerts() {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${backend}/api/alerts/${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const data = await res.json()
      setSavedAlerts(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Financial Protection Agent</h1>
          <nav className="text-sm text-gray-600 flex items-center gap-4">
            <a className="hover:text-gray-900" href="/test">System Check</a>
            <a className="hover:text-gray-900" href="https://" target="_blank" rel="noreferrer">Help</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Risk tolerance</span>
                <select value={risk} onChange={e=>setRisk(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
              <Input label="Monthly income ($)" type="number" value={income} onChange={e=>setIncome(e.target.value)} />
              <Input label="Monthly expenses ($)" type="number" value={expenses} onChange={e=>setExpenses(e.target.value)} />
              <Input label="Liquid savings ($)" type="number" value={savings} onChange={e=>setSavings(e.target.value)} />
              <Input label="Dependents" type="number" value={dependents} onChange={e=>setDependents(e.target.value)} />
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Toggle label="Health" checked={insHealth} onChange={e=>setInsHealth(e.target.checked)} />
              <Toggle label="Renters/Home" checked={insRenters} onChange={e=>setInsRenters(e.target.checked)} />
              <Toggle label="Auto" checked={insAuto} onChange={e=>setInsAuto(e.target.checked)} />
              <Toggle label="Life" checked={insLife} onChange={e=>setInsLife(e.target.checked)} />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Budgets (optional)</h2>
            <p className="text-xs text-gray-500 mb-2">Provide a JSON object with category: monthly limit</p>
            <textarea
              value={budgets}
              onChange={e=>setBudgets(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Recent Transactions</h2>
            <p className="text-xs text-gray-500 mb-2">CSV format with header: date,description,merchant,category,amount,type</p>
            <textarea
              value={txText}
              onChange={e=>setTxText(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={analyze} disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Analyzing…' : 'Analyze Protection'}
              </button>
              <button onClick={loadAlerts} disabled={!email || loading} className="rounded-md bg-gray-700 px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-50">
                Load Saved Alerts
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          {!result ? (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-gray-600 text-sm">Run an analysis to see your protection score, risks, and recommendations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Protection Overview</h2>
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold" style={{backgroundColor:'#EEF2FF', borderColor:'#C7D2FE', color:'#3730A3'}}>
                    Score: {result.score}/100
                  </span>
                </div>
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{result.summary}</p>
                {result.stats && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Stat title="Monthly income" value={`$${result.stats.monthly_income?.toFixed?.(2) ?? result.stats.monthly_income}`} />
                    <Stat title="Monthly expenses" value={`$${result.stats.monthly_expenses?.toFixed?.(2) ?? result.stats.monthly_expenses}`} />
                    <Stat title="Net cash flow" value={`$${result.stats.monthly_net}`} />
                    <Stat title="Savings" value={`$${result.stats.savings}`} />
                    <Stat title="Emergency coverage" value={`${result.stats.burn_rate_months} mo`} />
                    <Stat title="Recent spending" value={`$${result.stats.total_spend}`} />
                  </div>
                )}
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Active Alerts</h3>
                {result.alerts?.length ? (
                  <ul className="space-y-3">
                    {result.alerts.map((a, idx) => (
                      <li key={idx} className={`rounded-lg border p-3 ${severityColor(a.severity)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{a.alert_type.replace(/_/g,' ')}</span>
                          <span className="text-xs uppercase tracking-wide opacity-80">{a.severity}</span>
                        </div>
                        <p className="text-sm mt-1">{a.message}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No alerts at this time.</p>
                )}
              </div>

              {savedAlerts?.length > 0 && (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Saved Alerts</h3>
                  <ul className="space-y-3">
                    {savedAlerts.map((a, idx) => (
                      <li key={idx} className={`rounded-lg border p-3 ${severityColor(a.severity)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{a.alert_type.replace(/_/g,' ')}</span>
                          <span className="text-xs uppercase tracking-wide opacity-80">{a.severity}</span>
                        </div>
                        <p className="text-sm mt-1">{a.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        Built with care. Backend: {backend}
      </footer>
    </div>
  )
}

export default App
