import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useDApp } from '@services/DAppContext';
import { walletService } from '@services/wallet';
import { Icons } from '@utils/icons';
const CHAIN_META = {
    ethereum: { name: 'Ethereum', color: '#627EEA' },
    solana: { name: 'Solana', color: '#9945FF' },
};
export function Header() {
    const { chain, setChain, theme, toggleTheme, wallet, connect, disconnect, switchNetwork } = useDApp();
    const [walletOpen, setWalletOpen] = useState(false);
    const [address, setAddress] = useState(null);
    useEffect(() => {
        return walletService.subscribe(s => setAddress(s.address));
    }, []);
    const shortAddr = address
        ? `${address.slice(0, 6)}…${address.slice(-4)}`
        : '0x???';
    return (_jsx("header", { className: "hdr", children: _jsxs("div", { className: "hdr-in", children: [_jsxs("div", { className: "brand", children: [_jsx("div", { className: "brand-mark", children: Icons.logo }), _jsxs("div", { children: [_jsxs("div", { className: "brand-name", children: ["Ver", _jsx("b", { children: "da" })] }), _jsx("div", { className: "brand-tag", children: "On-chain Yield" })] })] }), _jsx("div", { className: "seg", role: "tablist", children: ['ethereum', 'solana'].map(c => (_jsxs("button", { className: chain === c ? 'on' : '', onClick: () => setChain(c), role: "tab", "aria-selected": chain === c, children: [_jsx("span", { className: "chain-dot", style: { background: CHAIN_META[c].color } }), _jsx("span", { className: "lbl", children: CHAIN_META[c].name })] }, c))) }), _jsx("button", { className: "iconbtn", onClick: toggleTheme, title: "Toggle theme", children: theme === 'dark' ? Icons.sun : Icons.moon }), wallet.status === 'connecting' ? (_jsxs("button", { className: "btn btn-ghost", disabled: true, children: [_jsx("span", { className: "spin" }), " Connecting\u2026"] })) : wallet.status === 'wrong-network' ? (_jsxs("button", { className: "btn btn-primary", onClick: switchNetwork, children: [Icons.swap, " Switch Network"] })) : wallet.status === 'connected' && address ? (_jsxs("div", { style: { position: 'relative' }, children: [_jsxs("button", { className: "btn btn-ghost", onClick: () => setWalletOpen(o => !o), children: [_jsx("span", { className: "id-blob", style: { width: 18, height: 18, borderRadius: 6, display: 'inline-block', background: addrGradient(address) } }), _jsx("span", { className: "mono", children: shortAddr })] }), walletOpen && (_jsxs(_Fragment, { children: [_jsx("div", { style: { position: 'fixed', inset: 0, zIndex: 9 }, onClick: () => setWalletOpen(false) }), _jsxs("div", { className: "card", style: { position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 260, padding: 8, zIndex: 10 }, children: [_jsxs("div", { style: { padding: '12px 12px 14px', borderBottom: '1px solid var(--border-soft)' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Connected via MetaMask" }), _jsx("div", { className: "mono", style: { fontSize: 12, marginTop: 6, wordBreak: 'break-all', color: 'var(--text)' }, children: address })] }), _jsxs("button", { className: "btn btn-ghost btn-block", style: { marginTop: 8, justifyContent: 'flex-start', gap: 8 }, onClick: () => { disconnect(); setWalletOpen(false); }, children: [Icons.x, " Disconnect"] })] })] }))] })) : (_jsxs("button", { className: "btn btn-primary", onClick: connect, children: [Icons.wallet, " Connect Wallet"] }))] }) }));
}
function addrGradient(addr) {
    let h = 0;
    for (let i = 0; i < addr.length; i++)
        h = (h * 31 + addr.charCodeAt(i)) % 360;
    return `linear-gradient(135deg, oklch(0.7 0.15 ${h}), oklch(0.6 0.16 ${(h + 60) % 360}))`;
}
//# sourceMappingURL=Header.js.map