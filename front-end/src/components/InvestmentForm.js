import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
import { Icons } from '@utils/icons';
export function InvestmentForm() {
    const { wallet, amount, setAmount, invest, chain } = useDApp();
    const symbol = chain === 'ethereum' ? 'ETH' : 'SOL';
    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setAmount(val);
        }
    };
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { margin: '0 0 16px 0' }, children: "Make an Investment" }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsxs("label", { style: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }, children: ["Amount (", symbol, ")"] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { type: "text", value: amount, onChange: handleInputChange, placeholder: "0.00", disabled: wallet.status !== 'connected', style: {
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-soft)',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontFamily: 'monospace',
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                } }), _jsxs("button", { style: {
                                    padding: '10px 16px',
                                    border: '1px solid var(--border-soft)',
                                    borderRadius: 8,
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                }, onClick: () => setAmount('1.0'), disabled: wallet.status !== 'connected', children: ["1 ", symbol] })] })] }), wallet.status === 'wrong-network' && (_jsxs("div", { style: { padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 16, color: '#ef4444', fontSize: 13 }, children: [Icons.alert, " Wrong network - switch to invest"] })), _jsxs("button", { className: "btn btn-primary btn-block", onClick: invest, disabled: !amount || parseFloat(amount) <= 0 || wallet.status !== 'connected', children: [Icons.bolt, " Invest Now"] })] }));
}
//# sourceMappingURL=InvestmentForm.js.map