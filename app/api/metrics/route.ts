import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory metrics store (in production, use Redis or database)
let metrics = {
  http_requests_total: 0,
  http_request_duration_seconds: [],
  http_requests_in_flight: 0,
  memory_usage_bytes: 0,
  cpu_usage_percent: 0
};

export async function GET(request: NextRequest) {
  try {
    // Update metrics
    updateMetrics();

    // Generate Prometheus metrics format
    const prometheusMetrics = generatePrometheusMetrics();

    return new NextResponse(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 });
  }
}

function updateMetrics() {
  // Update memory usage
  const memUsage = process.memoryUsage();
  metrics.memory_usage_bytes = memUsage.heapUsed;

  // Update CPU usage (simplified)
  const cpuUsage = process.cpuUsage();
  metrics.cpu_usage_percent = (cpuUsage.user + cpuUsage.system) / 1000000;
}

function generatePrometheusMetrics(): string {
  const lines: string[] = [];

  // HTTP requests total
  lines.push(`# HELP http_requests_total Total number of HTTP requests`);
  lines.push(`# TYPE http_requests_total counter`);
  lines.push(`http_requests_total{method="GET",status="200"} ${metrics.http_requests_total}`);

  // HTTP request duration
  if (metrics.http_request_duration_seconds.length > 0) {
    const avgDuration = metrics.http_request_duration_seconds.reduce((a, b) => a + b, 0) / metrics.http_request_duration_seconds.length;
    lines.push(`# HELP http_request_duration_seconds_average Average HTTP request duration`);
    lines.push(`# TYPE http_request_duration_seconds_average gauge`);
    lines.push(`http_request_duration_seconds_average ${avgDuration.toFixed(6)}`);
  }

  // HTTP requests in flight
  lines.push(`# HELP http_requests_in_flight Current number of HTTP requests being processed`);
  lines.push(`# TYPE http_requests_in_flight gauge`);
  lines.push(`http_requests_in_flight ${metrics.http_requests_in_flight}`);

  // Memory usage
  lines.push(`# HELP memory_usage_bytes Current memory usage in bytes`);
  lines.push(`# TYPE memory_usage_bytes gauge`);
  lines.push(`memory_usage_bytes ${metrics.memory_usage_bytes}`);

  // CPU usage
  lines.push(`# HELP cpu_usage_percent Current CPU usage percentage`);
  lines.push(`# TYPE cpu_usage_percent gauge`);
  lines.push(`cpu_usage_percent ${metrics.cpu_usage_percent.toFixed(2)}`);

  // Node.js specific metrics
  const uptime = process.uptime();
  lines.push(`# HELP nodejs_uptime_seconds Node.js uptime in seconds`);
  lines.push(`# TYPE nodejs_uptime_seconds gauge`);
  lines.push(`nodejs_uptime_seconds ${uptime}`);

  // Process metrics
  lines.push(`# HELP process_resident_memory_bytes Resident memory size in bytes`);
  lines.push(`# TYPE process_resident_memory_bytes gauge`);
  lines.push(`process_resident_memory_bytes ${process.memoryUsage().rss}`);

  lines.push(`# HELP process_heap_size_bytes Heap size in bytes`);
  lines.push(`# TYPE process_heap_size_bytes gauge`);
  lines.push(`process_heap_size_bytes ${process.memoryUsage().heapTotal}`);

  lines.push(`# HELP process_heap_used_bytes Heap used in bytes`);
  lines.push(`# TYPE process_heap_used_bytes gauge`);
  lines.push(`process_heap_used_bytes ${process.memoryUsage().heapUsed}`);

  return lines.join('\n') + '\n';
}

// Middleware to track metrics
export function trackMetrics(request: NextRequest, response: NextResponse) {
  const startTime = Date.now();
  
  // Increment request counter
  metrics.http_requests_total++;
  metrics.http_requests_in_flight++;

  // Track request duration
  const duration = (Date.now() - startTime) / 1000;
  metrics.http_request_duration_seconds.push(duration);

  // Keep only last 1000 measurements
  if (metrics.http_request_duration_seconds.length > 1000) {
    metrics.http_request_duration_seconds.shift();
  }

  metrics.http_requests_in_flight--;

  return response;
}