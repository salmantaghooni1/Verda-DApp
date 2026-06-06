package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"verdadapp/backend/internal/api"
	"verdadapp/backend/internal/database"
	"verdadapp/backend/internal/services"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	db, err := database.Connect(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("DB connect failed: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("DB migrate failed: %v", err)
	}

	authService := services.NewAuthService(db)
	cache := services.NewMemoryCache()
	analyticsService := services.NewAnalyticsService(db, cache)
	returnsCalc := services.NewReturnsCalculator(db)

	var (
		blockchainService *services.BlockchainService
		eventListener     *services.EventListener
		kafkaPublisher    *services.KafkaPublisher
		kafkaConsumer     *services.KafkaConsumer
		returnWorker      *services.ReturnWorker
	)

	if brokers := os.Getenv("KAFKA_BROKERS"); brokers != "" {
		bs := strings.Split(brokers, ",")
		kafkaPublisher = services.NewKafkaPublisher(bs)
		kafkaConsumer  = services.NewKafkaConsumer(bs)
		defer kafkaPublisher.Close()
	}

	if os.Getenv("ETH_RPC_URL") != "" && os.Getenv("INVESTMENT_CONTRACT_ADDRESS") != "" {
		var bcErr error
		blockchainService, bcErr = services.NewBlockchainService()
		if bcErr != nil {
			log.Printf("Blockchain unavailable: %v", bcErr)
		} else {
			defer blockchainService.Close()
			eventListener = services.NewEventListener(db, blockchainService, returnsCalc, kafkaPublisher)
		}
	}

	returnWorker = services.NewReturnWorker(returnsCalc, analyticsService, kafkaPublisher)

	handlers := api.NewHandlers(db, authService, blockchainService, analyticsService)

	e := echo.New()
	e.HideBanner = true
	e.HTTPErrorHandler = customErrorHandler

	e.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{
		LogErrorFunc: func(c echo.Context, err error, stack []byte) error {
			log.Printf("PANIC: %v\n%s", err, stack)
			return nil
		},
	}))
	e.Use(middleware.RequestID())
	e.Use(middleware.Logger())
	e.Use(api.SecurityHeaders())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: getAllowedOrigins(),
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders: []string{"Content-Type", "Authorization", "X-Request-ID"},
		MaxAge:       86400,
	}))

	jwtMW      := api.JWTMiddleware(authService)
	authLimiter := api.RateLimiter(api.RateLimiterConfig{Rate: 5, Burst: 10})
	apiLimiter  := api.RateLimiter(api.RateLimiterConfig{Rate: 60, Burst: 120})

	g := e.Group("/api", apiLimiter)

	g.POST("/auth/challenge", handlers.GetChallenge, authLimiter)
	g.POST("/auth/verify",    handlers.VerifySignature, authLimiter)

	g.GET("/stats",           handlers.GetStats)
	g.GET("/stats/investors", handlers.GetTopInvestors)
	g.GET("/stats/volume",    handlers.GetDailyVolume)

	secured := g.Group("", jwtMW)
	secured.GET("/user/me",        handlers.GetUser)
	secured.GET("/investments",    handlers.ListInvestments)
	secured.GET("/investments/:id", handlers.GetInvestment)
	secured.GET("/returns",        handlers.GetReturns)
	secured.POST("/investments",   handlers.CreateInvestment)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	if eventListener != nil {
		go eventListener.Start(ctx)
	}

	go returnWorker.Run(ctx)

	if kafkaConsumer != nil {
		kafkaConsumer.Register(services.TopicReturnEvents, func(ctx context.Context, event services.KafkaEvent) error {
			log.Printf("Kafka event: type=%s wallet=%s", event.Type, event.Wallet)
			return nil
		})
		go kafkaConsumer.Start(ctx)
	}

	// hourly nonce cleanup
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := authService.CleanExpiredNonces(); err != nil {
					log.Printf("Nonce cleanup error: %v", err)
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	e.Server.ReadTimeout = 30 * time.Second
	e.Server.WriteTimeout = 30 * time.Second
	e.Server.IdleTimeout = 60 * time.Second

	g.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	go func() {
		log.Printf("Server listening on :%s", port)
		if err := e.Start(":" + port); err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Graceful shutdown initiated...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Printf("Shutdown error: %v", err)
	}
	log.Println("Server stopped")
}

func getAllowedOrigins() []string {
	if v := os.Getenv("CORS_ORIGIN"); v != "" {
		return strings.Split(v, ",")
	}
	return []string{"http://localhost:5173", "http://localhost:3000"}
}

func customErrorHandler(err error, c echo.Context) {
	he, ok := err.(*echo.HTTPError)
	if !ok {
		he = &echo.HTTPError{Code: http.StatusInternalServerError, Message: "internal server error"}
	}
	if c.Response().Committed {
		return
	}
	_ = c.JSON(he.Code, map[string]interface{}{"error": he.Message})
}
