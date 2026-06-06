package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/golang-jwt/jwt"
)

type AuthService struct {
	db        *sql.DB
	jwtSecret []byte
}

func NewAuthService(db *sql.DB) *AuthService {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" || len(secret) < 32 {
		panic("JWT_SECRET env var must be set and at least 32 characters")
	}
	return &AuthService{db: db, jwtSecret: []byte(secret)}
}

type NonceRecord struct {
	Nonce     string
	Wallet    string
	Message   string
	ExpiresAt time.Time
}

func (a *AuthService) GenerateChallenge(wallet string) (*NonceRecord, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return nil, fmt.Errorf("nonce generation failed: %w", err)
	}
	nonce := hex.EncodeToString(b)

	message := fmt.Sprintf(
		"Welcome to Verda.\n\nSign this message to verify ownership of your wallet.\n\nNonce: %s\nTimestamp: %d",
		nonce,
		time.Now().Unix(),
	)

	expiresAt := time.Now().Add(5 * time.Minute)

	_, err := a.db.Exec(
		`INSERT INTO auth_nonces (nonce, wallet_address, message, expires_at)
		 VALUES ($1, $2, $3, $4)`,
		nonce, strings.ToLower(wallet), message, expiresAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to store nonce: %w", err)
	}

	return &NonceRecord{
		Nonce:     nonce,
		Wallet:    wallet,
		Message:   message,
		ExpiresAt: expiresAt,
	}, nil
}

func (a *AuthService) VerifyAndIssueToken(wallet, signature, nonce string) (string, error) {
	record, err := a.consumeNonce(nonce, strings.ToLower(wallet))
	if err != nil {
		return "", err
	}

	recovered, err := recoverEthAddress(record.Message, signature)
	if err != nil {
		return "", fmt.Errorf("signature recovery failed: %w", err)
	}

	if !strings.EqualFold(recovered, wallet) {
		return "", errors.New("signature does not match wallet address")
	}

	if err := a.upsertUser(strings.ToLower(wallet)); err != nil {
		return "", fmt.Errorf("user upsert failed: %w", err)
	}

	return a.issueJWT(wallet)
}

func (a *AuthService) consumeNonce(nonce, wallet string) (*NonceRecord, error) {
	rec := &NonceRecord{}
	var used bool

	err := a.db.QueryRow(
		`SELECT nonce, wallet_address, message, expires_at, used
		 FROM auth_nonces WHERE nonce = $1 AND wallet_address = $2`,
		nonce, wallet,
	).Scan(&rec.Nonce, &rec.Wallet, &rec.Message, &rec.ExpiresAt, &used)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("invalid or expired nonce")
	}
	if err != nil {
		return nil, fmt.Errorf("nonce lookup failed: %w", err)
	}
	if used {
		return nil, errors.New("nonce already used")
	}
	if time.Now().After(rec.ExpiresAt) {
		return nil, errors.New("nonce expired")
	}

	_, err = a.db.Exec(
		`UPDATE auth_nonces SET used = TRUE WHERE nonce = $1`,
		nonce,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to invalidate nonce: %w", err)
	}

	return rec, nil
}

func (a *AuthService) upsertUser(wallet string) error {
	_, err := a.db.Exec(
		`INSERT INTO users (wallet_address) VALUES ($1)
		 ON CONFLICT (wallet_address) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
		wallet,
	)
	return err
}

func (a *AuthService) issueJWT(wallet string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": strings.ToLower(wallet),
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})

	return token.SignedString(a.jwtSecret)
}

func (a *AuthService) ValidateJWT(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		hmac, ok := t.Method.(*jwt.SigningMethodHMAC)
		if !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		if hmac.Alg() != "HS256" {
			return nil, fmt.Errorf("unsupported HMAC algorithm: %s", hmac.Alg())
		}
		return a.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}

	wallet, ok := claims["sub"].(string)
	if !ok || wallet == "" {
		return "", errors.New("missing subject claim")
	}

	return wallet, nil
}

func recoverEthAddress(message, hexSig string) (string, error) {
	sig, err := hexutil.Decode(hexSig)
	if err != nil {
		return "", fmt.Errorf("invalid signature hex: %w", err)
	}
	if len(sig) != 65 {
		return "", errors.New("invalid signature length, expected 65 bytes")
	}

	if sig[64] >= 27 {
		sig[64] -= 27
	}

	hash := accounts.TextHash([]byte(message))

	pubKey, err := crypto.SigToPub(hash, sig)
	if err != nil {
		return "", fmt.Errorf("failed to recover public key: %w", err)
	}

	return crypto.PubkeyToAddress(*pubKey).Hex(), nil
}

func (a *AuthService) CleanExpiredNonces() error {
	_, err := a.db.Exec(
		`DELETE FROM auth_nonces WHERE expires_at < NOW() - INTERVAL '1 hour'`,
	)
	return err
}
