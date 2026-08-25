import { Resend } from 'resend';

export async function sendInvitationEmail(email: string, token: string, name: string, logoUrl?: string | null, appName?: string, customAppUrl?: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY is not set. Email will not be sent.');
        return { success: false, error: 'Email service configuration missing' };
    }

    const resend = new Resend(apiKey);

    // [PRODUCTION READY] Determine App URL dynamically from the system
    // Using simple detection here, or pass it from headers() in the future calls.
    const appUrl = customAppUrl || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://cloud-hms.onrender.com');

    const inviteUrl = `${appUrl}/auth/accept-invite?token=${token}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const displayAppName = appName || process.env.NEXT_PUBLIC_APP_BRAND || 'Hospital Management System';

    try {
        const { data, error } = await resend.emails.send({
            from: `${displayAppName} <${fromEmail}>`,
            to: email,
            subject: `Invitation to join ${displayAppName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 48px 40px; text-align: center;">
                        ${logoUrl ? `
                        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 12px; border-radius: 16px; margin-bottom: 24px;">
                            <img src="${logoUrl}" alt="Logo" style="width: 48px; height: 48px;" />
                        </div>` : ''}
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em;">Welcome to ${displayAppName}</h1>
                    </div>
                    
                    <div style="padding: 48px 40px;">
                        <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">Hello ${name},</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">You've been invited to join <strong>${displayAppName}</strong>. Get started by setting up your secure account using the button below.</p>
                        
                        <div style="text-align: center; margin-bottom: 40px;">
                            <a href="${inviteUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">Accept Invitation</a>
                        </div>
                        
                        <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #f1f5f9;">
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;"><strong>Need help?</strong> If the button doesn't work, copy and paste this link into your browser: <br/> <a href="${inviteUrl}" style="color: #4f46e5; text-decoration: none; word-break: break-all;">${inviteUrl}</a></p>
                        </div>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="color: #94a3b8; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} ${displayAppName}. All rights reserved. <br/> Secure Cloud Infrastructure</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: 'Failed to send invitation email' };
        }

        return { success: true };
    } catch (err) {
        console.error('Email caught error:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

export async function sendPasswordResetEmail(
    email: string,
    token: string,
    name: string,
    logoUrl?: string | null,
    appName?: string,
    customAppUrl?: string
) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY is not set. Email will not be sent.');
        return { success: false, error: 'Email service configuration missing' };
    }

    const resend = new Resend(apiKey);
    const appUrl = customAppUrl || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://cloud-hms.onrender.com');
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const displayAppName = appName || process.env.NEXT_PUBLIC_APP_BRAND || 'Hospital Management System';

    try {
        const { data, error } = await resend.emails.send({
            from: `${displayAppName} <${fromEmail}>`,
            to: email,
            subject: `Password Reset Request - ${displayAppName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                    <div style="background-color: #0284c7; background: linear-gradient(135deg, #0284c7 0%, #3b82f6 50%, #4f46e5 100%); padding: 36px 30px; text-align: center;">
                        ${logoUrl ? `
                        <div style="display: inline-block; background-color: #ffffff; padding: 10px; border-radius: 14px; margin-bottom: 16px;">
                            <img src="${logoUrl}" alt="Logo" style="width: 44px; height: 44px; object-fit: contain; display: block;" />
                        </div>` : ''}
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Password Reset Request</h1>
                    </div>
                    
                    <div style="padding: 36px 30px; background-color: #ffffff;">
                        <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">We received a request to reset your password for your <strong>${displayAppName}</strong> account. Click the button below to choose a new password:</p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #0284c7; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); color: #ffffff !important; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; border: 1px solid #0284c7;">Reset My Password</a>
                        </div>
                        
                        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">This link will expire in <strong>1 hour</strong>. If you did not request this change, you can safely ignore this email.</p>
                        
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;"><strong>Can't click the button?</strong> Copy and paste this URL into your browser:<br/> <a href="${resetUrl}" style="color: #0284c7; text-decoration: underline; word-break: break-all;">${resetUrl}</a></p>
                        </div>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} ${displayAppName}. Enterprise Security.</p>
                    </div>
                </div>
            `
        });


        if (error) {
            console.error('Resend error in password reset:', error);
            return { success: false, error: 'Failed to send password reset email' };
        }

        return { success: true };
    } catch (err) {
        console.error('Password reset email caught error:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

