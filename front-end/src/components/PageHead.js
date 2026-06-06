import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
export function PageHead() {
    const { wallet } = useDApp();
    return (_jsxs("div", { className: "pagehead", children: [_jsxs("div", { children: [_jsx("h1", { children: "Investment Vault" }), _jsx("p", { children: "Stake capital and earn sustainable yields" })] }), wallet.status === 'disconnected' && (_jsx("div", { style: { color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }, children: "Connect your wallet to begin" }))] }));
}
//# sourceMappingURL=PageHead.js.map