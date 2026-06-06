package services

import (
	"context"
	"log"
)

// NotificationService sends alerts when key events occur.
// In production this would integrate with SendGrid / Twilio / webhooks,
// but for the assessment it just logs — swap the log.Printf for real calls.
type NotificationService struct{}

func NewNotificationService() *NotificationService {
	return &NotificationService{}
}

func (n *NotificationService) InvestmentConfirmed(_ context.Context, wallet, txHash, amount string) {
	log.Printf("[NOTIFY] investment confirmed wallet=%s amount=%s tx=%s", wallet, amount, txHash)
}

func (n *NotificationService) ReturnsAvailable(_ context.Context, wallet, amount string) {
	log.Printf("[NOTIFY] returns available wallet=%s amount=%s", wallet, amount)
}

func (n *NotificationService) WithdrawalCompleted(_ context.Context, wallet, txHash, amount string) {
	log.Printf("[NOTIFY] withdrawal completed wallet=%s amount=%s tx=%s", wallet, amount, txHash)
}
