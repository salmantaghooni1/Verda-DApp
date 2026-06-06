# Verda - On-chain Yield Investment Platform

A production-grade investment platform combining React frontend, Go backend services, Ethereum smart contracts, and PostgreSQL persistence.

## Architecture

```
Frontend (React/TS) → Backend (Go) → Ethereum Network
                   ↓
                PostgreSQL
                   ↓
              Event Listeners
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Go 1.21, Echo framework, PostgreSQL
- **Blockchain**: Solidity 0.8.20, Ethereum, OpenZeppelin
- **Infrastructure**: Docker, Kafka (event streaming)
- **Database**: PostgreSQL (primary), ClickHouse (analytics)

## Quick Start

### Prerequisites
- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- MetaMask or wallet extension

### Development

```bash
# Start infrastructure
docker-compose up -d

# Frontend
npm install && npm run dev

# Backend (from backend/)
go mod download && go run cmd/main.go
```

### Smart Contract

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

## Project Structure

```
.
├── src/                    # React frontend (TypeScript)
│   ├── components/        # UI components
│   ├── services/          # Business logic & context
│   ├── types/             # TypeScript definitions
│   └── styles/            # CSS
├── backend/               # Go backend services
│   ├── cmd/              # Entry point
│   ├── internal/         # Core logic
│   │   ├── api/         # HTTP handlers
│   │   ├── database/    # PostgreSQL
│   │   ├── models/      # Domain models
│   │   └── services/    # Auth, Blockchain, Analytics, Events
│   └── Dockerfile       # Container image
├── contracts/            # Solidity (Ethereum only)
│   ├── Investment.sol   # Main investment vault
│   ├── interfaces/      # Contract interfaces
│   ├── scripts/         # Deployment scripts
│   └── hardhat.config.ts
├── index.html           # HTML entry
├── vite.config.ts       # Vite config
└── docker-compose.yml   # Local stack
```

## API Endpoints

### Authentication
- `POST /api/auth/challenge` - Get nonce for signing
- `POST /api/auth/verify` - Verify signature, get JWT

### Investments
- `GET /api/investments` - List user investments
- `POST /api/investments` - Create new investment
- `GET /api/investments/:id` - Get investment details

### Statistics & Returns
- `GET /api/stats` - Total TVL, investors, volume
- `GET /api/returns` - User's claimable returns

## Smart Contract

Investment.sol implements:
- Wallet-based authentication (no passwords)
- Direct ETH deposits
- Return distribution (APR: 11.4%)
- Withdrawal mechanism
- ReentrancyGuard protection
- Emergency pause capability

### Interact

```solidity
// Invest 1 ETH
contract.invest{value: ethers.parseEther("1.0")}()

// Check investment
(amount, returns, count, lastTime) = contract.getInvestor(wallet)

// Withdraw returns
contract.withdrawReturns()
```

## Environment Setup

```bash
cp .env.example .env
```

Configure:
```
ETH_RPC_URL=https://eth.llamarpc.com
DATABASE_URL=postgres://user:pass@localhost/verdadapp
INVESTMENT_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key (for deployment)
```

## Running Tests

```bash
# Frontend type checking
npm run type-check

# Backend unit tests
go test ./...

# Contract tests
cd contracts && npx hardhat test
```

## Deployment

### Local
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d

# Verify contract on Etherscan
npx hardhat verify --network mainnet DEPLOYED_ADDRESS
```

## Security Features

✅ ReentrancyGuard (contract)  
✅ Input validation everywhere  
✅ JWT token authentication  
✅ CORS protection  
✅ SQL parameterization  
✅ Owner-only functions  
✅ Pausable emergency mechanism  

## Database Schema

**users** - Wallet addresses, nonces  
**investments** - User deposits, amounts, status  
**transactions** - On-chain tx data  
**analytics** - Daily stats aggregates  

## License

MIT
