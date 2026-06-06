package api

import (
	"context"
	"database/sql"
	"errors"
	"math/big"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"verdadapp/backend/internal/models"
	"verdadapp/backend/internal/services"
)

var ethAddrRe = regexp.MustCompile(`^0x[0-9a-fA-F]{40}$`)

type Handlers struct {
	db          *sql.DB
	auth        *services.AuthService
	blockchain  *services.BlockchainService
	analytics   *services.AnalyticsService
}

func NewHandlers(
	db *sql.DB,
	auth *services.AuthService,
	bc *services.BlockchainService,
	analytics *services.AnalyticsService,
) *Handlers {
	return &Handlers{
		db:         db,
		auth:       auth,
		blockchain: bc,
		analytics:  analytics,
	}
}

func validEthAddr(s string) bool { return ethAddrRe.MatchString(s) }
func validTxHash(s string) bool  { return len(s) == 66 && strings.HasPrefix(s, "0x") && isHex(s[2:]) }
func validSig(s string) bool     { return len(s) == 132 && strings.HasPrefix(s, "0x") && isHex(s[2:]) }

func isHex(s string) bool {
	for _, ch := range s {
		if !((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
			return false
		}
	}
	return true
}

func validAmount(s string) bool {
	if s == "" || s == "0" {
		return false
	}
	f := new(big.Float)
	_, ok := f.SetString(s)
	if !ok {
		return false
	}
	if f.Sign() <= 0 {
		return false
	}
	return true
}

// ─── Auth ────────────────────────────────────────────────────────────────────

func (h *Handlers) GetChallenge(c echo.Context) error {
	wallet := c.QueryParam("wallet")
	if !validEthAddr(wallet) {
		return errBad(c, "invalid wallet address")
	}

	rec, err := h.auth.GenerateChallenge(wallet)
	if err != nil {
		return errInternal(c, "failed to generate challenge")
	}

	return c.JSON(http.StatusOK, models.AuthChallengeResponse{
		Nonce:     rec.Nonce,
		Message:   rec.Message,
		ExpiresAt: rec.ExpiresAt,
	})
}

func (h *Handlers) VerifySignature(c echo.Context) error {
	var req models.VerifyRequest
	if err := c.Bind(&req); err != nil {
		return errBad(c, "invalid request body")
	}

	req.Wallet = strings.ToLower(req.Wallet)
	switch {
	case !validEthAddr(req.Wallet):
		return errBad(c, "invalid wallet address")
	case !validSig(req.Signature):
		return errBad(c, "invalid signature format")
	case req.Nonce == "":
		return errBad(c, "nonce required")
	}

	token, err := h.auth.VerifyAndIssueToken(req.Wallet, req.Signature, req.Nonce)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "authentication failed"})
	}

	return c.JSON(http.StatusOK, map[string]string{"token": token})
}

// ─── User ────────────────────────────────────────────────────────────────────

func (h *Handlers) GetUser(c echo.Context) error {
	wallet := mustWallet(c)

	user := &models.User{}
	err := h.db.QueryRowContext(c.Request().Context(),
		`SELECT id, wallet_address, created_at, updated_at FROM users WHERE wallet_address = $1`,
		wallet,
	).Scan(&user.ID, &user.WalletAddress, &user.CreatedAt, &user.UpdatedAt)

	if errors.Is(err, sql.ErrNoRows) {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}
	if err != nil {
		return errInternal(c, "internal error")
	}
	return c.JSON(http.StatusOK, user)
}

// ─── Investments ─────────────────────────────────────────────────────────────

func (h *Handlers) ListInvestments(c echo.Context) error {
	wallet := mustWallet(c)

	page, limit := pagination(c)
	offset := (page - 1) * limit

	ctx := c.Request().Context()

	var total int
	_ = h.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM investments WHERE wallet_address = $1`,
		wallet,
	).Scan(&total)

	rows, err := h.db.QueryContext(ctx, `
		SELECT id, wallet_address, amount, COALESCE(tx_hash,''), block_number, status, created_at, updated_at
		FROM investments
		WHERE wallet_address = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`,
		wallet, limit, offset,
	)
	if err != nil {
		return errInternal(c, "internal error")
	}
	defer rows.Close()

	items := make([]models.Investment, 0, limit)
	for rows.Next() {
		inv := models.Investment{}
		if err := rows.Scan(
			&inv.ID, &inv.WalletAddress, &inv.Amount, &inv.TxHash,
			&inv.BlockNumber, &inv.Status, &inv.CreatedAt, &inv.UpdatedAt,
		); err != nil {
			continue
		}
		items = append(items, inv)
	}
	if err := rows.Err(); err != nil {
		return errInternal(c, "internal error")
	}

	return c.JSON(http.StatusOK, models.PaginatedInvestments{
		Items: items, Total: total, Page: page, Limit: limit,
	})
}

func (h *Handlers) GetInvestment(c echo.Context) error {
	id := c.Param("id")
	if _, err := strconv.Atoi(id); err != nil {
		return errBad(c, "invalid id")
	}

	inv := &models.Investment{}
	err := h.db.QueryRowContext(c.Request().Context(), `
		SELECT id, wallet_address, amount, COALESCE(tx_hash,''), block_number, status, created_at, updated_at
		FROM investments WHERE id = $1`, id,
	).Scan(
		&inv.ID, &inv.WalletAddress, &inv.Amount, &inv.TxHash,
		&inv.BlockNumber, &inv.Status, &inv.CreatedAt, &inv.UpdatedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
	}
	if err != nil {
		return errInternal(c, "internal error")
	}
	return c.JSON(http.StatusOK, inv)
}

func (h *Handlers) CreateInvestment(c echo.Context) error {
	authWallet := mustWallet(c)

	var req models.CreateInvestmentRequest
	if err := c.Bind(&req); err != nil {
		return errBad(c, "invalid request body")
	}

	req.Wallet = strings.ToLower(req.Wallet)
	req.TxHash = strings.ToLower(req.TxHash)

	switch {
	case !validEthAddr(req.Wallet):
		return errBad(c, "invalid wallet address")
	case !strings.EqualFold(req.Wallet, authWallet):
		return c.JSON(http.StatusForbidden, map[string]string{"error": "wallet mismatch"})
	case !validTxHash(req.TxHash):
		return errBad(c, "invalid tx_hash format")
	}

	if !validAmount(req.Amount) {
		return errBad(c, "invalid amount format")
	}

	result := &models.Investment{}
	err := h.db.QueryRowContext(c.Request().Context(), `
		INSERT INTO investments (wallet_address, amount, tx_hash, status)
		VALUES ($1, $2, $3, 'pending')
		RETURNING id, wallet_address, amount, COALESCE(tx_hash,''), block_number, status, created_at, updated_at`,
		req.Wallet, req.Amount, req.TxHash,
	).Scan(
		&result.ID, &result.WalletAddress, &result.Amount, &result.TxHash,
		&result.BlockNumber, &result.Status, &result.CreatedAt, &result.UpdatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			return c.JSON(http.StatusConflict, map[string]string{"error": "transaction already recorded"})
		}
		if strings.Contains(err.Error(), "foreign key") {
			return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": "user must connect wallet first"})
		}
		return errInternal(c, "failed to create investment")
	}

	return c.JSON(http.StatusCreated, result)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

func (h *Handlers) GetStats(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	stats, err := h.analytics.GetStats(ctx)
	if err != nil {
		return errInternal(c, "failed to fetch stats")
	}
	return c.JSON(http.StatusOK, stats)
}

func (h *Handlers) GetTopInvestors(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	result, err := h.analytics.GetTopInvestors(ctx, limit)
	if err != nil {
		return errInternal(c, "internal error")
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handlers) GetDailyVolume(c echo.Context) error {
	days, _ := strconv.Atoi(c.QueryParam("days"))
	if days <= 0 {
		days = 30
	}
	if days > 365 {
		days = 365
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	result, err := h.analytics.GetDailyVolume(ctx, days)
	if err != nil {
		return errInternal(c, "internal error")
	}
	return c.JSON(http.StatusOK, result)
}

// ─── Returns ─────────────────────────────────────────────────────────────────

func (h *Handlers) GetReturns(c echo.Context) error {
	wallet := mustWallet(c)

	if h.blockchain == nil {
		return c.JSON(http.StatusOK, models.InvestorOnChain{InvestedAmount: "0", ReturnsAmount: "0"})
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 10*time.Second)
	defer cancel()

	data, err := h.blockchain.GetInvestmentData(ctx, wallet)
	if err != nil {
		return errInternal(c, "blockchain read failed")
	}
	return c.JSON(http.StatusOK, data)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func mustWallet(c echo.Context) string {
	v, _ := c.Get("wallet").(string)
	return v
}

func pagination(c echo.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.QueryParam("page"))
	limit, _ = strconv.Atoi(c.QueryParam("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	} else if limit > 100 {
		limit = 100
	}
	return
}

func errBad(c echo.Context, msg string) error {
	return c.JSON(http.StatusBadRequest, map[string]string{"error": msg})
}

func errInternal(c echo.Context, msg string) error {
	return c.JSON(http.StatusInternalServerError, map[string]string{"error": msg})
}
