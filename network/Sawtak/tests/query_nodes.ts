async function queryNode(nodeName: string, port: number) {
  const url = `http://localhost:${port}/cosmos/base/tendermint/v1beta1/blocks/latest`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      name: nodeName,
      port: port,
      height: data.block.header.height,
      appHash: data.block.header.app_hash,
      blockHash: data.block_id.hash,
      status: "✅ Online & Synced",
    };
  } catch (error) {
    return {
      name: nodeName,
      port: port,
      status: `❌ Error: ${error.message}`,
    };
  }
}

async function runTests() {
  console.log("🔍 Querying Sawtak Nodes for consensus sync...\n");

  const nodes = [
    { name: "Node 1 (Genesis)", port: 1317 },
    { name: "Node 2 (Validator)", port: 1318 },
    { name: "Node 3 (Validator)", port: 1319 },
  ];

  const results = await Promise.all(
    nodes.map((n) => queryNode(n.name, n.port))
  );

  console.table(results, ["name", "port", "height", "appHash", "status"]);

  // Check consensus
  const hashes = results.filter((r) => r.appHash).map((r) => r.appHash);
  const allMatch = hashes.every((val, i, arr) => val === arr[0]);

  console.log("\n--- CONSENSUS REPORT ---");
  if (hashes.length === 3 && allMatch) {
    console.log("🟢 SUCCESS: All 3 nodes are in perfect consensus!");
    console.log(`Current State Hash: ${hashes[0]}`);
  } else if (hashes.length > 0 && allMatch) {
    console.log(`🟡 PARTIAL: ${hashes.length} nodes are in consensus. Some are offline.`);
  } else {
    console.log("🔴 FAILED: Nodes have diverged or are unreachable. They are not in consensus.");
  }
}

runTests();
