import { jsx as _jsx } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
export function Toasts() {
    const { toasts } = useDApp();
    return (_jsx("div", { style: { position: 'fixed', bottom: 20, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }, children: toasts.map(toast => (_jsx("div", { style: {
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                animation: 'slideIn 0.3s ease-out',
                background: toast.kind === 'pos' ? '#10b981' : '#627EEA',
                color: 'white',
                maxWidth: 280,
            }, children: toast.msg }, toast.id))) }));
}
//# sourceMappingURL=Toasts.js.map