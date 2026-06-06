import { ReactNode } from 'react';
import type { DAppContextType } from '@types';
export declare const DAppContext: import("react").Context<DAppContextType | null>;
export declare function DAppProvider({ value, children }: {
    value: DAppContextType;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useDApp(): DAppContextType;
//# sourceMappingURL=DAppContext.d.ts.map