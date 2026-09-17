/**
 * Centralized auth guard for API routes.
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
    const session = await auth();
    if (!session?.user?.id) {
        return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { session, error: null };
}

export async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    const user = session.user as any;
    if (!user.isAdmin && !user.isTenantAdmin) {
        return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { session, error: null };
}
