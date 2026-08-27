import type { NextAuthConfig } from "next-auth"


const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

export const authConfig = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "SUPER_SECRET_LOCAL_DEV_KEY_123!",
    trustHost: true,
    cookies: {
        sessionToken: {
            name: (process.env.NODE_ENV === 'production' && (process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.AUTH_URL?.startsWith('https://'))) 
                ? '__Secure-authjs.session-token' 
                : 'authjs.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: (process.env.NODE_ENV === 'production' && (process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.AUTH_URL?.startsWith('https://'))),
                domain: undefined,
            },
        },
    },
    pages: {
        signIn: '/login',
    },


    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            // const user = auth?.user as any; 

            // const isOnHMS = nextUrl.pathname.startsWith("/hms");
            // const isOnCRM = nextUrl.pathname.startsWith("/crm");
            const isOnRoot = nextUrl.pathname === "/";
            const isProtected = nextUrl.pathname.startsWith("/hms") || nextUrl.pathname.startsWith("/crm") || nextUrl.pathname.startsWith("/settings") || nextUrl.pathname.startsWith("/print-studio");
            const isAuthPage = nextUrl.pathname.startsWith("/login");

            // 1. If on protected route (HMS, CRM, Settings, Root)
            if (isProtected || isOnRoot) {
                if (isLoggedIn) {
                    // Logic moved to page.tsx to prevent middleware loops
                    return true;
                }
                return false; // Redirect to login
            }

            // 2. If logged in and on login page, send to root (and let page.tsx handle it)
            if (isLoggedIn && isAuthPage) {
                if (nextUrl.searchParams.has("reauth")) return true;
                return Response.redirect(new URL("/", nextUrl));
            }

            return true;
        }
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
