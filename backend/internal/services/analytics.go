package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"verdadapp/backend/internal/models"
)

type AnalyticsService struct {
	db    *sql.DB
	cache Cache
}

func NewAnalyticsService(db *sql.DB, cache Cache) *AnalyticsService {
	return &AnalyticsService{db: db, cache: cache}
}

const statsTTL = 5 * time.Minute

func (a *AnalyticsService) GetStats(ctx context.Context) (*models.Stats, error) {
	const key = "analytics:stats"

	var cached models.Stats
	if err := a.cache.Get(ctx, key, &cached); !errors.Is(err, ErrCacheMiss) && err == nil {
		return &cached, nil
	}

	stats, err := a.computeStats(ctx)
	if err != nil {
		return nil, err
	}

	_ = a.cache.Set(ctx, key, stats, statsTTL)
	return stats, nil
}

func (a *AnalyticsService) computeStats(ctx context.Context) (*models.Stats, error) {
	stats := &models.Stats{}
	err := a.db.QueryRowContext(ctx, `
		SELECT
		  COALESCE(SUM(amount)::TEXT,                                                        '0'),
		  COUNT(DISTINCT wallet_address),
		  COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN amount ELSE 0 END)::TEXT,   '0'),
		  COALESCE(AVG(amount)::TEXT,                                                        '0')
		FROM investments
		WHERE status = 'confirmed'
	`).Scan(
		&stats.TotalInvested,
		&stats.TotalInvestors,
		&stats.DailyVolume,
		&stats.AverageAmount,
	)
	if err != nil {
		return nil, err
	}
	return stats, nil
}

func (a *AnalyticsService) InvalidateStats(ctx context.Context) {
	_ = a.cache.Delete(ctx, "analytics:stats")
}

func (a *AnalyticsService) GetTopInvestors(ctx context.Context, limit int) ([]models.TopInvestor, error) {
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	const key = "analytics:top_investors"
	var cached []models.TopInvestor
	if err := a.cache.Get(ctx, key, &cached); !errors.Is(err, ErrCacheMiss) && err == nil {
		return cached, nil
	}

	rows, err := a.db.QueryContext(ctx, `
		SELECT wallet_address, SUM(amount)::TEXT as total, COUNT(*) as count
		FROM investments
		WHERE status = 'confirmed'
		GROUP BY wallet_address
		ORDER BY total DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.TopInvestor
	for rows.Next() {
		var ti models.TopInvestor
		if err := rows.Scan(&ti.WalletAddress, &ti.TotalInvested, &ti.InvestmentCount); err != nil {
			continue
		}
		result = append(result, ti)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	_ = a.cache.Set(ctx, key, result, 10*time.Minute)
	return result, nil
}

func (a *AnalyticsService) GetDailyVolume(ctx context.Context, days int) ([]models.DailyVolume, error) {
	if days <= 0 || days > 90 {
		days = 30
	}

	rows, err := a.db.QueryContext(ctx, `
		SELECT
		  DATE(created_at) AS day,
		  COUNT(*)         AS num_investments,
		  SUM(amount)::TEXT AS volume
		FROM investments
		WHERE status = 'confirmed'
		  AND created_at >= NOW() - ($1 || ' days')::INTERVAL
		GROUP BY DATE(created_at)
		ORDER BY day DESC
	`, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.DailyVolume
	for rows.Next() {
		var dv models.DailyVolume
		if err := rows.Scan(&dv.Day, &dv.NumInvestments, &dv.Volume); err != nil {
			continue
		}
		result = append(result, dv)
	}
	return result, rows.Err()
}
