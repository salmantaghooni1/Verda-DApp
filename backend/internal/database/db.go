package database

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

func Connect(dsn string) (*sql.DB, error) {
	if dsn == "" {
		panic("DATABASE_URL environment variable must be set")
	}
	if !strings.Contains(dsn, "sslmode") {
		if strings.Contains(dsn, "localhost") || strings.Contains(dsn, "127.0.0.1") {
			dsn += "?sslmode=disable"
		} else {
			dsn += "?sslmode=require"
		}
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

func Migrate(db *sql.DB) error {
	_, err := db.Exec(schema)
	return err
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_nonces (
    nonce          VARCHAR(64) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    message        TEXT NOT NULL,
    expires_at     TIMESTAMPTZ NOT NULL,
    used           BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
    id             SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    amount         NUMERIC(30, 18) NOT NULL,
    tx_hash        VARCHAR(66) UNIQUE,
    block_number   INTEGER,
    status         VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    CHECK (status IN ('pending', 'confirmed', 'failed')),
    CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS transactions (
    id             SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    tx_hash        VARCHAR(66) UNIQUE NOT NULL,
    block_number   INTEGER,
    gas_used       INTEGER,
    tx_type        VARCHAR(20) NOT NULL DEFAULT 'invest',
    status         VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    CHECK (status IN ('pending', 'confirmed', 'failed')),
    CHECK (tx_type IN ('invest', 'withdraw', 'distribute'))
);

CREATE TABLE IF NOT EXISTS return_distributions (
    id             SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    amount         NUMERIC(30, 18) NOT NULL,
    tx_hash        VARCHAR(66) NOT NULL,
    block_number   INTEGER,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_users_wallet           ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_investments_wallet     ON investments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_investments_status     ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_created    ON investments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investments_tx_hash    ON investments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet    ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash   ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_nonces_wallet          ON auth_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nonces_expires         ON auth_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_distributions_wallet   ON return_distributions(wallet_address);
`
