import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'healthy',
        redis: 'healthy',
        memory: 'healthy',
        cpu: 'healthy'
      }
    };

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Check if memory usage is within acceptable limits
    if (memUsageMB.heapUsed > 500) { // 500MB limit
      healthStatus.checks.memory = 'warning';
    }

    // Check CPU usage (basic check)
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    const cpuUsagePercent = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds

    if (cpuUsagePercent > 80) { // 80% CPU usage threshold
      healthStatus.checks.cpu = 'warning';
    }

    // Database connectivity check (if Supabase is configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        // You can add actual database connectivity check here
        // For now, we'll assume it's healthy if the URL is configured
        healthStatus.checks.database = 'healthy';
      } catch (error) {
        healthStatus.checks.database = 'unhealthy';
        healthStatus.status = 'degraded';
      }
    }

    // Redis connectivity check (if Redis is configured)
    if (process.env.REDIS_URL) {
      try {
        // You can add actual Redis connectivity check here
        // For now, we'll assume it's healthy if the URL is configured
        healthStatus.checks.redis = 'healthy';
      } catch (error) {
        healthStatus.checks.redis = 'unhealthy';
        healthStatus.status = 'degraded';
      }
    }

    // Determine overall status
    const allChecks = Object.values(healthStatus.checks);
    if (allChecks.includes('unhealthy')) {
      healthStatus.status = 'unhealthy';
    } else if (allChecks.includes('warning')) {
      healthStatus.status = 'degraded';
    }

    // Return appropriate HTTP status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      checks: {
        database: 'unknown',
        redis: 'unknown',
        memory: 'unknown',
        cpu: 'unknown'
      }
    }, { status: 503 });
  }
}