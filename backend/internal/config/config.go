package config

import (
	"os"
)

type Config struct {
	Port                      string
	DatabaseURL               string
	JWTSecret                 string
	EthRPCURL                 string
	InvestmentContractAddress string
	KafkaBrokers              string
}

func Load() *Config {
	return &Config{
		Port:                      getEnv("PORT", "8000"),
		DatabaseURL:               getEnv("DATABASE_URL", "postgres://user:pass@localhost/verdadapp"),
		JWTSecret:                 getEnv("JWT_SECRET", "your-secret-key"),
		EthRPCURL:                 getEnv("ETH_RPC_URL", "http://localhost:8545"),
		InvestmentContractAddress: getEnv("INVESTMENT_CONTRACT_ADDRESS", ""),
		KafkaBrokers:              getEnv("KAFKA_BROKERS", "localhost:9092"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
