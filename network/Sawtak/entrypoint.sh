#!/bin/sh

HOME_DIR="/root/.sawtak"
CHAIN_ID="${CHAIN_ID:-sawtak-testnet-1}"
MONIKER="${MONIKER:-sawtak-node}"

if [ ! -d "$HOME_DIR/config" ]; then
    echo "Initializing Sawtak node: $MONIKER..."
    sawtakd init $MONIKER --chain-id $CHAIN_ID
    
    # Configure defaults
    sawtakd config set client chain-id $CHAIN_ID
    sawtakd config set client keyring-backend test
    
    # Admin account for the network
    echo "tenant mutual lab resist together wrestle tribe drop girl negative unit intact fiction island rapid inform amateur west reject hood lottery issue athlete brief" | sawtakd keys add admin --recover --keyring-backend test
    
    # Genesis setup
    # If this is the seed node (node 1), it initializes the genesis
    # In this local dev setup, we simplify: all nodes init the same way but link via peers
    sawtakd genesis add-genesis-account admin 10000000000000usawtak,10000000000000stake --keyring-backend test
    sawtakd genesis gentx admin 1000000000stake --chain-id $CHAIN_ID --keyring-backend test
    sawtakd genesis collect-gentxs
    
    # Network config
    sed -i 's/127.0.0.1:26657/0.0.0.0:26657/g' $HOME_DIR/config/config.toml
    sed -i 's/localhost:1317/0.0.0.0:1317/g' $HOME_DIR/config/app.toml
    sed -i 's/addr_book_strict = true/addr_book_strict = false/g' $HOME_DIR/config/config.toml
    sed -i 's/enable = false/enable = true/g' $HOME_DIR/config/app.toml
    
    # Set minimum gas prices (required)
    sawtakd config set app minimum-gas-prices "0.01usawtak"
    sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.01usawtak"/g' $HOME_DIR/config/app.toml
    
    # Peer discovery
    if [ ! -z "$PERSISTENT_PEERS" ]; then
        echo "Setting persistent peers: $PERSISTENT_PEERS"
        sed -i "s/persistent_peers = \"\"/persistent_peers = \"$PERSISTENT_PEERS\"/g" $HOME_DIR/config/config.toml
    fi
fi

# Export Node ID for multi-node setups if requested
if [ "$1" = "get-node-id" ]; then
    sawtakd tendermint show-node-id
    exit 0
fi

echo "Starting Sawtak chain..."
exec sawtakd start --rpc.laddr tcp://0.0.0.0:26657 --api.enable --grpc.address 0.0.0.0:9090 --minimum-gas-prices="0.01usawtak"
