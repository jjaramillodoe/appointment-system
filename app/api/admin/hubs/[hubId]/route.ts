import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Hub from '@/models/Hub';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  const { hubId } = await params;
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { publicTransitDirections } = body;

    // Update hub
    const updatedHub = await Hub.findByIdAndUpdate(
      hubId,
      { publicTransitDirections },
      { new: true, runValidators: true }
    );

    if (!updatedHub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hub updated successfully',
      hub: updatedHub
    });

  } catch (error: any) {
    console.error('Update hub error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  const { hubId } = await params;
  try {
    await dbConnect();

    const hub = await Hub.findById(hubId);

    if (!hub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hub });

  } catch (error: any) {
    console.error('Get hub error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
