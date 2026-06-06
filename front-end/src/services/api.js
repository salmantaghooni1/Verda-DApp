import axios from 'axios';
import { walletService } from './wallet';
const BASE = import.meta.env.VITE_API_URL ?? '/api';
const http = axios.create({
    baseURL: BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});
http.interceptors.request.use(config => {
    const token = walletService.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
http.interceptors.response.use(res => res, (err) => {
    if (err.response?.status === 401) {
        walletService.disconnect();
    }
    return Promise.reject(err);
});
// ─── API methods ─────────────────────────────────────────────────────────────
export const api = {
    auth: {
        challenge(wallet) {
            return http.get('/auth/challenge', { params: { wallet } });
        },
        verify(wallet, signature, nonce) {
            return http.post('/auth/verify', { wallet, signature, nonce });
        },
    },
    user: {
        me() {
            return http.get('/user/me');
        },
    },
    investments: {
        list(wallet, page = 1, limit = 20) {
            return http.get('/investments', { params: { wallet, page, limit } });
        },
        get(id) {
            return http.get(`/investments/${id}`);
        },
        create(wallet, amount, txHash) {
            return http.post('/investments', { wallet, amount, tx_hash: txHash });
        },
    },
    stats: {
        get() {
            return http.get('/stats');
        },
        topInvestors(limit = 10) {
            return http.get('/stats/investors', { params: { limit } });
        },
        dailyVolume(days = 30) {
            return http.get('/stats/volume', { params: { days } });
        },
    },
    returns: {
        get(wallet) {
            return http.get('/returns', { params: { wallet } });
        },
    },
};
//# sourceMappingURL=api.js.map