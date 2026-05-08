# Creates external Docker networks for the Sawtak modular stack
# Run this ONCE before starting any compose file: ./setup-networks.sh

docker network create sawtak_test_internal --driver bridge 2>$null || echo "Network sawtak_test_internal already exists"
docker network create sawtak_test_proxy --driver bridge 2>$null || echo "Network sawtak_test_proxy already exists"
docker network create sawtak_test_privacy --driver bridge 2>$null || echo "Network sawtak_test_privacy already exists"

echo "All networks ready:"
docker network ls | grep sawtak_test