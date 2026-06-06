package services

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
)

const (
	TopicInvestmentEvents = "verda.investment.events"
	TopicReturnEvents     = "verda.return.events"
	consumerGroupID       = "verdadapp-backend"
)

type KafkaEvent struct {
	Type      string `json:"type"`
	Wallet    string `json:"wallet"`
	Amount    string `json:"amount,omitempty"`
	TxHash    string `json:"tx_hash,omitempty"`
	Block     uint64 `json:"block,omitempty"`
	Timestamp int64  `json:"timestamp"`
}

// ─── Publisher ───────────────────────────────────────────────────────────────

type KafkaPublisher struct {
	writers map[string]*kafka.Writer
}

func NewKafkaPublisher(brokers []string) *KafkaPublisher {
	makeWriter := func(topic string) *kafka.Writer {
		return &kafka.Writer{
			Addr:         kafka.TCP(brokers...),
			Topic:        topic,
			Balancer:     &kafka.LeastBytes{},
			BatchTimeout: 10 * time.Millisecond,
			RequiredAcks: kafka.RequireOne,
			Async:        false,
		}
	}
	return &KafkaPublisher{
		writers: map[string]*kafka.Writer{
			TopicInvestmentEvents: makeWriter(TopicInvestmentEvents),
			TopicReturnEvents:     makeWriter(TopicReturnEvents),
		},
	}
}

func (kp *KafkaPublisher) Publish(ctx context.Context, topic string, event KafkaEvent) error {
	writer, ok := kp.writers[topic]
	if !ok {
		return nil
	}

	event.Timestamp = time.Now().UnixMilli()
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(strings.ToLower(event.Wallet)),
		Value: data,
	})
}

func (kp *KafkaPublisher) Close() {
	for _, w := range kp.writers {
		w.Close()
	}
}

// ─── Consumer ────────────────────────────────────────────────────────────────

type MessageHandler func(ctx context.Context, event KafkaEvent) error

type KafkaConsumer struct {
	brokers  []string
	handlers map[string]MessageHandler
}

func NewKafkaConsumer(brokers []string) *KafkaConsumer {
	return &KafkaConsumer{
		brokers:  brokers,
		handlers: make(map[string]MessageHandler),
	}
}

func (kc *KafkaConsumer) Register(topic string, handler MessageHandler) {
	kc.handlers[topic] = handler
}

func (kc *KafkaConsumer) Start(ctx context.Context) {
	for topic, handler := range kc.handlers {
		go kc.consume(ctx, topic, handler)
	}
	<-ctx.Done()
}

func (kc *KafkaConsumer) consume(ctx context.Context, topic string, handler MessageHandler) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        kc.brokers,
		Topic:          topic,
		GroupID:        consumerGroupID,
		MinBytes:       1,
		MaxBytes:       10e6,
		CommitInterval: time.Second,
		StartOffset:    kafka.LastOffset,
	})
	defer reader.Close()

	log.Printf("Kafka consumer started: topic=%s", topic)

	for ctx.Err() == nil {
		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() == nil {
				log.Printf("Kafka fetch error [%s]: %v", topic, err)
				time.Sleep(2 * time.Second)
			}
			continue
		}

		var event KafkaEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("Kafka parse error: %v", err)
			reader.CommitMessages(ctx, msg)
			continue
		}

		if err := handler(ctx, event); err != nil {
			log.Printf("Kafka handler error [%s/%s]: %v", topic, event.Type, err)
		}

		reader.CommitMessages(ctx, msg)
	}
}
