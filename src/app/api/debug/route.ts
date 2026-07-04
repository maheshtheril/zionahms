import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const count = await prisma.menu_items.count();
    const modules = await prisma.menu_items.findMany({ select: { module_key: true, label: true, parent_id: true }});
    return NextResponse.json({ count, modules });
}
