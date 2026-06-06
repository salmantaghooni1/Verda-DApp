.PHONY: help build run test lint clean

help:
	@echo "Available commands:"
	@echo "  make build   - Build the binary"
	@echo "  make run     - Run the service"
	@echo "  make test    - Run tests"
	@echo "  make lint    - Run linter"
	@echo "  make clean   - Clean build artifacts"

build:
	go build -o bin/verdaapp cmd/main.go

run:
	go run cmd/main.go

test:
	go test -v ./...

lint:
	golangci-lint run

clean:
	rm -rf bin/

deps:
	go mod download && go mod tidy

docker-build:
	docker build -t verdadapp-backend .

docker-run:
	docker run -p 8000:8000 --env-file .env verdadapp-backend
