/**
 * Simple Metrics for Prometheus/Grafana
 * 
 * Exposes a /metrics endpoint for Prometheus to scrape.
 * No external dependencies required - uses simple counters.
 */

// In-memory metrics storage
const metrics = {
  http_requests_total: new Map<string, number>(),
  http_request_duration_seconds: [] as { route: string; method: string; duration: number; timestamp: number }[],
  complaints_submitted_total: { anonymous: 0, identified: 0 },
  active_users: 0,
  errors_total: 0,
  uptime_seconds: 0,
};

const startTime = Date.now();

// Keep only last 1000 request durations for memory efficiency
const MAX_DURATION_SAMPLES = 1000;

/**
 * Record an HTTP request
 */
export function recordRequest(method: string, route: string, statusCode: number, durationMs: number) {
  const key = `${method}_${route}_${statusCode}`;
  metrics.http_requests_total.set(key, (metrics.http_requests_total.get(key) || 0) + 1);
  
  // Record duration
  metrics.http_request_duration_seconds.push({
    route,
    method,
    duration: durationMs / 1000,
    timestamp: Date.now(),
  });
  
  // Trim old samples
  if (metrics.http_request_duration_seconds.length > MAX_DURATION_SAMPLES) {
    metrics.http_request_duration_seconds = metrics.http_request_duration_seconds.slice(-MAX_DURATION_SAMPLES);
  }
  
  // Track errors
  if (statusCode >= 400) {
    metrics.errors_total++;
  }
}

/**
 * Record a complaint submission
 */
export function recordComplaint(type: "anonymous" | "identified") {
  metrics.complaints_submitted_total[type]++;
}

/**
 * Generate Prometheus-format metrics
 */
export function getPrometheusMetrics(): string {
  const lines: string[] = [];
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  // Uptime
  lines.push("# HELP sawtak_uptime_seconds Time since server started");
  lines.push("# TYPE sawtak_uptime_seconds counter");
  lines.push(`sawtak_uptime_seconds ${uptimeSeconds}`);
  lines.push("");
  
  // HTTP requests total
  lines.push("# HELP sawtak_http_requests_total Total HTTP requests");
  lines.push("# TYPE sawtak_http_requests_total counter");
  metrics.http_requests_total.forEach((count, key) => {
    const [method, ...rest] = key.split("_");
    const statusCode = rest.pop();
    const route = rest.join("_") || "/";
    lines.push(`sawtak_http_requests_total{method="${method}",route="${route}",status="${statusCode}"} ${count}`);
  });
  lines.push("");
  
  // Request duration histogram (simplified - just averages)
  const recentRequests = metrics.http_request_duration_seconds.filter(
    r => Date.now() - r.timestamp < 60000 // Last minute
  );
  if (recentRequests.length > 0) {
    const avgDuration = recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length;
    lines.push("# HELP sawtak_http_request_duration_seconds_avg Average request duration (last minute)");
    lines.push("# TYPE sawtak_http_request_duration_seconds_avg gauge");
    lines.push(`sawtak_http_request_duration_seconds_avg ${avgDuration.toFixed(4)}`);
    lines.push("");
  }
  
  // Complaints submitted
  lines.push("# HELP sawtak_complaints_total Total complaints submitted");
  lines.push("# TYPE sawtak_complaints_total counter");
  lines.push(`sawtak_complaints_total{type="anonymous"} ${metrics.complaints_submitted_total.anonymous}`);
  lines.push(`sawtak_complaints_total{type="identified"} ${metrics.complaints_submitted_total.identified}`);
  lines.push("");
  
  // Errors
  lines.push("# HELP sawtak_errors_total Total errors (4xx and 5xx responses)");
  lines.push("# TYPE sawtak_errors_total counter");
  lines.push(`sawtak_errors_total ${metrics.errors_total}`);
  lines.push("");
  
  // Node.js memory usage
  const memUsage = process.memoryUsage();
  lines.push("# HELP sawtak_memory_bytes Memory usage in bytes");
  lines.push("# TYPE sawtak_memory_bytes gauge");
  lines.push(`sawtak_memory_bytes{type="heapUsed"} ${memUsage.heapUsed}`);
  lines.push(`sawtak_memory_bytes{type="heapTotal"} ${memUsage.heapTotal}`);
  lines.push(`sawtak_memory_bytes{type="rss"} ${memUsage.rss}`);
  lines.push("");
  
  return lines.join("\n");
}

/**
 * Initialize telemetry - no-op for this simple implementation
 */
export async function initTelemetry(): Promise<void> {
  console.log("[Metrics] Simple metrics enabled at /metrics endpoint");
}
