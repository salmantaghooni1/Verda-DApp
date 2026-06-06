package services

import (
	"context"
	"database/sql"
	"fmt"
	"math/big"
	"strings"
	"time"
)

type ReturnsCalculator struct {
	db *sql.DB
}

type PendingReturn struct {
	Wallet  string
	Amount  *big.Int
}

func NewReturnsCalculator(db *sql.DB) *ReturnsCalculator {
	return &ReturnsCalculator{db: db}
}

// APR = 11.4% → 1140 basis points. Per-second rate = APR / (365 days * 10000).
const (
	aprBps             = 1140
	bpsDenominator     = 10_000
	secondsPerYear     = int64(365 * 24 * 60 * 60)
)

// CalculatePending returns accrued but undistributed returns for all
// confirmed investors. It subtracts already-distributed amounts so the
// caller can safely pass the result to distributeReturnsBatch.
func (rc *ReturnsCalculator) CalculatePending(ctx context.Context) ([]PendingReturn, error) {
	rows, err := rc.db.QueryContext(ctx, `
		SELECT
		  i.wallet_address,
		  SUM(i.amount)                             AS total_invested,
		  COALESCE(SUM(rd.amount), 0)               AS already_distributed,
		  EXTRACT(EPOCH FROM (NOW() - MIN(i.created_at)))::BIGINT AS elapsed_seconds
		FROM investments i
		LEFT JOIN return_distributions rd ON rd.wallet_address = i.wallet_address
		WHERE i.status = 'confirmed'
		GROUP BY i.wallet_address
		HAVING SUM(i.amount) > 0
	`)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var results []PendingReturn

	for rows.Next() {
		var wallet string
		var investedRaw, distributedRaw string
		var elapsedSec int64

		if err := rows.Scan(&wallet, &investedRaw, &distributedRaw, &elapsedSec); err != nil {
			continue
		}

		invested, ok1   := new(big.Float).SetString(investedRaw)
		distributed, ok2 := new(big.Float).SetString(distributedRaw)
		if !ok1 || !ok2 {
			continue
		}

		// invested is in ETH (NUMERIC from DB); convert to wei
		weiPerEth := new(big.Float).SetInt(big.NewInt(1e18))
		investedWei := new(big.Int)
		new(big.Float).Mul(invested, weiPerEth).Int(investedWei)

		// accrued = principal * aprBps * elapsed / (secondsPerYear * bpsDenominator)
		accrued := new(big.Int).Mul(investedWei, big.NewInt(aprBps))
		accrued.Mul(accrued, big.NewInt(elapsedSec))
		accrued.Div(accrued, big.NewInt(secondsPerYear*bpsDenominator))

		// subtract already distributed
		distWei := new(big.Int)
		new(big.Float).Mul(distributed, weiPerEth).Int(distWei)
		pending := new(big.Int).Sub(accrued, distWei)

		if pending.Sign() > 0 {
			results = append(results, PendingReturn{
				Wallet: strings.ToLower(wallet),
				Amount: pending,
			})
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

// RecordDistribution persists a distribution event received from the blockchain.
func (rc *ReturnsCalculator) RecordDistribution(ctx context.Context, wallet, txHash string, blockNum int, amountWei *big.Int) error {
	amountEth := new(big.Float).Quo(
		new(big.Float).SetInt(amountWei),
		new(big.Float).SetFloat64(1e18),
	)

	_, err := rc.db.ExecContext(ctx, `
		INSERT INTO return_distributions (wallet_address, amount, tx_hash, block_number)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT DO NOTHING
	`, strings.ToLower(wallet), amountEth.Text('f', 18), strings.ToLower(txHash), blockNum)
	return err
}

// DailyRunRequired returns true if no distribution has been recorded in the last 24h.
func (rc *ReturnsCalculator) DailyRunRequired(ctx context.Context) (bool, error) {
	var last sql.NullTime
	err := rc.db.QueryRowContext(ctx,
		`SELECT MAX(created_at) FROM return_distributions`,
	).Scan(&last)
	if err != nil {
		return false, err
	}
	if !last.Valid {
		return true, nil
	}
	return time.Since(last.Time) >= 23*time.Hour, nil
}
