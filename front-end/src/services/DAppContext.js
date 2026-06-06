import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
export const DAppContext = createContext(null);
export function DAppProvider({ value, children }) {
    return _jsx(DAppContext.Provider, { value: value, children: children });
}
export function useDApp() {
    const ctx = useContext(DAppContext);
    if (!ctx)
        throw new Error('useDApp must be used inside DAppProvider');
    return ctx;
}
//# sourceMappingURL=DAppContext.js.map