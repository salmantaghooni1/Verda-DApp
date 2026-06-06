package services

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"strings"
	"time"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"verdadapp/backend/internal/models"
)

const investmentABI = `[
  {"inputs":[],"name":"invest","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getInvestor","outputs":[
    {"internalType":"uint256","name":"investedAmount","type":"uint256"},
    {"internalType":"uint256","name":"returnsAmount","type":"uint256"},
    {"internalType":"uint256","name":"investmentCount","type":"uint256"},
    {"internalType":"uint256","name":"lastInvestmentTime","type":"uint256"}
  ],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"withdrawReturns","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getTotalStats","outputs":[
    {"internalType":"uint256","name":"invested","type":"uint256"},
    {"internalType":"uint256","name":"numInvestors","type":"uint256"},
    {"internalType":"uint256","name":"aprValue","type":"uint256"}
  ],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[
    {"indexed":true,"internalType":"address","name":"investor","type":"address"},
    {"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}
  ],"name":"InvestmentMade","type":"event"},
  {"anonymous":false,"inputs":[
    {"indexed":true,"internalType":"address","name":"investor","type":"address"},
    {"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}
  ],"name":"ReturnsDistributed","type":"event"},
  {"anonymous":false,"inputs":[
    {"indexed":true,"internalType":"address","name":"investor","type":"address"},
    {"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}
  ],"name":"ReturnsWithdrawn","type":"event"}
]`

type EventType string

const (
	EventInvestmentMade      EventType = "InvestmentMade"
	EventReturnsDistributed  EventType = "ReturnsDistributed"
	EventReturnsWithdrawn    EventType = "ReturnsWithdrawn"
)

type ContractEvent struct {
	Type      EventType
	Investor  common.Address
	Amount    *big.Int
	TxHash    string
	Block     uint64
	LogIndex  uint
}

type BlockchainService struct {
	client       *ethclient.Client
	contractAddr common.Address
	contractABI  abi.ABI
	rpcURL       string
}

func NewBlockchainService() (*BlockchainService, error) {
	rpcURL := os.Getenv("ETH_RPC_URL")
	if rpcURL == "" {
		return nil, fmt.Errorf("ETH_RPC_URL not set")
	}

	contractAddrStr := os.Getenv("INVESTMENT_CONTRACT_ADDRESS")
	if contractAddrStr == "" {
		return nil, fmt.Errorf("INVESTMENT_CONTRACT_ADDRESS not set")
	}

	parsed, err := abi.JSON(strings.NewReader(investmentABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	client, err := dialWithRetry(rpcURL, 3)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum: %w", err)
	}

	return &BlockchainService{
		client:       client,
		contractAddr: common.HexToAddress(contractAddrStr),
		contractABI:  parsed,
		rpcURL:       rpcURL,
	}, nil
}

func dialWithRetry(url string, attempts int) (*ethclient.Client, error) {
	var lastErr error
	for i := 0; i < attempts; i++ {
		client, err := ethclient.Dial(url)
		if err == nil {
			return client, nil
		}
		lastErr = err
		time.Sleep(time.Duration(1<<uint(i)) * time.Second)
	}
	return nil, lastErr
}

func (bs *BlockchainService) GetInvestmentData(ctx context.Context, wallet string) (*models.InvestorOnChain, error) {
	addr := common.HexToAddress(wallet)

	callData, err := bs.contractABI.Pack("getInvestor", addr)
	if err != nil {
		return nil, fmt.Errorf("ABI pack failed: %w", err)
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	result, err := bs.client.CallContract(ctx, ethereum.CallMsg{
		To:   &bs.contractAddr,
		Data: callData,
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("contract call failed: %w", err)
	}

	outputs, err := bs.contractABI.Unpack("getInvestor", result)
	if err != nil {
		return nil, fmt.Errorf("ABI unpack failed: %w", err)
	}
	if len(outputs) < 4 {
		return nil, fmt.Errorf("unexpected output length")
	}

	invested  := outputs[0].(*big.Int)
	returns   := outputs[1].(*big.Int)
	count     := outputs[2].(*big.Int)
	lastTime  := outputs[3].(*big.Int)

	return &models.InvestorOnChain{
		InvestedAmount:  weiToEthStr(invested),
		ReturnsAmount:   weiToEthStr(returns),
		InvestmentCount: count.Uint64(),
		LastInvestment:  lastTime.Int64(),
	}, nil
}

func (bs *BlockchainService) SubscribeToEvents(ctx context.Context, out chan<- ContractEvent) error {
	query := ethereum.FilterQuery{
		Addresses: []common.Address{bs.contractAddr},
	}

	logs := make(chan types.Log, 64)
	sub, err := bs.client.SubscribeFilterLogs(ctx, query, logs)
	if err != nil {
		return fmt.Errorf("subscribe failed: %w", err)
	}

	go func() {
		defer sub.Unsubscribe()
		for {
			select {
			case err := <-sub.Err():
				if err != nil && ctx.Err() == nil {
					// reconnect handled by EventListener
				}
				return
			case log := <-logs:
				event, err := bs.parseLog(log)
				if err != nil {
					continue
				}
				select {
				case out <- *event:
				case <-ctx.Done():
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	return nil
}

func (bs *BlockchainService) FilterPastEvents(ctx context.Context, fromBlock, toBlock uint64) ([]ContractEvent, error) {
	from := big.NewInt(int64(fromBlock))
	to   := big.NewInt(int64(toBlock))

	query := ethereum.FilterQuery{
		FromBlock: from,
		ToBlock:   to,
		Addresses: []common.Address{bs.contractAddr},
	}

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	logs, err := bs.client.FilterLogs(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("filter logs failed: %w", err)
	}

	events := make([]ContractEvent, 0, len(logs))
	for _, l := range logs {
		e, err := bs.parseLog(l)
		if err != nil || e == nil {
			continue
		}
		events = append(events, *e)
	}
	return events, nil
}

func (bs *BlockchainService) parseLog(log types.Log) (*ContractEvent, error) {
	if len(log.Topics) == 0 {
		return nil, fmt.Errorf("no topics")
	}

	for _, eventName := range []string{"InvestmentMade", "ReturnsDistributed", "ReturnsWithdrawn"} {
		ev, ok := bs.contractABI.Events[eventName]
		if !ok {
			continue
		}
		if log.Topics[0] != ev.ID {
			continue
		}

		investor := common.HexToAddress(log.Topics[1].Hex())

		data := make(map[string]interface{})
		if err := bs.contractABI.UnpackIntoMap(data, eventName, log.Data); err != nil {
			return nil, err
		}

		amount, _ := data["amount"].(*big.Int)

		return &ContractEvent{
			Type:     EventType(eventName),
			Investor: investor,
			Amount:   amount,
			TxHash:   log.TxHash.Hex(),
			Block:    log.BlockNumber,
			LogIndex: log.Index,
		}, nil
	}
	return nil, nil
}

func (bs *BlockchainService) GetBlockNumber(ctx context.Context) (uint64, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return bs.client.BlockNumber(ctx)
}

func (bs *BlockchainService) GetTxReceipt(ctx context.Context, txHash string) (*types.Receipt, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	return bs.client.TransactionReceipt(ctx, common.HexToHash(txHash))
}

func (bs *BlockchainService) Close() {
	bs.client.Close()
}

func weiToEthStr(wei *big.Int) string {
	if wei == nil {
		return "0"
	}
	eth := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		new(big.Float).SetInt(big.NewInt(1e18)),
	)
	return eth.Text('f', 18)
}
