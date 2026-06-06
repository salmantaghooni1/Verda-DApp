import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
import { Icons } from '@utils/icons';
export function History() {
    const { history, chain } = useDApp();
    if (history.length === 0)
        return null;
    const chainData = {
        ethereum: { explorer: 'etherscan.io', name: 'Etherscan' },
        solana: { explorer: 'solscan.io', name: 'Solscan' },
    };
    return (_jsxs("div", { className: "card", style: { marginTop: 24 }, children: [_jsx("h3", { style: { margin: '0 0 16px 0' }, children: "Transaction History" }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', fontSize: 13, borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '1px solid var(--border-soft)' }, children: [_jsx("th", { style: { textAlign: 'left', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }, children: "Type" }), _jsx("th", { style: { textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }, children: "Amount" }), _jsx("th", { style: { textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }, children: "Time" }), _jsx("th", { style: { textAlign: 'center', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' } })] }) }), _jsx("tbody", { children: history.map(entry => (_jsxs("tr", { style: { borderBottom: '1px solid var(--border-soft)' }, children: [_jsxs("td", { style: { padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: entry.type === 'invest' ? Icons.arrowUp : Icons.arrowDn }), _jsx("span", { style: { fontWeight: 600, textTransform: 'capitalize' }, children: entry.type })] }), _jsxs("td", { style: { padding: '12px 0', textAlign: 'right', fontWeight: 600, color: entry.type === 'invest' ? '#10b981' : '#ef4444' }, children: [entry.type === 'invest' ? '+' : '-', entry.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })] }), _jsx("td", { style: { padding: '12px 0', textAlign: 'right', color: 'var(--text-muted)' }, children: entry.time }), _jsx("td", { style: { padding: '12px 0', textAlign: 'center' }, children: _jsx("a", { href: `https://${chainData[chain].explorer}/tx/${entry.hash}`, target: "_blank", rel: "noopener noreferrer", style: { color: 'var(--accent)', textDecoration: 'none' }, title: "View on explorer", children: Icons.ext }) })] }, entry.id))) })] }) })] }));
}
//# sourceMappingURL=History.js.map