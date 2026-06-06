import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
import { Icons } from '@utils/icons';
export function ReturnsCard() {
    const { portfolio, wallet, withdraw, chain } = useDApp();
    const symbol = chain === 'ethereum' ? 'ETH' : 'SOL';
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: "Claim Returns" }), _jsx("span", { style: { color: 'var(--text-muted)' }, children: Icons.coins })] }), _jsxs("div", { style: { marginBottom: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }, children: [_jsx("div", { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }, children: "Available to Withdraw" }), _jsxs("div", { style: { fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }, className: "tnum", children: [portfolio.returns.toLocaleString('en-US', { maximumFractionDigits: 4 }), " ", symbol] })] }), _jsxs("button", { className: "btn btn-primary btn-block", onClick: withdraw, disabled: portfolio.returns <= 0 || wallet.status !== 'connected', children: [Icons.arrowUp, " Withdraw Returns"] })] }));
}
//# sourceMappingURL=ReturnsCard.js.map