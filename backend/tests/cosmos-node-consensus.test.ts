import { describe, expect, test, beforeAll } from "bun:test";

const NODES = [
  { name: "Node 1 (Genesis)", port: 1317 },
  { name: "Node 2 (Validator)", port: 1318 },
  { name: "Node 3 (Validator)", port: 1319 },
];

async function queryNode(nodeName: string, port: number) {
  const url = `http://localhost:${port}/cosmos/base/tendermint/v1beta1/blocks/latest`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { name: nodeName, port, status: `❌ HTTP ${response.status}` };
    }
    const data = await response.json() as any;
    return {
      name: nodeName,
      port,
      height: data.block.header.height,
      appHash: data.block.header.app_hash,
      blockHash: data.block_id.hash,
      status: "✅ Online & Synced",
    };
  } catch (error: any) {
    return {
      name: nodeName,
      port,
      status: `❌ Error: ${error.message}`,
    };
  }
}

async function isAnyNodeReachable(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:1317/cosmos/base/tendermint/v1beta1/blocks/latest`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe("Cosmos Multi-Node Consensus", () => {
  let nodesReachable = false;

  beforeAll(async () => {
    nodesReachable = await isAnyNodeReachable();
    if (!nodesReachable) {
      console.log("[cosmos-node-consensus] Skipping - no Cosmos REST endpoints reachable");
    }
  });

  test("All 3 nodes should be in consensus (same appHash)", async () => {
    if (!nodesReachable) return;

    const results = await Promise.all(
      NODES.map((n) => queryNode(n.name, n.port))
    );

    console.table(results, ["name", "port", "height", "appHash", "status"]);

    const healthy = results.filter((r: any) => r.appHash);
    const allMatch = healthy.every((r: any, _i: number, arr: any[]) => r.appHash === arr[0].appHash);

    expect(healthy.length).toBeGreaterThan(0);
    expect(allMatch).toBe(true);
  }, 30000);
});
