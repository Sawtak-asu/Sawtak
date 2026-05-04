# ============================================
# Sawtak Cosmos Chain - Dockerfile
# ============================================

# Stage 1: Build the chain binary
FROM golang:1.26-alpine AS builder

# Install build dependencies
RUN apk add --no-cache make gcc musl-dev git

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN export GOPROXY=https://proxy.golang.org,direct && go mod download

# Copy the rest of the source code
COPY . .

# Build the binary
RUN make install

# Stage 2: Final runtime image
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

WORKDIR /root

# Copy the binary from builder
COPY --from=builder /go/bin/sawtakd /usr/local/bin/sawtakd

# Expose ports
# 26657: RPC
# 1317: REST
# 9090: gRPC
# 26656: P2P
EXPOSE 26657 1317 9090 26656

# Add a script to initialize the chain if needed
COPY --from=builder /app/config.yml ./config.yml

# We'll use a custom entrypoint to handle initialization
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# WINDOWS FIX: Strip carriage returns in case the file was saved with CRLF
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
