import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@components/Header';
import { PageHead } from '@components/PageHead';
import { PortfolioCard } from '@components/PortfolioCard';
import { StatsColumn } from '@components/StatsColumn';
import { InvestmentForm } from '@components/InvestmentForm';
import { ReturnsCard } from '@components/ReturnsCard';
import { ActivityFeed } from '@components/ActivityFeed';
import { History } from '@components/History';
import { NetworkBanner } from '@components/NetworkBanner';
import { ErrorBanner } from '@components/ErrorBanner';
import { TxModal } from '@components/TxModal';
import { Toasts } from '@components/Toasts';
import { DemoBar } from '@components/DemoBar';
import { DAppProvider } from '@services/DAppContext';
import { walletService } from '@services/wallet';
const TX_ERRORS = {
    rejected: { title: 'Transaction rejected', desc: 'You declined the request in your wallet.' },
    insufficient: { title: 'Insufficient funds', desc: 'Your balance is too low.' },
    contract: { title: 'Contract execution failed', desc: 'The vault reverted the call.' },
    network: { title: 'Network error', desc: 'Unable to reach blockchain.' },
};
function seedFeedFor(chainId) {
    const addrs = {
        ethereum: ['0x9aE2…41bD', '0x77C0…0fA3', '0x12Fe…cc81', '0x4F2A…89C1'],
        solana: ['7Xk9…3PvT', 'BvN2…q1Lc', '9Pfa…Zz04', 'Dm4K…7wRt'],
    };
    return [0, 1, 2, 3].map((_, i) => ({
        id: `seed-${chainId}-${i}`,
        who: addrs[chainId][i],
        amount: +(Math.random() * (chainId === 'solana' ? 40 : 1.5) + 0.2).toFixed(chainId === 'solana' ? 2 : 4),
        type: i === 2 ? 'withdraw' : 'invest',
        label: 'InvestmentMade',
        time: ['2m ago', '6m ago', '11m ago', '18m ago'][i],
        you: false,
        fresh: false,
    }));
}
export function App() {
    const [theme, setTheme] = useState(() => localStorage.getItem('verda.theme') ?? 'dark');
    const [chain, setChainState] = useState(() => localStorage.getItem('verda.chain') ?? 'ethereum');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('verda.theme', theme);
    }, [theme]);
    useEffect(() => { localStorage.setItem('verda.chain', chain); }, [chain]);
    const [wallet, setWallet] = useState(() => ({ status: walletService.getState().status }));
    useEffect(() => {
        return walletService.subscribe(state => {
            setWallet({ status: state.status });
        });
    }, []);
    const [pf, setPf] = useState(() => ({
        ethereum: { invested: 2.5, returns: 0.34 },
        solana: { invested: 96.0, returns: 12.4 },
    }));
    const [proto, setProto] = useState(() => ({
        ethereum: { tvl: 15.82, investors: 28, apr: 11.4 },
        solana: { tvl: 842.5, investors: 113, apr: 13.2 },
    }));
    const protoRef = useRef(proto);
    const chainRef = useRef(chain);
    useEffect(() => { protoRef.current = proto; }, [proto]);
    useEffect(() => { chainRef.current = chain; }, [chain]);
    const portfolio = pf[chain];
    const protocol = proto[chain];
    const [statFlash, setStatFlash] = useState(null);
    const [amount, setAmount] = useState('');
    const [lastUpdate, setLastUpdate] = useState(() => nowTime());
    const [tx, setTx] = useState({
        status: 'idle', kind: 'invest', stepIndex: 0,
        hash: null, block: null, gas: null, amount: 0, error: null,
    });
    const [error, setError] = useState(null);
    const [scenarios, setScenarios] = useState({ reject: false, insufficient: false, contract: false });
    const [toasts, setToasts] = useState([]);
    const pushToast = useCallback((msg, kind = 'brand', ttl = 3200) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(t => [...t, { id, msg, kind }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl);
    }, []);
    const [feedMap, setFeedMap] = useState(() => ({
        ethereum: seedFeedFor('ethereum'),
        solana: seedFeedFor('solana'),
    }));
    const [historyMap, setHistoryMap] = useState({ ethereum: [], solana: [] });
    const feed = feedMap[chain];
    const history = historyMap[chain];
    const setChain = useCallback((id) => {
        if (id === chain)
            return;
        setChainState(id);
        setAmount('');
        setError(null);
        setLastUpdate(nowTime());
    }, [chain]);
    const connect = useCallback(async () => {
        setError(null);
        try {
            const state = await walletService.connect();
            if (state.status === 'connected') {
                setLastUpdate(nowTime());
                pushToast('Wallet connected', 'pos');
            }
        }
        catch (err) {
            const e = err;
            if (e.code === 4001) {
                pushToast('Connection rejected');
            }
            else if (e.message?.includes('MetaMask is not installed')) {
                setError({ title: 'MetaMask not found', desc: 'Install MetaMask to connect your wallet.' });
            }
            else {
                setError({ title: 'Connection failed', desc: e.message ?? 'Unknown error' });
            }
        }
    }, [pushToast]);
    const disconnect = useCallback(() => {
        walletService.disconnect();
        pushToast('Wallet disconnected');
    }, [pushToast]);
    const switchNetwork = useCallback(async () => {
        try {
            await walletService.switchNetwork();
        }
        catch (err) {
            const e = err;
            pushToast(e.message ?? 'Network switch failed');
        }
    }, [pushToast]);
    const flashStat = useCallback((key) => {
        setStatFlash(key);
        setTimeout(() => setStatFlash(null), 900);
    }, []);
    const addHistory = useCallback((entry) => {
        setHistoryMap(m => ({
            ...m,
            [chainRef.current]: [{ id: Math.random().toString(36).slice(2), ...entry }, ...m[chainRef.current]],
        }));
    }, []);
    const addFeed = useCallback((item) => {
        const entry = { ...item, id: Math.random().toString(36).slice(2), label: 'InvestmentMade', time: 'just now', fresh: true };
        setFeedMap(m => ({ ...m, [chainRef.current]: [entry, ...m[chainRef.current]].slice(0, 14) }));
        setTimeout(() => {
            setFeedMap(m => ({ ...m, [chainRef.current]: m[chainRef.current].map(f => f.id === entry.id ? { ...f, fresh: false } : f) }));
        }, 600);
    }, []);
    const invest = useCallback(async () => {
        const amt = parseFloat(amount);
        if (!(amt > 0))
            return;
        setError(null);
        setTx({ status: 'awaiting', kind: 'invest', stepIndex: 1, hash: null, block: null, gas: null, amount: amt, error: null });
    }, [amount]);
    const withdraw = useCallback(async () => {
        const amt = pf[chain].returns;
        if (!(amt > 0))
            return;
        setError(null);
        setTx({ status: 'awaiting', kind: 'withdraw', stepIndex: 1, hash: null, block: null, gas: null, amount: amt, error: null });
    }, [pf, chain]);
    const rejectInWallet = useCallback(() => {
        setTx(t => ({ ...t, status: 'error', stepIndex: 1, error: TX_ERRORS.rejected }));
        pushToast('Transaction rejected by user');
    }, [pushToast]);
    const confirmInWallet = useCallback(async () => {
        const { kind, amount: amt } = tx;
        setTx(t => ({ ...t, status: 'pending', stepIndex: 0 }));
        try {
            let hash;
            if (walletService.isMetaMaskAvailable() && walletService.getState().status === 'connected') {
                hash = kind === 'invest'
                    ? await walletService.invest(amt.toString())
                    : await walletService.withdrawReturns();
                setTx(t => ({ ...t, status: 'pending', stepIndex: 2, hash }));
                pushToast('Transaction submitted');
                const receipt = await walletService.waitForTx(hash);
                const block = receipt?.blockNumber ?? 0;
                const gas = Number(receipt?.gasUsed ?? 0);
                setTx(t => ({ ...t, status: 'success', stepIndex: 4, block, gas }));
            }
            else {
                await sleep(700);
                if (scenarios.contract) {
                    setTx(t => ({ ...t, status: 'error', stepIndex: 0, error: TX_ERRORS.contract }));
                    pushToast('Contract execution failed');
                    return;
                }
                hash = '0x' + Array(64).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
                setTx(t => ({ ...t, status: 'pending', stepIndex: 2, hash }));
                pushToast('Transaction submitted');
                await sleep(1100);
                const block = 19482000 + Math.floor(Math.random() * 40000);
                setTx(t => ({ ...t, status: 'pending', stepIndex: 3, block }));
                await sleep(1600);
                const gas = 60000 + Math.floor(Math.random() * 24000);
                setTx(t => ({ ...t, status: 'success', stepIndex: 4, gas }));
            }
            const time = nowTime();
            setLastUpdate(time);
            if (kind === 'invest') {
                setPf(p => ({ ...p, [chain]: { invested: +(p[chain].invested + amt).toFixed(6), returns: p[chain].returns } }));
                setProto(p => ({ ...p, [chain]: { ...p[chain], tvl: +(p[chain].tvl + amt).toFixed(6) } }));
                flashStat('tvl');
                addHistory({ type: 'invest', amount: amt, hash, time });
                addFeed({ who: 'You', amount: amt, type: 'invest', you: true });
                pushToast('Investment completed', 'pos');
                setAmount('');
            }
            else {
                const w = pf[chain].returns;
                setPf(p => ({ ...p, [chain]: { invested: p[chain].invested, returns: 0 } }));
                addHistory({ type: 'withdraw', amount: w, hash, time });
                addFeed({ who: 'You', amount: w, type: 'withdraw', you: true });
                pushToast('Returns withdrawn successfully', 'pos');
            }
        }
        catch (err) {
            const e = err;
            if (e.code === 4001 || e.code === 'ACTION_REJECTED') {
                setTx(t => ({ ...t, status: 'error', error: TX_ERRORS.rejected }));
                pushToast('Transaction rejected');
            }
            else {
                setTx(t => ({ ...t, status: 'error', error: { title: 'Transaction failed', desc: e.message ?? 'Unknown error' } }));
            }
        }
    }, [tx, scenarios.contract, chain, pf, pushToast, flashStat, addHistory, addFeed]);
    const closeTx = useCallback(() => setTx(t => ({ ...t, status: 'idle' })), []);
    // live feed simulation
    useEffect(() => {
        let timer;
        const tick = () => {
            const delay = 5000 + Math.random() * 5000;
            timer = setTimeout(() => {
                const ch = chainRef.current;
                const isWithdraw = Math.random() > 0.8;
                const amt = +(Math.random() * (ch === 'solana' ? 30 : 1.2) + 0.15).toFixed(ch === 'solana' ? 2 : 4);
                const addrs = ch === 'ethereum'
                    ? ['0x9aE2…41bD', '0x77C0…0fA3', '0x12Fe…cc81', '0x4F2A…89C1']
                    : ['7Xk9…3PvT', 'BvN2…q1Lc', '9Pfa…Zz04', 'Dm4K…7wRt'];
                const item = {
                    id: Math.random().toString(36).slice(2),
                    who: addrs[Math.floor(Math.random() * addrs.length)],
                    amount: amt, type: isWithdraw ? 'withdraw' : 'invest',
                    you: false, label: 'InvestmentMade', time: 'just now', fresh: true,
                };
                setFeedMap(m => ({ ...m, [ch]: [item, ...m[ch]].slice(0, 14) }));
                setTimeout(() => setFeedMap(m => ({ ...m, [ch]: m[ch].map(f => f.id === item.id ? { ...f, fresh: false } : f) })), 600);
                if (!isWithdraw) {
                    setProto(p => ({ ...p, [ch]: { ...p[ch], tvl: +(p[ch].tvl + amt).toFixed(6) } }));
                    if (chainRef.current === ch)
                        flashStat('tvl');
                }
                tick();
            }, delay);
        };
        tick();
        return () => clearTimeout(timer);
    }, [flashStat]);
    // APR accrual — proto accessed via ref to avoid resetting the interval
    useEffect(() => {
        if (wallet.status !== 'connected')
            return;
        const t = setInterval(() => {
            setPf(p => {
                const cur = p[chainRef.current];
                if (cur.invested <= 0)
                    return p;
                const inc = cur.invested * (protoRef.current[chainRef.current].apr / 100) / (365 * 24 * 60 * 60) * 8;
                return { ...p, [chainRef.current]: { ...cur, returns: +(cur.returns + inc).toFixed(8) } };
            });
        }, 8000);
        return () => clearInterval(t);
    }, [wallet.status]);
    const ctx = {
        theme,
        toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
        chain, setChain,
        wallet, connect, disconnect, switchNetwork,
        portfolio, protocol,
        lastUpdate, statFlash,
        amount, setAmount,
        invest, withdraw,
        tx, confirmInWallet, rejectInWallet, closeTx,
        error, clearError: () => setError(null),
        scenarios, toggleScenario: (k) => setScenarios(s => ({ ...s, [k]: !s[k] })),
        toasts, feed, history,
    };
    return (_jsxs(DAppProvider, { value: ctx, children: [_jsx(Header, {}), _jsx("main", { className: "app", children: _jsxs("div", { className: "shell", children: [_jsx(PageHead, {}), _jsx(NetworkBanner, {}), _jsx(ErrorBanner, {}), _jsxs("div", { className: "hero-grid", children: [_jsx(PortfolioCard, {}), _jsx(StatsColumn, {})] }), _jsxs("div", { className: "main-grid", children: [_jsx(InvestmentForm, {}), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 18 }, children: [_jsx(ReturnsCard, {}), _jsx(ActivityFeed, {})] })] }), _jsx(History, {})] }) }), _jsx(TxModal, {}), _jsx(Toasts, {}), _jsx(DemoBar, {})] }));
}
function nowTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
//# sourceMappingURL=App.js.map