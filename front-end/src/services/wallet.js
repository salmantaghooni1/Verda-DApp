import { BrowserProvider, Contract, ethers } from 'ethers';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const ETHEREUM_MAINNET_CHAIN_ID = '0x1';
const ETHEREUM_SEPOLIA_CHAIN_ID = '0xaa36a7';
const INVESTMENT_ABI = [
    'function invest() external payable',
    'function withdrawReturns() external',
    'function getInvestor(address user) external view returns (uint256 investedAmount, uint256 returnsAmount, uint256 investmentCount, uint256 lastInvestmentTime)',
    'function getTotalStats() external view returns (uint256 invested, uint256 numInvestors, uint256 aprValue)',
    'event InvestmentMade(address indexed investor, uint256 amount)',
    'event ReturnsDistributed(address indexed investor, uint256 amount)',
    'event ReturnsWithdrawn(address indexed investor, uint256 amount)',
];
class WalletService {
    constructor() {
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "contract", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { status: 'disconnected', address: null, chainId: null, token: null }
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
    }
    subscribe(fn) {
        this.listeners.add(fn);
        fn(this.state);
        return () => this.listeners.delete(fn);
    }
    emit(patch) {
        this.state = { ...this.state, ...patch };
        this.listeners.forEach(fn => fn(this.state));
    }
    getState() {
        return this.state;
    }
    isMetaMaskAvailable() {
        return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
    }
    async connect() {
        if (!this.isMetaMaskAvailable()) {
            throw new Error('MetaMask is not installed');
        }
        this.emit({ status: 'connecting' });
        try {
            this.provider = new BrowserProvider(window.ethereum);
            await this.provider.send('eth_requestAccounts', []);
            const network = await this.provider.getNetwork();
            const chainId = '0x' + network.chainId.toString(16);
            const signer = await this.provider.getSigner();
            const address = await signer.getAddress();
            const expectedChains = [ETHEREUM_MAINNET_CHAIN_ID, ETHEREUM_SEPOLIA_CHAIN_ID, '0x539'];
            if (!expectedChains.includes(chainId)) {
                this.emit({ status: 'wrong-network', address, chainId });
                return this.state;
            }
            if (CONTRACT_ADDRESS) {
                this.contract = new Contract(CONTRACT_ADDRESS, INVESTMENT_ABI, signer);
            }
            const stored = this.loadStoredToken(address);
            let token = stored;
            if (!token) {
                token = await this.authenticate(address, signer);
            }
            this.emit({ status: 'connected', address, chainId, token });
            this.watchEvents();
            return this.state;
        }
        catch (err) {
            this.emit({ status: 'disconnected' });
            throw err;
        }
    }
    async authenticate(address, signer) {
        const challengeRes = await fetch(`${API_BASE}/auth/challenge?wallet=${address}`);
        if (!challengeRes.ok)
            throw new Error('Failed to get auth challenge');
        const { nonce, message } = await challengeRes.json();
        const signature = await signer.signMessage(message);
        const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: address, signature, nonce }),
        });
        if (!verifyRes.ok)
            throw new Error('Authentication failed');
        const { token } = await verifyRes.json();
        localStorage.setItem(`verda.token.${address.toLowerCase()}`, token);
        return token;
    }
    loadStoredToken(address) {
        return localStorage.getItem(`verda.token.${address.toLowerCase()}`);
    }
    async switchNetwork() {
        if (!window.ethereum)
            throw new Error('MetaMask not found');
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ETHEREUM_SEPOLIA_CHAIN_ID }],
            });
        }
        catch (err) {
            const switchErr = err;
            if (switchErr.code === 4902) {
                throw new Error('Network not configured in MetaMask');
            }
            throw err;
        }
    }
    async invest(amountEth) {
        if (!this.contract)
            throw new Error('Contract not initialized — check CONTRACT_ADDRESS env var');
        const value = ethers.parseEther(amountEth);
        const tx = await this.contract.invest({ value });
        return tx.hash;
    }
    async waitForTx(hash) {
        if (!this.provider)
            throw new Error('Not connected');
        return this.provider.waitForTransaction(hash, 1, 60000);
    }
    async withdrawReturns() {
        if (!this.contract)
            throw new Error('Contract not initialized');
        const tx = await this.contract.withdrawReturns();
        return tx.hash;
    }
    async getInvestorData(address) {
        if (!this.contract)
            return null;
        try {
            const [invested, returns, count, lastTime] = await this.contract.getInvestor(address);
            return {
                investedAmount: ethers.formatEther(invested),
                returnsAmount: ethers.formatEther(returns),
                investmentCount: count,
                lastInvestmentTime: lastTime,
            };
        }
        catch {
            return null;
        }
    }
    async getTotalStats() {
        if (!this.contract)
            return null;
        try {
            const [invested, investors, apr] = await this.contract.getTotalStats();
            return {
                tvl: ethers.formatEther(invested),
                investors,
                apr,
            };
        }
        catch {
            return null;
        }
    }
    disconnect() {
        if (this.state.address) {
            localStorage.removeItem(`verda.token.${this.state.address.toLowerCase()}`);
        }
        this.provider = null;
        this.contract = null;
        this.emit({ status: 'disconnected', address: null, chainId: null, token: null });
    }
    watchEvents() {
        if (!window.ethereum)
            return;
        const handleAccountsChanged = (accounts) => {
            const accs = accounts;
            if (accs.length === 0) {
                this.disconnect();
            }
            else if (accs[0].toLowerCase() !== this.state.address?.toLowerCase()) {
                this.disconnect();
            }
        };
        const handleChainChanged = () => {
            window.location.reload();
        };
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}
export const walletService = new WalletService();
//# sourceMappingURL=wallet.js.map