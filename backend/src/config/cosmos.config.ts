export const COSMOS_CONFIG = {
  RPC_ENDPOINT: process.env.COSMOS_RPC_ENDPOINT || "http://localhost:26657",
  GRPC_ENDPOINT: process.env.COSMOS_GRPC_ENDPOINT || "http://localhost:9090",
  RPC_WS: process.env.COSMOS_RPC_WS || "ws://localhost:26657/websocket",
  CHAIN_ID: process.env.COSMOS_CHAIN_ID || "sawtak-testnet-1",
  GAS_PRICE: process.env.COSMOS_GAS_PRICE || "0.025usawtak",
  BACKEND_MNEMONIC: process.env.COSMOS_BACKEND_MNEMONIC || "",
  BACKEND_ADDRESS: process.env.COSMOS_BACKEND_ADDRESS || "",
  PREFIX: process.env.COSMOS_ADDRESS_PREFIX || "sawtak",
};

export const INDEXER_CONFIG = {
  START_HEIGHT: parseInt(process.env.INDEXER_START_HEIGHT || "0"),
  POLL_INTERVAL_MS: parseInt(process.env.INDEXER_POLL_INTERVAL || "10000"),
};