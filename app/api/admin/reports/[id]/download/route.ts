import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import { generateReportFile } from '@/utils/reportGenerator';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';

// GET - Download report file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const decoded = await verifyAdminToken(token);
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const reportId = id;

    // Find the report
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.status !== 'ready') {
      return NextResponse.json(
        { error: 'Report is not ready for download' },
        { status: 400 }
      );
    }

    // Generate the report file
    const { fileBuffer, fileName, contentType } = await generateReportFile(report);

    // Create response with file
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    response.headers.set('Content-Length', fileBuffer.length.toString());

    return response;
  } catch (error: any) {
    logger.error('Download report error:', error);
    return NextResponse.json(
      { error: 'Failed to download report', details: error.message },
      { status: 500 }
    );
  }
} 