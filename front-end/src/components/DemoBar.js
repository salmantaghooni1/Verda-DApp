import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDApp } from '@services/DAppContext';
const LABELS = {
    reject: 'Reject TX',
    insufficient: 'Low funds',
    contract: 'Revert',
};
export function DemoBar() {
    const { scenarios, toggleScenario } = useDApp();
    if (import.meta.env.PROD)
        return null;
    return (_jsxs("div", { className: "demo-bar", children: [_jsx("span", { className: "demo-bar__label", children: "Demo" }), Object.keys(LABELS).map(k => (_jsx("button", { className: `demo-bar__pill${scenarios[k] ? ' demo-bar__pill--on' : ''}`, onClick: () => toggleScenario(k), "aria-pressed": scenarios[k], children: LABELS[k] }, k)))] }));
}
//# sourceMappingURL=DemoBar.js.map