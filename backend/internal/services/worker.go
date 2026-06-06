package services

import (
	"context"
	"log"
	"time"
)

type ReturnWorker struct {
	calculator *ReturnsCalculator
	analytics  *AnalyticsService
	publisher  *KafkaPublisher
}

func NewReturnWorker(
	calc *ReturnsCalculator,
	analytics *AnalyticsService,
	publisher *KafkaPublisher,
) *ReturnWorker {
	return &ReturnWorker{
		calculator: calc,
		analytics:  analytics,
		publisher:  publisher,
	}
}

// Run starts a daily loop that:
// 1. Checks if a returns calculation is due
// 2. Computes pending returns for all investors
// 3. Publishes events to Kafka so the blockchain signer service can distribute on-chain
// 4. Invalidates analytics cache
func (w *ReturnWorker) Run(ctx context.Context) {
	log.Println("Return worker started")

	// check immediately on startup, then every hour
	w.tryRun(ctx)

	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.tryRun(ctx)
		case <-ctx.Done():
			log.Println("Return worker stopped")
			return
		}
	}
}

func (w *ReturnWorker) tryRun(ctx context.Context) {
	due, err := w.calculator.DailyRunRequired(ctx)
	if err != nil {
		log.Printf("Return worker: daily check failed: %v", err)
		return
	}
	if !due {
		return
	}

	log.Println("Return worker: calculating pending returns...")

	pending, err := w.calculator.CalculatePending(ctx)
	if err != nil {
		log.Printf("Return worker: calculation failed: %v", err)
		return
	}

	if len(pending) == 0 {
		log.Println("Return worker: no pending returns")
		return
	}

	log.Printf("Return worker: %d investors have pending returns", len(pending))

	for _, p := range pending {
		if w.publisher != nil {
			event := KafkaEvent{
				Type:   "PendingReturnsReady",
				Wallet: p.Wallet,
				Amount: p.Amount.String(),
			}
			if err := w.publisher.Publish(ctx, TopicReturnEvents, event); err != nil {
				log.Printf("Return worker: Kafka publish error for %s: %v", p.Wallet, err)
			}
		}
	}

	if w.analytics != nil {
		w.analytics.InvalidateStats(ctx)
	}

	log.Printf("Return worker: published %d return events", len(pending))
}
