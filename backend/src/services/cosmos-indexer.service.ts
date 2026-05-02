import { prisma } from "../db";
import { INDEXER_CONFIG, COSMOS_CONFIG } from "../config/cosmos.config";

interface CosmosEvent {
  type: string;
  attributes: { key: string; value: string }[];
}

interface TxResult {
  height: string;
  hash: string;
  tx_result: {
    events: CosmosEvent[];
  };
}

interface BlockResultResponse {
  result: {
    block: {
      header: {
        height: string;
        time: string;
      };
      data: {
        txs: string[];
      };
    };
  };
}

interface TxSearchResponse {
  result: {
    txs: TxResult[];
    total_count: string;
  };
}

export class CosmosIndexerService {
  private isRunning = false;
  private pollInterval: Timer | null = null;
  private lastHeight: number = INDEXER_CONFIG.START_HEIGHT;

  constructor() {
    console.log(`[CosmosIndexer] Initialized, starting from height ${this.lastHeight}`);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[CosmosIndexer] Already running");
      return;
    }

    this.isRunning = true;

    await this.loadLastHeight();

    await this.poll();

    this.pollInterval = setInterval(
      () => this.poll(),
      INDEXER_CONFIG.POLL_INTERVAL_MS
    );

    console.log(
      `[CosmosIndexer] Started, polling every ${INDEXER_CONFIG.POLL_INTERVAL_MS / 1000}s`
    );
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log("[CosmosIndexer] Stopped");
  }

  private async loadLastHeight(): Promise<void> {
    // Find the highest block height from existing indexed status updates
    // We need to track actual block heights, not our local sequence numbers
    const lastStatusUpdate = await prisma.indexedStatusUpdate.findFirst({
      orderBy: { consensus_timestamp: "desc" },
      select: { consensus_timestamp: true },
    });

    if (lastStatusUpdate) {
      // Use a default height increment since we don't store block height directly
      // The indexer will catch up by querying from last height
      this.lastHeight = INDEXER_CONFIG.START_HEIGHT;
      console.log(`[CosmosIndexer] Resuming from height ${this.lastHeight} (using configured start height)`);
    }
  }

  private async poll(): Promise<void> {
    try {
      console.log(`[CosmosIndexer] Polling from height ${this.lastHeight + 1}...`);
      const events = await this.fetchTxEvents(this.lastHeight + 1);
      console.log(`[CosmosIndexer] Found ${events.length} transactions`);
      if (events.length === 0) return;

      for (const tx of events) {
        await this.processTx(tx);
        const height = parseInt(tx.height);
        if (height > this.lastHeight) {
          this.lastHeight = height;
        }
      }
    } catch (error: any) {
      console.error("[CosmosIndexer] Poll error:", error.message);
    }
  }

  private async fetchTxEvents(fromHeight: number): Promise<TxResult[]> {
    const query = `tx.height>=${fromHeight}`;
    const url = `${COSMOS_CONFIG.RPC_ENDPOINT}/tx_search?query="${encodeURIComponent(query)}"&order_by="asc"&per_page=50`;

    try {
      const response = await fetch(url);
      if (!response.ok) return [];

      const data: TxSearchResponse = await response.json();
      return data.result?.txs || [];
    } catch {
      return [];
    }
  }

  private async processTx(tx: TxResult): Promise<void> {
    console.log(`[CosmosIndexer] Processing tx ${tx.hash} at height ${tx.height}`);
    for (const event of tx.tx_result.events) {
      console.log(`[CosmosIndexer] Found event type: ${event.type}`);
      switch (event.type) {
        case "sawtak.sawtak.v1.EventSubmitAnonymousComplaint":
          await this.indexAnonymousComplaint(tx, event);
          break;
        case "sawtak.sawtak.v1.EventSubmitIdentifiedComplaint":
          await this.indexIdentifiedComplaint(tx, event);
          break;
        case "sawtak.sawtak.v1.EventUpdateComplaintStatus":
          await this.indexStatusUpdate(tx, event);
          break;
      }
    }
  }

  private getAttr(attrs: { key: string; value: string }[], key: string): string {
    const attr = attrs.find(
      (a) => a.key === key || a.key === key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    );
    return attr?.value || "";
  }

  private async indexAnonymousComplaint(tx: TxResult, event: CosmosEvent): Promise<void> {
    const attrs = event.attributes;
    const txHash = tx.hash;
    const trackingHash = this.getAttr(attrs, "tracking_id");
    const anonId = this.getAttr(attrs, "proof");

    const existing = await prisma.indexedComplaint.findUnique({
      where: { chain_hash: txHash },
    });

    if (existing) {
      console.log(`[CosmosIndexer] Complaint already exists: ${txHash}`);
      return;
    }

    const directedToRaw = this.getAttr(attrs, "directed_to");
    let directedTo: any = null;
    try {
      directedTo = directedToRaw ? JSON.parse(directedToRaw) : null;
    } catch {}

    const evidenceRaw = this.getAttr(attrs, "evidence");
    let evidence: string[] = [];
    try {
      const parsed = JSON.parse(evidenceRaw);
      evidence = Array.isArray(parsed) ? parsed : [];
    } catch {}

    try {
      await prisma.indexedComplaint.create({
        data: {
          hcs_hash: txHash,
          chain_hash: txHash,
          chain_type: "cosmos",
          anonymous_identifier: anonId,
          tracking_hash: trackingHash || null,
          title: this.getAttr(attrs, "title"),
          complaint_text: this.getAttr(attrs, "text"),
          category: this.getAttr(attrs, "category"),
          area: this.getAttr(attrs, "area") || "Unknown",
          directed_to: directedTo,
          severity: "medium",
          incident_date: this.getAttr(attrs, "incident_date")
            ? new Date(this.getAttr(attrs, "incident_date"))
            : new Date(),
          evidence_cids: evidence,
          status: "submitted",
          consensus_timestamp: new Date(),
        },
      });
      console.log(`[CosmosIndexer] Indexed anonymous complaint: ${txHash}`);
    } catch (err: any) {
      console.error(`[CosmosIndexer] Failed to create IndexedComplaint: ${err.message}`);
    }
  }

  private async indexIdentifiedComplaint(tx: TxResult, event: CosmosEvent): Promise<void> {
    const attrs = event.attributes;
    const txHash = tx.hash;

    const existing = await prisma.indexedComplaint.findUnique({
      where: { chain_hash: txHash },
    });

    if (existing) return;

    const directedToRaw = this.getAttr(attrs, "directed_to");
    let directedTo: any = null;
    try {
      directedTo = directedToRaw ? JSON.parse(directedToRaw) : null;
    } catch {}

    const evidenceRaw = this.getAttr(attrs, "evidence");
    let evidence: string[] = [];
    try {
      const parsed = JSON.parse(evidenceRaw);
      evidence = Array.isArray(parsed) ? parsed : [];
    } catch {}

    await prisma.indexedComplaint.create({
      data: {
        hcs_hash: txHash,
        chain_hash: txHash,
        chain_type: "cosmos",
        anonymous_identifier: "",
        tracking_hash: this.getAttr(attrs, "tracking_id") || null,
        title: this.getAttr(attrs, "title"),
        complaint_text: this.getAttr(attrs, "text"),
        category: this.getAttr(attrs, "category"),
        area: this.getAttr(attrs, "area") || "Unknown",
        directed_to: directedTo,
        severity: "medium",
        incident_date: this.getAttr(attrs, "incident_date")
          ? new Date(this.getAttr(attrs, "incident_date"))
          : new Date(),
        evidence_cids: evidence,
        status: "submitted",
        consensus_timestamp: new Date(),
      },
    });

    console.log(`[CosmosIndexer] Indexed identified complaint: ${txHash}`);
  }

  private async indexStatusUpdate(tx: TxResult, event: CosmosEvent): Promise<void> {
    const attrs = event.attributes;
    const txHash = tx.hash;

    const complaintHash = this.getAttr(attrs, "complaint_id") || this.getAttr(attrs, "id");
    const existing = await prisma.indexedStatusUpdate.findUnique({
      where: { cosmos_tx_hash: txHash },
    });

    if (existing) return;

    const lastUpdate = await prisma.indexedStatusUpdate.findFirst({
      where: { complaint_hash: complaintHash },
      orderBy: { sequence_number: "desc" },
      select: { sequence_number: true },
    });

    const seq = lastUpdate ? lastUpdate.sequence_number + 1n : 1n;

    await prisma.indexedStatusUpdate.create({
      data: {
        hcs_hash: txHash,
        cosmos_tx_hash: txHash,
        complaint_hash: complaintHash,
        old_status: this.getAttr(attrs, "old_status") || "",
        new_status: this.getAttr(attrs, "new_status") || this.getAttr(attrs, "newStatus"),
        public_notes: this.getAttr(attrs, "public_notes") || "",
        admin_id: this.getAttr(attrs, "creator") || "",
        consensus_timestamp: new Date(),
        sequence_number: seq,
      },
    });

    if (complaintHash) {
      try {
        await prisma.indexedComplaint.update({
          where: { tracking_hash: complaintHash },
          data: { status: this.getAttr(attrs, "new_status") || this.getAttr(attrs, "newStatus") || "submitted" },
        });
      } catch {
        // complaint might be identified/off-chain
      }
    }

    console.log(`[CosmosIndexer] Indexed status update: ${txHash}`);
  }

  getStatus(): {
    isRunning: boolean;
    lastHeight: number;
    rpcEndpoint: string;
  } {
    return {
      isRunning: this.isRunning,
      lastHeight: this.lastHeight,
      rpcEndpoint: COSMOS_CONFIG.RPC_ENDPOINT,
    };
  }

  async reindexFrom(height: number): Promise<void> {
    console.log(`[CosmosIndexer] Reindexing from height ${height}`);
    this.lastHeight = height;
    await this.poll();
  }
}

let indexerInstance: CosmosIndexerService | null = null;

export function getIndexer(): CosmosIndexerService {
  if (!indexerInstance) {
    indexerInstance = new CosmosIndexerService();
  }
  return indexerInstance;
}

export function startIndexer(): void {
  const indexer = getIndexer();
  indexer.start();
}

export function stopIndexer(): void {
  if (indexerInstance) {
    indexerInstance.stop();
  }
}