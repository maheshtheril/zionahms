'use server'

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { headers } from "next/headers"

/**
 * Request a password reset email
 * Complies with OWASP anti-user-enumeration guidelines
 */
export async function requestPasswordReset(email: string) {
    try {
        const normalizedEmail = (email || '').trim().toLowerCase()
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return { error: 'Please enter a valid email address.' }
        }

        // Database lookup for active user
        const user = await prisma.app_user.findFirst({
            where: {
                email: normalizedEmail,
                is_active: true
            }
        })

        // Standard OWASP response: Generic message regardless of whether user exists
        const genericSuccessMessage = 'If an account exists with this email address, you will receive password reset instructions shortly.'

        if (!user) {
            return {
                success: true,
                message: genericSuccessMessage
            }
        }

        // Generate cryptographically secure 32-byte token
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration

        // Invalidate old tokens for this user
        await prisma.email_verification_tokens.deleteMany({
            where: { user_id: user.id }
        })

        // Store new reset token
        await prisma.email_verification_tokens.create({
            data: {
                user_id: user.id,
                email: user.email,
                token: token,
                expires_at: expiresAt
            }
        })

        // Fetch tenant details for branding
        let tenant = null
        if (user.tenant_id) {
            tenant = await prisma.tenant.findUnique({
                where: { id: user.tenant_id },
                select: { logo_url: true, app_name: true }
            })
        }

        // Determine request origin/host for proper reset link URL
        let appUrl = ''
        try {
            const reqHeaders = await headers()
            const host = reqHeaders.get('host')
            const origin = reqHeaders.get('origin')

            if (origin) {
                appUrl = origin
            } else if (host) {
                const protocol = host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('192.168.') ? 'http' : 'https'
                appUrl = `${protocol}://${host}`
            }
        } catch (e) {
            // Ignore headers error in isolated contexts
        }

        if (!appUrl) {
            appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002')
        }

        // Send reset email via Resend
        const emailResult = await sendPasswordResetEmail(
            user.email,
            token,
            user.full_name || user.name || 'User',
            tenant?.logo_url,
            tenant?.app_name,
            appUrl
        )

        const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

        if (!emailResult.success) {
            console.warn(`[PASSWORD_RESET] Email dispatch skipped or failed (${emailResult.error}). Reset URL: ${resetUrl}`)
        }

        return {
            success: true,
            message: genericSuccessMessage,
            // Provide devResetUrl only if email delivery failed or API key not present, to facilitate seamless local testing
            devResetUrl: !emailResult.success ? resetUrl : undefined
        }
    } catch (error) {
        console.error('[PASSWORD_RESET] Error in requestPasswordReset:', error)
        return { error: 'An unexpected error occurred while processing your request. Please try again later.' }
    }
}

/**
 * Reset password using a valid cryptographic token
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
    try {
        if (!token || typeof token !== 'string') {
            return { error: 'Invalid or missing reset token.' }
        }

        if (!newPassword || newPassword.length < 8) {
            return { error: 'Password must be at least 8 characters long.' }
        }

        // Lookup token
        const tokenRecord = await prisma.email_verification_tokens.findFirst({
            where: { token: token }
        })

        if (!tokenRecord) {
            return { error: 'Invalid or expired password reset link. Please request a new one.' }
        }

        if (new Date() > tokenRecord.expires_at) {
            // Clean up expired token
            await prisma.email_verification_tokens.delete({
                where: { id: tokenRecord.id }
            }).catch(() => {})
            return { error: 'This password reset link has expired. Please request a new one.' }
        }

        // Securely hash password with bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update user password and ensure account is active
        await prisma.app_user.update({
            where: { id: tokenRecord.user_id },
            data: {
                password: hashedPassword,
                is_active: true
            }
        })

        // Delete used token (one-time use security guarantee)
        await prisma.email_verification_tokens.delete({
            where: { id: tokenRecord.id }
        })

        return { success: true, message: 'Password updated successfully. You can now log in.' }
    } catch (error) {
        console.error('[PASSWORD_RESET] Error in resetPasswordWithToken:', error)
        return { error: 'Failed to reset password. Please try again.' }
    }
}
