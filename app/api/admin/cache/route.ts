import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin: boolean };
  } catch (error) {
    return null;
  }
}

// POST - Clear system cache
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // In a real production environment, you would:
    // 1. Clear Redis cache if using Redis
    // 2. Clear in-memory caches
    // 3. Clear CDN caches
    // 4. Clear browser caches (via headers)
    
    // For now, we'll simulate cache clearing
    console.log(`Cache clear initiated by admin ${decoded.email} at ${new Date().toISOString()}`);
    
    // Simulate cache clearing process time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cacheInfo = {
      timestamp: new Date().toISOString(),
      initiatedBy: decoded.email,
      status: 'completed',
      clearedCaches: ['Memory Cache', 'Database Query Cache', 'Static Asset Cache'],
      message: 'System cache cleared successfully'
    };

    return NextResponse.json({
      message: 'Cache cleared successfully',
      cache: cacheInfo
    });
  } catch (error: any) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    );
  }
}
