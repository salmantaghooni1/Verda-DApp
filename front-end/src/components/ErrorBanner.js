import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
import { Icons } from '@utils/icons';
export function ErrorBanner() {
    const { error, clearError } = useDApp();
    if (!error)
        return null;
    return (_jsxs("div", { style: {
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
        }, children: [_jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("span", { style: { color: '#ef4444', marginTop: 2 }, children: Icons.alert }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, color: '#ef4444', marginBottom: 2 }, children: error.title }), _jsx("div", { style: { fontSize: 13, color: '#ef4444', opacity: 0.8 }, children: error.desc })] })] }), _jsx("button", { onClick: clearError, style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    padding: 0,
                    marginTop: 2,
                }, children: Icons.x })] }));
}
//# sourceMappingURL=ErrorBanner.js.map