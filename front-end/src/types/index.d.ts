export type ChainId = 'ethereum' | 'solana';
export interface Portfolio {
    invested: number;
    returns: number;
}
export interface Protocol {
    tvl: number;
    investors: number;
    apr: number;
}
export type TxStatus = 'idle' | 'awaiting' | 'pending' | 'success' | 'error';
export type TxKind = 'invest' | 'withdraw';
export interface TxState {
    status: TxStatus;
    kind: TxKind;
    stepIndex: number;
    hash: string | null;
    block: number | null;
    gas: number | null;
    amount: number;
    error: {
        title: string;
        desc: string;
    } | null;
}
export interface Toast {
    id: string;
    msg: string;
    kind: 'brand' | 'pos';
}
export interface FeedItem {
    id: string;
    who: string;
    amount: number;
    type: 'invest' | 'withdraw';
    label: string;
    time: string;
    you: boolean;
    fresh: boolean;
}
export interface HistoryEntry {
    id: string;
    type: 'invest' | 'withdraw';
    amount: number;
    hash: string;
    time: string;
}
export interface Scenario {
    reject: boolean;
    insufficient: boolean;
    contract: boolean;
}
export interface DAppContextType {
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    chain: ChainId;
    setChain: (id: ChainId) => void;
    wallet: {
        status: 'disconnected' | 'connecting' | 'connected' | 'wrong-network';
    };
    connect: () => Promise<void>;
    disconnect: () => void;
    switchNetwork: () => Promise<void>;
    portfolio: Portfolio;
    protocol: Protocol;
    lastUpdate: string;
    statFlash: string | null;
    amount: string;
    setAmount: (val: string) => void;
    invest: () => Promise<void>;
    withdraw: () => Promise<void>;
    tx: TxState;
    confirmInWallet: () => Promise<void>;
    rejectInWallet: () => void;
    closeTx: () => void;
    error: {
        title: string;
        desc: string;
    } | null;
    clearError: () => void;
    scenarios: Scenario;
    toggleScenario: (k: keyof Scenario) => void;
    toasts: Toast[];
    feed: FeedItem[];
    history: HistoryEntry[];
}
//# sourceMappingURL=index.d.ts.map