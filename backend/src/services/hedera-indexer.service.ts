import { prisma } from "../db";

/**
 * Hedera Mirror Node Indexer Service
 * 
 * Polls the Hedera Mirror Node API for new messages on the complaints topic
 * and indexes them into the local database for fast querying.
 */

const MIRROR_NODE_URL = process.env.HEDERA_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com";
const TOPIC_ID = process.env.HEDERA_TOPIC_COMPLAINTS || "0.0.7303531";
const POLL_INTERVAL_MS = parseInt(process.env.INDEXER_POLL_INTERVAL || "10000"); // 10 seconds default

interface HederaMessage {
  consensus_timestamp: string;
  message: string; // Base64 encoded
  payer_account_id: string;
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  topic_id: string;
}

interface MirrorNodeResponse {
  messages: HederaMessage[];
  links?: {
    next?: string;
  };
}

// Actual message format from anonymous-submission.service.ts
interface ComplaintMessage {
  type?: string; // "COMPLAINT_SUBMISSION"
  anon_id: string; // encrypted anonymous identifier
  tracking_hash?: string; // hashed tracking code for user lookup
  title: string;
  text: string;
  category: string;
  area?: string;
  incident_date?: string;
  evidence?: string[];
  timestamp?: string;
}

export class HederaIndexerService {
  private isRunning = false;
  private lastTimestamp: string | null = null;
  private pollInterval: Timer | null = null;

  constructor() {
    console.log(`[HederaIndexer] Initialized for topic ${TOPIC_ID}`);
  }

  /**
   * Start the indexer polling loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[HederaIndexer] Already running");
      return;
    }

    this.isRunning = true;
    console.log(`[HederaIndexer] Starting indexer, polling every ${POLL_INTERVAL_MS / 1000}s`);

    // Load last indexed timestamp from DB
    await this.loadLastTimestamp();

    // Initial poll
    await this.poll();

    // Start polling loop
    this.pollInterval = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  /**
   * Stop the indexer
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log("[HederaIndexer] Stopped");
  }

  /**
   * Load the last indexed timestamp from the database
   */
  private async loadLastTimestamp(): Promise<void> {
    const lastComplaint = await prisma.indexedComplaint.findFirst({
      orderBy: { consensus_timestamp: "desc" },
      select: { consensus_timestamp: true },
    });

    if (lastComplaint) {
      // Convert to seconds.nanoseconds format for Mirror Node API
      const timestamp = lastComplaint.consensus_timestamp;
      this.lastTimestamp = `${Math.floor(timestamp.getTime() / 1000)}.000000000`;
      console.log(`[HederaIndexer] Resuming from timestamp ${this.lastTimestamp}`);
    } else {
      console.log("[HederaIndexer] Starting fresh, no previous messages indexed");
    }
  }

  /**
   * Poll the Mirror Node for new messages
   */
  private async poll(): Promise<void> {
    try {
      const messages = await this.fetchMessages();
      
      if (messages.length === 0) {
        return;
      }

      console.log(`[HederaIndexer] Processing ${messages.length} new messages`);

      for (const msg of messages) {
        await this.processMessage(msg);
      }

      // Update last timestamp
      this.lastTimestamp = messages[messages.length - 1].consensus_timestamp;
    } catch (error: any) {
      console.error("[HederaIndexer] Poll error:", error.message);
    }
  }

  /**
   * Fetch messages from the Mirror Node API
   */
  private async fetchMessages(): Promise<HederaMessage[]> {
    let url = `${MIRROR_NODE_URL}/api/v1/topics/${TOPIC_ID}/messages`;
    
    // Add timestamp filter if we have a last timestamp
    if (this.lastTimestamp) {
      url += `?timestamp=gt:${this.lastTimestamp}`;
    }
    
    url += this.lastTimestamp ? "&limit=100&order=asc" : "?limit=100&order=asc";

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
    }

    const data: MirrorNodeResponse = await response.json();
    return data.messages || [];
  }

  /**
   * Process and index a single message
   */
  private async processMessage(msg: HederaMessage): Promise<void> {
    try {
      // Decode base64 message
      const decodedMessage = Buffer.from(msg.message, "base64").toString("utf-8");
      
      let rawMessage: any;
      try {
        rawMessage = JSON.parse(decodedMessage);
      } catch {
        console.warn(`[HederaIndexer] Invalid JSON in message ${msg.sequence_number}, skipping`);
        return;
      }

      // Check message type
      if (rawMessage.type && rawMessage.type !== "COMPLAINT_SUBMISSION") {
        console.log(`[HederaIndexer] Skipping non-complaint message type: ${rawMessage.type}`);
        return;
      }

      // Map actual field names to expected format
      const complaint: ComplaintMessage = {
        type: rawMessage.type,
        anon_id: rawMessage.anon_id,
        tracking_hash: rawMessage.tracking_hash,
        title: rawMessage.title,
        text: rawMessage.text,
        category: rawMessage.category,
        area: rawMessage.area,
        incident_date: rawMessage.incident_date,
        evidence: rawMessage.evidence,
        timestamp: rawMessage.timestamp,
      };

      // Validate required fields
      if (!complaint.title || !complaint.text || !complaint.category || !complaint.anon_id) {
        console.warn(`[HederaIndexer] Missing required fields in message ${msg.sequence_number}:`);
        console.warn(`  title: ${!!complaint.title}, text: ${!!complaint.text}, category: ${!!complaint.category}, anon_id: ${!!complaint.anon_id}`);
        return;
      }

      // Convert consensus timestamp to Date
      const [seconds, nanos] = msg.consensus_timestamp.split(".");
      const consensusDate = new Date(parseInt(seconds) * 1000 + parseInt(nanos) / 1000000);

      // Check if already indexed (by hash)
      const existing = await prisma.indexedComplaint.findUnique({
        where: { hcs_hash: msg.running_hash },
      });

      if (existing) {
        console.log(`[HederaIndexer] Message ${msg.sequence_number} already indexed, skipping`);
        return;
      }

      // Index the complaint
      await prisma.indexedComplaint.create({
        data: {
          hcs_hash: msg.running_hash,
          anonymous_identifier: complaint.anon_id,
          tracking_hash: complaint.tracking_hash || null,
          title: complaint.title,
          complaint_text: complaint.text,
          category: complaint.category,
          area: complaint.area || "Unknown",
          severity: "medium", // Default severity
          incident_date: complaint.incident_date ? new Date(complaint.incident_date) : consensusDate,
          evidence_cids: complaint.evidence || [],
          status: "submitted",
          consensus_timestamp: consensusDate,
        },
      });

      console.log(`[HederaIndexer] ✓ Indexed complaint: "${complaint.title}"`);
    } catch (error: any) {
      console.error(`[HederaIndexer] Failed to process message ${msg.sequence_number}:`, error.message);
    }
  }

  /**
   * Get indexer status
   */
  getStatus(): { isRunning: boolean; lastTimestamp: string | null; topicId: string } {
    return {
      isRunning: this.isRunning,
      lastTimestamp: this.lastTimestamp,
      topicId: TOPIC_ID,
    };
  }

  /**
   * Manually trigger a reindex from a specific timestamp
   */
  async reindexFrom(timestamp: string): Promise<void> {
    console.log(`[HederaIndexer] Reindexing from timestamp ${timestamp}`);
    this.lastTimestamp = timestamp;
    await this.poll();
  }
}

// Singleton instance
let indexerInstance: HederaIndexerService | null = null;

export function getIndexer(): HederaIndexerService {
  if (!indexerInstance) {
    indexerInstance = new HederaIndexerService();
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
