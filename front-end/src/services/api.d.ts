export interface Investment {
    id: number;
    wallet_address: string;
    amount: string;
    tx_hash: string;
    block_number: number | null;
    status: 'pending' | 'confirmed' | 'failed';
    created_at: string;
    updated_at: string;
}
export interface PaginatedInvestments {
    items: Investment[];
    total: number;
    page: number;
    limit: number;
}
export interface Stats {
    total_invested: string;
    total_investors: number;
    daily_volume: string;
    average_amount: string;
}
export interface TopInvestor {
    wallet_address: string;
    total_invested: string;
    investment_count: number;
}
export interface DailyVolume {
    day: string;
    num_investments: number;
    volume: string;
}
export interface AuthChallengeResponse {
    nonce: string;
    message: string;
    expires_at: string;
}
export declare const api: {
    auth: {
        challenge(wallet: string): Promise<import("axios").AxiosResponse<AuthChallengeResponse, any, {}>>;
        verify(wallet: string, signature: string, nonce: string): Promise<import("axios").AxiosResponse<{
            token: string;
        }, any, {}>>;
    };
    user: {
        me(): Promise<import("axios").AxiosResponse<any, any, {}>>;
    };
    investments: {
        list(wallet: string, page?: number, limit?: number): Promise<import("axios").AxiosResponse<PaginatedInvestments, any, {}>>;
        get(id: number): Promise<import("axios").AxiosResponse<Investment, any, {}>>;
        create(wallet: string, amount: string, txHash: string): Promise<import("axios").AxiosResponse<Investment, any, {}>>;
    };
    stats: {
        get(): Promise<import("axios").AxiosResponse<Stats, any, {}>>;
        topInvestors(limit?: number): Promise<import("axios").AxiosResponse<TopInvestor[], any, {}>>;
        dailyVolume(days?: number): Promise<import("axios").AxiosResponse<DailyVolume[], any, {}>>;
    };
    returns: {
        get(wallet: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    };
};
//# sourceMappingURL=api.d.ts.map