import { ethers } from 'ethers';
declare global {
    interface Window {
        ethereum?: {
            request: (args: {
                method: string;
                params?: unknown[];
            }) => Promise<unknown>;
            on: (event: string, listener: (...args: unknown[]) => void) => void;
            removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
            isMetaMask?: boolean;
        };
    }
}
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong-network';
export interface WalletState {
    status: WalletStatus;
    address: string | null;
    chainId: string | null;
    token: string | null;
}
type WalletListener = (state: WalletState) => void;
declare class WalletService {
    private provider;
    private contract;
    private state;
    private listeners;
    subscribe(fn: WalletListener): () => void;
    private emit;
    getState(): WalletState;
    isMetaMaskAvailable(): boolean;
    connect(): Promise<WalletState>;
    private authenticate;
    private loadStoredToken;
    switchNetwork(): Promise<void>;
    invest(amountEth: string): Promise<string>;
    waitForTx(hash: string): Promise<ethers.TransactionReceipt | null>;
    withdrawReturns(): Promise<string>;
    getInvestorData(address: string): Promise<{
        investedAmount: string;
        returnsAmount: string;
        investmentCount: bigint;
        lastInvestmentTime: bigint;
    } | null>;
    getTotalStats(): Promise<{
        tvl: string;
        investors: bigint;
        apr: bigint;
    } | null>;
    disconnect(): void;
    private watchEvents;
}
export declare const walletService: WalletService;
export {};
//# sourceMappingURL=wallet.d.ts.map