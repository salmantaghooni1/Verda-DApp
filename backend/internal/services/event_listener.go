package services

import (
	"context"
	"database/sql"
	"log"
	"strings"
	"time"
)

type EventListener struct {
	db        *sql.DB
	bc        *BlockchainService
	calc      *ReturnsCalculator
	publisher *KafkaPublisher
}

func NewEventListener(
	db *sql.DB,
	bc *BlockchainService,
	calc *ReturnsCalculator,
	publisher *KafkaPublisher,
) *EventListener {
	return &EventListener{db: db, bc: bc, calc: calc, publisher: publisher}
}

func (el *EventListener) Start(ctx context.Context) {
	log.Println("Event listener started")
	for ctx.Err() == nil {
		if err := el.run(ctx); err != nil && ctx.Err() == nil {
			log.Printf("Event listener error: %v — reconnecting in 10s", err)
			select {
			case <-time.After(10 * time.Second):
			case <-ctx.Done():
			}
		}
	}
	log.Println("Event listener stopped")
}

func (el *EventListener) run(ctx context.Context) error {
	events := make(chan ContractEvent, 64)

	if err := el.bc.SubscribeToEvents(ctx, events); err != nil {
		return err
	}

	log.Println("Event listener subscribed to contract events")

	for {
		select {
		case ev, ok := <-events:
			if !ok {
				return nil
			}
			if err := el.dispatch(ctx, ev); err != nil {
				log.Printf("Dispatch error [%s tx=%s]: %v", ev.Type, ev.TxHash, err)
			}
		case <-ctx.Done():
			return nil
		}
	}
}

func (el *EventListener) dispatch(ctx context.Context, ev ContractEvent) error {
	switch ev.Type {
	case EventInvestmentMade:
		return el.handleInvestmentMade(ctx, ev)
	case EventReturnsDistributed:
		return el.handleReturnsDistributed(ctx, ev)
	case EventReturnsWithdrawn:
		return el.handleWithdrawn(ctx, ev)
	}
	return nil
}

func (el *EventListener) handleInvestmentMade(ctx context.Context, ev ContractEvent) error {
	tx, err := el.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	wallet  := strings.ToLower(ev.Investor.Hex())
	txHash  := strings.ToLower(ev.TxHash)
	blockNo := int(ev.Block)

	if _, err = tx.ExecContext(ctx,
		`INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT DO NOTHING`,
		wallet,
	); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx,
		`UPDATE investments
		 SET status = 'confirmed', block_number = $1, updated_at = NOW()
		 WHERE tx_hash = $2 AND status = 'pending'`,
		blockNo, txHash,
	); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, `
		INSERT INTO transactions (wallet_address, tx_hash, block_number, tx_type, status)
		VALUES ($1, $2, $3, 'invest', 'confirmed')
		ON CONFLICT (tx_hash) DO UPDATE SET status = 'confirmed', block_number = $3`,
		wallet, txHash, blockNo,
	); err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	if el.publisher != nil {
		_ = el.publisher.Publish(ctx, TopicInvestmentEvents, KafkaEvent{
			Type:   string(EventInvestmentMade),
			Wallet: wallet,
			Amount: ev.Amount.String(),
			TxHash: txHash,
			Block:  ev.Block,
		})
	}

	log.Printf("Investment confirmed: wallet=%s amount=%s block=%d", wallet, ev.Amount, ev.Block)
	return nil
}

func (el *EventListener) handleReturnsDistributed(ctx context.Context, ev ContractEvent) error {
	wallet  := strings.ToLower(ev.Investor.Hex())
	txHash  := strings.ToLower(ev.TxHash)
	blockNo := int(ev.Block)

	if err := el.calc.RecordDistribution(ctx, wallet, txHash, blockNo, ev.Amount); err != nil {
		return err
	}

	if _, err := el.db.ExecContext(ctx, `
		INSERT INTO transactions (wallet_address, tx_hash, block_number, tx_type, status)
		VALUES ($1, $2, $3, 'distribute', 'confirmed')
		ON CONFLICT (tx_hash) DO NOTHING`,
		wallet, txHash, blockNo,
	); err != nil {
		return err
	}

	if el.publisher != nil {
		_ = el.publisher.Publish(ctx, TopicReturnEvents, KafkaEvent{
			Type:   string(EventReturnsDistributed),
			Wallet: wallet,
			Amount: ev.Amount.String(),
			TxHash: txHash,
			Block:  ev.Block,
		})
	}

	log.Printf("Returns distributed: wallet=%s amount=%s block=%d", wallet, ev.Amount, ev.Block)
	return nil
}

func (el *EventListener) handleWithdrawn(ctx context.Context, ev ContractEvent) error {
	wallet  := strings.ToLower(ev.Investor.Hex())
	txHash  := strings.ToLower(ev.TxHash)
	blockNo := int(ev.Block)

	if _, err := el.db.ExecContext(ctx, `
		INSERT INTO transactions (wallet_address, tx_hash, block_number, tx_type, status)
		VALUES ($1, $2, $3, 'withdraw', 'confirmed')
		ON CONFLICT (tx_hash) DO NOTHING`,
		wallet, txHash, blockNo,
	); err != nil {
		return err
	}

	if el.publisher != nil {
		_ = el.publisher.Publish(ctx, TopicReturnEvents, KafkaEvent{
			Type:   string(EventReturnsWithdrawn),
			Wallet: wallet,
			Amount: ev.Amount.String(),
			TxHash: txHash,
			Block:  ev.Block,
		})
	}

	log.Printf("Withdrawal confirmed: wallet=%s amount=%s block=%d", wallet, ev.Amount, ev.Block)
	return nil
}
