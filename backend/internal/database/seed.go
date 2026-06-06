package database

import (
	"database/sql"
	"log"
)

func Seed(db *sql.DB) error {
	// Demo data for testing
	users := []struct {
		wallet string
	}{
		{"0x742d35Cc6634C0532925a3b844Bc2e7dEf80b5f0"},
		{"0x8ba1f109551bD432803012645Ac136ddd64DBA72"},
		{"0xd0dbc96e4b1f0e4ac1d67f6789f4dBfA7ddDd0B0"},
	}

	for _, u := range users {
		_, err := db.Exec(
			"INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT DO NOTHING",
			u.wallet,
		)
		if err != nil {
			log.Println("Seed error:", err)
			continue
		}
	}

	log.Println("Database seeded successfully")
	return nil
}
