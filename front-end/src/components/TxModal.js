import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
import { Icons } from '@utils/icons';
export function TxModal() {
    const { tx, confirmInWallet, rejectInWallet, closeTx, chain } = useDApp();
    const symbol = chain === 'ethereum' ? 'ETH' : 'SOL';
    if (tx.status === 'idle')
        return null;
    const steps = [
        { label: 'Confirm', done: tx.stepIndex > 1 },
        { label: 'Submit', done: tx.stepIndex > 2 },
        { label: 'Mining', done: tx.stepIndex > 3 },
        { label: 'Complete', done: tx.stepIndex > 4 },
    ];
    const isError = tx.status === 'error';
    const isSuccess = tx.status === 'success';
    return (_jsx("div", { style: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }, children: _jsxs("div", { className: "card", style: { maxWidth: 500, padding: 24 }, children: [_jsx("div", { style: { textAlign: 'center', marginBottom: 24 }, children: isError ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 36, marginBottom: 12 }, children: Icons.alert }), _jsx("h2", { style: { margin: 0, color: '#ef4444' }, children: tx.error?.title }), _jsx("p", { style: { margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }, children: tx.error?.desc })] })) : isSuccess ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 36, marginBottom: 12, color: '#10b981' }, children: Icons.check }), _jsx("h2", { style: { margin: 0, color: '#10b981' }, children: "Transaction Successful!" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 36, marginBottom: 12, animation: 'spin 2s linear infinite' }, children: Icons.clock }), _jsx("h2", { style: { margin: 0 }, children: "Confirm Transaction" }), _jsx("p", { style: { margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }, children: "Please sign the transaction in your wallet" })] })) }), _jsxs("div", { style: { background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 20 }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }, children: "Type" }), _jsx("div", { style: { fontWeight: 700, textTransform: 'capitalize' }, children: tx.kind })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }, children: "Amount" }), _jsxs("div", { style: { fontWeight: 700 }, children: [tx.amount, " ", symbol] })] })] }), tx.hash && (_jsxs("div", { style: { marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }, children: "Hash" }), _jsxs("div", { className: "mono", style: { fontSize: 11, wordBreak: 'break-all' }, children: [tx.hash.slice(0, 20), "...", tx.hash.slice(-10)] })] })), tx.block && (_jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }, children: "Block" }), _jsx("div", { style: { fontFamily: 'monospace', fontSize: 12 }, children: tx.block.toLocaleString() })] })), tx.gas && (_jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }, children: "Gas" }), _jsxs("div", { style: { fontFamily: 'monospace', fontSize: 12 }, children: [tx.gas.toLocaleString(), " units"] })] }))] }), !isError && !isSuccess && (_jsx("div", { style: { marginBottom: 20 }, children: _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }, children: steps.map((step, i) => (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: {
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
                                    }, children: step.done ? Icons.check : i + 1 }), _jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: step.label })] }, i))) }) })), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [tx.status === 'awaiting' && (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn btn-ghost btn-block", onClick: rejectInWallet, children: "Reject" }), _jsx("button", { className: "btn btn-primary btn-block", onClick: confirmInWallet, children: "Confirm in Wallet" })] })), (isError || isSuccess) && (_jsx("button", { className: "btn btn-primary btn-block", onClick: closeTx, children: "Close" }))] })] }) }));
}
//# sourceMappingURL=TxModal.js.map