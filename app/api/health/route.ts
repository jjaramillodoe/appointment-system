import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await dbConnect();
    
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Basic health check response
    const healthData = {
      status: 'healthy',
      timestamp,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected',
        application: 'running'
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error: any) {
    // If database connection fails, return unhealthy status
    const healthData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'disconnected',
        application: 'running'
      },
      error: error.message
    };

    return NextResponse.json(healthData, { status: 503 });
  }
} 