package services

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"
)

type Cache interface {
	Get(ctx context.Context, key string, dest interface{}) error
	Set(ctx context.Context, key string, val interface{}, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
}

type cacheEntry struct {
	data      []byte
	expiresAt time.Time
}

type MemoryCache struct {
	mu    sync.RWMutex
	store map[string]*cacheEntry
}

func NewMemoryCache() *MemoryCache {
	c := &MemoryCache{store: make(map[string]*cacheEntry)}
	go c.evict()
	return c
}

var ErrCacheMiss = errors.New("cache miss")

func (c *MemoryCache) Get(_ context.Context, key string, dest interface{}) error {
	c.mu.RLock()
	entry, ok := c.store[key]
	c.mu.RUnlock()

	if !ok || time.Now().After(entry.expiresAt) {
		return ErrCacheMiss
	}
	return json.Unmarshal(entry.data, dest)
}

func (c *MemoryCache) Set(_ context.Context, key string, val interface{}, ttl time.Duration) error {
	data, err := json.Marshal(val)
	if err != nil {
		return err
	}
	c.mu.Lock()
	c.store[key] = &cacheEntry{data: data, expiresAt: time.Now().Add(ttl)}
	c.mu.Unlock()
	return nil
}

func (c *MemoryCache) Delete(_ context.Context, key string) error {
	c.mu.Lock()
	delete(c.store, key)
	c.mu.Unlock()
	return nil
}

func (c *MemoryCache) evict() {
	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		c.mu.Lock()
		for k, v := range c.store {
			if now.After(v.expiresAt) {
				delete(c.store, k)
			}
		}
		c.mu.Unlock()
	}
}
