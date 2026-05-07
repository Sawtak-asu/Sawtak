# Teardown all Sawtak networks (run when you want to completely reset)
# WARNING: This will remove ALL containers using these networks

echo "Removing all Sawtak containers..."
docker ps -a --filter "network=sawatk_test_internal" --format "{{.Names}}" | xargs -r docker rm -f 2>$null
docker ps -a --filter "network=sawatk_test_proxy" --format "{{.Names}}" | xargs -r docker rm -f 2>$null
docker ps -a --filter "network=sawatk_test_privacy" --format "{{.Names}}" | xargs -r docker rm -f 2>$null

echo "Removing networks..."
docker network rm sawtak_test_internal 2>$null || echo "sawatk_test_internal already gone"
docker network rm sawtak_test_proxy 2>$null || echo "sawatk_test_proxy already gone"
docker network rm sawtak_test_privacy 2>$null || echo "sawatk_test_privacy already gone"

echo "Done. Run ./setup-networks.sh to recreate."