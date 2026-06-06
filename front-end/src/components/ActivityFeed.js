import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
import { Icons } from '@utils/icons';
export function ActivityFeed() {
    const { feed } = useDApp();
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { margin: '0 0 12px 0' }, children: "Live Activity" }), _jsx("div", { style: { maxHeight: '400px', overflowY: 'auto' }, children: feed.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }, children: "No activity yet" })) : (feed.map(item => (_jsxs("div", { className: item.fresh ? 'feed-item fresh' : 'feed-item', style: {
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-soft)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                    }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flex: 1 }, children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: item.type === 'invest' ? Icons.arrowUp : Icons.arrowDn }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: item.you ? 'You' : item.who }), _jsx("div", { style: { color: 'var(--text-muted)', fontSize: 12 }, children: item.type === 'invest' ? 'Invested' : 'Withdrawn' })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: { fontWeight: 700, color: item.type === 'invest' ? '#10b981' : '#ef4444' }, children: [item.type === 'invest' ? '+' : '-', item.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })] }), _jsx("div", { style: { fontSize: 12, color: 'var(--text-muted)' }, children: item.time })] })] }, item.id)))) })] }));
}
//# sourceMappingURL=ActivityFeed.js.map