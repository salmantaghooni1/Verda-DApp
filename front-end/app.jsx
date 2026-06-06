/* ============================================================
   VERDA · app.jsx — state machine, tx flow, live events, layout
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function App() {
  /* ---- theme + chain ---- */
  const [theme, setTheme] = useState(() => localStorage.getItem('verda.theme') || 'dark');
  const [chain, setChainState] = useState(() => localStorage.getItem('verda.chain') || 'ethereum');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('verda.theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('verda.chain', chain); }, [chain]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  /* ---- wallet ---- */
  const [wallet, setWallet] = useState(() => new URLSearchParams(location.search).get('demo') ? { status: 'connected' } : { status: 'disconnected' });

  /* ---- per-chain portfolio + protocol (mutable copies) ---- */
  const [pf, setPf] = useState(() => ({
    ethereum: { ...window.CHAINS.ethereum.portfolio },
    solana: { ...window.CHAINS.solana.portfolio },
  }));
  const [proto, setProto] = useState(() => ({
    ethereum: { ...window.CHAINS.ethereum.protocol },
    solana: { ...window.CHAINS.solana.protocol },
  }));
  const portfolio = pf[chain];
  const protocol = proto[chain];

  const [lastUpdate, setLastUpdate] = useState(window.nowTime());
  const [statFlash, setStatFlash] = useState(null);

  /* ---- form ---- */
  const [amount, setAmount] = useState('');

  /* ---- tx state machine ---- */
  const _demo = new URLSearchParams(location.search).get('demo');
  const [tx, setTx] = useState(() => _demo === 'invest'
    ? { status: 'awaiting', kind: 'invest', stepIndex: 1, hash: null, block: null, gas: null, amount: 1, error: null }
    : _demo === 'mining'
    ? { status: 'pending', kind: 'invest', stepIndex: 3, hash: '0x9a3f7c2b8e1d4056a7b9c0d1e2f3a4b5c6d7e8f90123456789abcdef01234567', block: 19503421, gas: null, amount: 1, error: null }
    : _demo === 'success'
    ? { status: 'success', kind: 'invest', stepIndex: 4, hash: '0x9a3f7c2b8e1d4056a7b9c0d1e2f3a4b5c6d7e8f90123456789abcdef01234567', block: 19503421, gas: 72418, amount: 1, error: null }
    : { status: 'idle', kind: 'invest', stepIndex: 0, hash: null, block: null, gas: null, amount: 0, error: null });

  /* ---- error banner + scenarios ---- */
  const [error, setError] = useState(null);
  const [scenarios, setScenarios] = useState({ reject: false, insufficient: false, contract: false });

  /* ---- toasts ---- */
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((msg, kind = 'brand', ttl = 3200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl);
  }, []);

  /* ---- activity feed ---- */
  const seedFeed = () => {
    const c = window.CHAINS[chain];
    return [0, 1, 2, 3].map((_, i) => ({
      id: 'seed' + chain + i,
      who: c.feedAddrs[i % c.feedAddrs.length],
      amount: +(Math.random() * (c.symbol === 'SOL' ? 40 : 1.5) + 0.2).toFixed(c.decimals),
      type: Math.random() > 0.78 ? 'withdraw' : 'invest',
      label: 'InvestmentMade',
      time: ['2m ago', '6m ago', '11m ago', '18m ago'][i],
      you: false, fresh: false,
    }));
  };
  const [feedMap, setFeedMap] = useState(() => ({ ethereum: seedFeedFor('ethereum'), solana: seedFeedFor('solana') }));
  const feed = feedMap[chain];

  /* ---- history ---- */
  const [historyMap, setHistoryMap] = useState({ ethereum: [], solana: [] });
  const history = historyMap[chain];

  /* ========================================================
     CHAIN SWITCH
     ======================================================== */
  const setChain = (id) => {
    if (id === chain) return;
    setChainState(id);
    setAmount('');
    setError(null);
    setLastUpdate(window.nowTime());
  };

  /* ========================================================
     WALLET ACTIONS
     ======================================================== */
  const connect = async () => {
    setError(null);
    setWallet({ status: 'connecting' });
    await sleep(1400);
    setWallet({ status: 'connected' });
    setLastUpdate(window.nowTime());
    pushToast(`Connected to ${window.CHAINS[chain].wallet}`, 'pos');
  };
  const disconnect = () => { setWallet({ status: 'disconnected' }); pushToast('Wallet disconnected'); };
  const simulateWrongNetwork = () => { if (wallet.status !== 'disconnected') setWallet({ status: 'wrong-network' }); };
  const switchNetwork = async () => {
    setWallet({ status: 'connecting' });
    await sleep(1100);
    setWallet({ status: 'connected' });
    pushToast('Network switched', 'pos');
  };

  /* ========================================================
     ERROR HELPERS
     ======================================================== */
  const ERRORS = {
    rejected: { title: 'Transaction rejected', desc: 'You declined the request in your wallet.' },
    insufficient: { title: 'Insufficient funds', desc: 'Your balance is too low to cover this transaction.' },
    contract: { title: 'Contract execution failed', desc: 'The vault reverted the call. No funds were moved.' },
    network: { title: 'Network error', desc: 'Unable to reach the blockchain. Check your connection.' },
  };
  const clearError = () => setError(null);
  const toggleScenario = (k) => setScenarios(s => ({ ...s, [k]: !s[k] }));

  /* ========================================================
     INVEST FLOW
     ======================================================== */
  const startTx = (kind, amt) => {
    setError(null);
    setTx({ status: 'awaiting', kind, stepIndex: 1, hash: null, block: null, gas: null, amount: amt, error: null });
  };
  const invest = () => {
    const amt = parseFloat(amount);
    if (!(amt > 0)) return;
    startTx('invest', amt);
  };
  const withdraw = () => {
    const amt = portfolio.returns;
    if (!(amt > 0)) return;
    startTx('withdraw', amt);
  };

  /* user clicks "Reject" in wallet popup */
  const rejectInWallet = () => {
    setTx(t => ({ ...t, status: 'error', stepIndex: 1, error: ERRORS.rejected }));
    pushToast('Transaction rejected by user', 'brand');
  };

  /* user clicks "Confirm" in wallet popup -> run mining sequence */
  const confirmInWallet = async () => {
    const kind = tx.kind;
    const amt = tx.amount;

    /* step: prepare (briefly) */
    setTx(t => ({ ...t, status: 'pending', stepIndex: 0 }));
    await sleep(700);

    /* contract-error scenario */
    if (scenarios.contract) {
      setTx(t => ({ ...t, status: 'error', stepIndex: 0, error: ERRORS.contract }));
      pushToast('Contract execution failed', 'brand');
      return;
    }

    /* step: submitted (hash appears) */
    const hash = window.fakeHash();
    setTx(t => ({ ...t, status: 'pending', stepIndex: 2, hash }));
    pushToast('Transaction submitted', 'brand');
    await sleep(1100);

    /* step: mining */
    const block = 19_482_000 + Math.floor(Math.random() * 40000);
    setTx(t => ({ ...t, status: 'pending', stepIndex: 3, block }));
    await sleep(1600);

    /* step: done */
    const gas = 60000 + Math.floor(Math.random() * 24000);
    setTx(t => ({ ...t, status: 'success', stepIndex: 4, gas }));

    /* ---- apply effects ---- */
    const time = window.nowTime();
    setLastUpdate(time);
    if (kind === 'invest') {
      setPf(p => ({ ...p, [chain]: { invested: +(p[chain].invested + amt).toFixed(6), returns: p[chain].returns } }));
      setProto(p => ({ ...p, [chain]: { ...p[chain], tvl: +(p[chain].tvl + amt).toFixed(6), investors: p[chain].investors + (Math.random() > 0.6 ? 1 : 0) } }));
      flashStat('tvl');
      addHistory({ type: 'invest', amount: amt, hash, time });
      addFeed({ who: 'You', amount: amt, type: 'invest', you: true });
      pushToast('Investment completed', 'pos');
      setAmount('');
    } else {
      const w = portfolio.returns;
      setPf(p => ({ ...p, [chain]: { invested: p[chain].invested, returns: 0 } }));
      addHistory({ type: 'withdraw', amount: w, hash, time });
      addFeed({ who: 'You', amount: w, type: 'withdraw', you: true });
      pushToast('Returns withdrawn successfully', 'pos');
    }
  };

  const closeTx = () => setTx(t => ({ ...t, status: 'idle' }));

  const addHistory = (entry) => {
    setHistoryMap(m => ({ ...m, [chain]: [{ id: Math.random().toString(36).slice(2), ...entry }, ...m[chain]] }));
  };
  const addFeed = ({ who, amount, type, you }) => {
    const item = { id: Math.random().toString(36).slice(2), who, amount, type, you, label: 'InvestmentMade', time: 'just now', fresh: true };
    setFeedMap(m => ({ ...m, [chain]: [item, ...m[chain]].slice(0, 14) }));
    setTimeout(() => setFeedMap(m => ({ ...m, [chain]: m[chain].map(f => f.id === item.id ? { ...f, fresh: false } : f) })), 600);
  };

  const flashStat = (key) => { setStatFlash(key); setTimeout(() => setStatFlash(null), 900); };

  /* ========================================================
     LIVE EVENT LISTENER — simulates on-chain InvestmentMade
     ======================================================== */
  const chainRef = useRef(chain);
  useEffect(() => { chainRef.current = chain; }, [chain]);
  useEffect(() => {
    let timer;
    const tick = () => {
      const delay = 5000 + Math.random() * 5000;
      timer = setTimeout(() => {
        const ch = chainRef.current;
        const c = window.CHAINS[ch];
        const isWithdraw = Math.random() > 0.8;
        const amt = +(Math.random() * (ch === 'solana' ? 30 : 1.2) + 0.15).toFixed(c.decimals);
        const who = c.feedAddrs[Math.floor(Math.random() * c.feedAddrs.length)];
        const item = { id: Math.random().toString(36).slice(2), who, amount: amt, type: isWithdraw ? 'withdraw' : 'invest', you: false, label: 'InvestmentMade', time: 'just now', fresh: true };
        setFeedMap(m => ({ ...m, [ch]: [item, ...m[ch]].slice(0, 14) }));
        setTimeout(() => setFeedMap(m => ({ ...m, [ch]: m[ch].map(f => f.id === item.id ? { ...f, fresh: false } : f) })), 600);
        if (!isWithdraw) {
          setProto(p => ({ ...p, [ch]: { ...p[ch], tvl: +(p[ch].tvl + amt).toFixed(6), investors: p[ch].investors + (Math.random() > 0.7 ? 1 : 0) } }));
          if (chainRef.current === ch) flashStat('tvl');
        }
        tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  /* ---- slowly accrue returns on the connected position (visible compounding) ---- */
  useEffect(() => {
    if (wallet.status !== 'connected') return;
    const t = setInterval(() => {
      setPf(p => {
        const cur = p[chain];
        if (cur.invested <= 0) return p;
        const inc = cur.invested * (proto[chain].apr / 100) / (365 * 24 * 60 * 60) * 8; // ~8s of yield
        return { ...p, [chain]: { ...cur, returns: +(cur.returns + inc).toFixed(8) } };
      });
    }, 8000);
    return () => clearInterval(t);
  }, [wallet.status, chain, proto]);

  /* ======================================================== */
  const ctx = {
    theme, toggleTheme, chain, setChain,
    wallet, connect, disconnect, switchNetwork, simulateWrongNetwork,
    portfolio, protocol, lastUpdate, statFlash,
    amount, setAmount, invest, withdraw,
    tx, confirmInWallet, rejectInWallet, closeTx,
    error, clearError, scenarios, toggleScenario,
    toasts, feed, history,
  };

  const U = window.VerdaUI, O = window.VerdaOverlays;

  return (
    <window.DAppCtx.Provider value={ctx}>
      <U.Header />
      <main className="app">
        <div className="shell">
          <U.PageHead />
          <U.NetworkBanner />
          <U.ErrorBanner />

          <div className="hero-grid">
            <U.PortfolioCard />
            <U.StatsColumn />
          </div>

          <div className="main-grid">
            <div>
              <U.InvestmentForm />
              <O.DemoBar />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <U.ReturnsCard />
              <U.ActivityFeed />
            </div>
          </div>

          <U.History />
        </div>
      </main>
      <O.TxModal />
      <O.Toasts />
    </window.DAppCtx.Provider>
  );
}

/* seed feed helper (hoisted) */
function seedFeedFor(chainId) {
  const c = window.CHAINS[chainId];
  const times = ['2m ago', '6m ago', '11m ago', '18m ago'];
  return [0, 1, 2, 3].map((_, i) => ({
    id: 'seed' + chainId + i,
    who: c.feedAddrs[i % c.feedAddrs.length],
    amount: +(Math.random() * (c.symbol === 'SOL' ? 40 : 1.5) + 0.2).toFixed(c.decimals),
    type: i === 2 ? 'withdraw' : 'invest',
    label: 'InvestmentMade',
    time: times[i],
    you: false, fresh: false,
  }));
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
