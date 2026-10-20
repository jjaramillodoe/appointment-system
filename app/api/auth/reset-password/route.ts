import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(request, RATE_LIMITS.resetPassword);
    if (limited) return limited;

    await dbConnect();
    const { token, password } = await request.json();
    if (!token || !password || String(password).length < 8) {
      return NextResponse.json({ error: 'A valid token and a password of at least 8 characters are required' }, { status: 400 });
    }

    const reset = await PasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    const user = await User.findById(reset.userId);
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    user.password = password;
    await user.save();
    await PasswordResetToken.deleteMany({ userId: user._id });

    return NextResponse.json({ message: 'Password updated. You can sign in now.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    return NextResponse.json({ error: 'Unable to reset password' }, { status: 500 });
  }
}
