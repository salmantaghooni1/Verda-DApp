package api

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"verdadapp/backend/internal/services"
)

func JWTMiddleware(auth *services.AuthService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing bearer token"})
			}

			tokenStr := strings.TrimPrefix(header, "Bearer ")
			wallet, err := auth.ValidateJWT(tokenStr)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid or expired token"})
			}

			c.Set("wallet", wallet)
			return next(c)
		}
	}
}

type bucket struct {
	mu       sync.Mutex
	tokens   float64
	lastSeen time.Time
}

type RateLimiterConfig struct {
	Rate  float64
	Burst float64
}

func RateLimiter(cfg RateLimiterConfig) echo.MiddlewareFunc {
	var mu sync.Mutex
	buckets := make(map[string]*bucket)

	// clean up stale buckets every 5m
	go func() {
		for range time.Tick(5 * time.Minute) {
			mu.Lock()
			for k, b := range buckets {
				if time.Since(b.lastSeen) > 10*time.Minute {
					delete(buckets, k)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ip := c.RealIP()

			mu.Lock()
			b, ok := buckets[ip]
			if !ok {
				b = &bucket{tokens: cfg.Burst}
				buckets[ip] = b
			}
			mu.Unlock()

			b.mu.Lock()
			defer b.mu.Unlock()

			now := time.Now()
			elapsed := now.Sub(b.lastSeen).Seconds()
			b.lastSeen = now

			b.tokens += elapsed * cfg.Rate
			if b.tokens > cfg.Burst {
				b.tokens = cfg.Burst
			}

			if b.tokens < 1 {
				c.Response().Header().Set("Retry-After", "1")
				return c.JSON(http.StatusTooManyRequests, map[string]string{"error": "rate limit exceeded"})
			}

			b.tokens--
			return next(c)
		}
	}
}

func SecurityHeaders() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Response().Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("X-XSS-Protection", "1; mode=block")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Content-Security-Policy", "default-src 'self'")
			h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			return next(c)
		}
	}
}
