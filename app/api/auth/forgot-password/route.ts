import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { isSmtpConfigured, sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email } = await request.json();
    const limited = await enforceRateLimit(
      request,
      RATE_LIMITS.forgotPassword,
      typeof email === 'string' ? email : undefined
    );
    if (limited) return limited;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    let resetUrl: string | undefined;
    let emailSent = false;

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await PasswordResetToken.deleteMany({ userId: user._id });
      await PasswordResetToken.create({
        userId: user._id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      resetUrl = `${appUrl}/reset-password?token=${token}`;
      emailSent = await sendPasswordResetEmail(
        user.email,
        [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there',
        resetUrl
      );
      if (!emailSent) {
        logger.warn('Password reset email was not sent');
      }
    }

    const payload: { message: string; resetUrl?: string; emailSkipped?: boolean } = {
      message: 'If an account exists for that email, a reset link is on its way.',
    };

    // Local/dev only: SMTP is unset, so students never get the email they just requested.
    if (resetUrl && !emailSent && process.env.NODE_ENV !== 'production' && !isSmtpConfigured()) {
      payload.resetUrl = resetUrl;
      payload.emailSkipped = true;
    }

    return NextResponse.json(payload);
  } catch (error) {
    logger.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Unable to start password reset' }, { status: 500 });
  }
}
