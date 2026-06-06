package models

import "time"

type User struct {
	ID            int       `json:"id"`
	WalletAddress string    `json:"wallet_address"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Investment struct {
	ID            int       `json:"id"`
	WalletAddress string    `json:"wallet_address"`
	Amount        string    `json:"amount"`
	TxHash        string    `json:"tx_hash,omitempty"`
	BlockNumber   *int      `json:"block_number,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Transaction struct {
	ID            int       `json:"id"`
	WalletAddress string    `json:"wallet_address"`
	TxHash        string    `json:"tx_hash"`
	BlockNumber   *int      `json:"block_number,omitempty"`
	GasUsed       *int      `json:"gas_used,omitempty"`
	TxType        string    `json:"tx_type"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type ReturnDistribution struct {
	ID            int       `json:"id"`
	WalletAddress string    `json:"wallet_address"`
	Amount        string    `json:"amount"`
	TxHash        string    `json:"tx_hash"`
	BlockNumber   *int      `json:"block_number,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type Stats struct {
	TotalInvested  string `json:"total_invested"`
	TotalInvestors int    `json:"total_investors"`
	DailyVolume    string `json:"daily_volume"`
	AverageAmount  string `json:"average_amount"`
}

type TopInvestor struct {
	WalletAddress   string `json:"wallet_address"`
	TotalInvested   string `json:"total_invested"`
	InvestmentCount int    `json:"investment_count"`
}

type DailyVolume struct {
	Day            string `json:"day"`
	NumInvestments int    `json:"num_investments"`
	Volume         string `json:"volume"`
}

type InvestorOnChain struct {
	InvestedAmount  string `json:"invested_amount"`
	ReturnsAmount   string `json:"returns_amount"`
	InvestmentCount uint64 `json:"investment_count"`
	LastInvestment  int64  `json:"last_investment_timestamp"`
}

type AuthChallengeResponse struct {
	Nonce     string    `json:"nonce"`
	Message   string    `json:"message"`
	ExpiresAt time.Time `json:"expires_at"`
}

type VerifyRequest struct {
	Wallet    string `json:"wallet"`
	Signature string `json:"signature"`
	Nonce     string `json:"nonce"`
}

type CreateInvestmentRequest struct {
	Wallet string `json:"wallet"`
	Amount string `json:"amount"`
	TxHash string `json:"tx_hash"`
}

type PaginatedInvestments struct {
	Items []Investment `json:"items"`
	Total int          `json:"total"`
	Page  int          `json:"page"`
	Limit int          `json:"limit"`
}
