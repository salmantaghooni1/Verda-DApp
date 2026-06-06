import { WalletState } from '@services/wallet';
export declare function useWallet(): {
    walletState: WalletState;
    connect: () => Promise<WalletState>;
    disconnect: () => void;
    switchNetwork: () => Promise<void>;
};
//# sourceMappingURL=useWallet.d.ts.map