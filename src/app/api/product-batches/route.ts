import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId || productId === 'null' || productId === 'undefined' || productId.trim() === '') {
    return NextResponse.json([])
  }

  const session = await import('@/auth').then(m => m.auth())
  if (!session?.user?.tenantId || !session.user.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const batches = await prisma.hms_product_batch.findMany({
    where: {
      tenant_id: session.user.tenantId,
      company_id: session.user.companyId,
      product_id: productId,
      qty_on_hand: { gt: 0 },
    },
    select: {
      id: true,
      batch_no: true,
      expiry_date: true,
      qty_on_hand: true,
    },
    orderBy: { expiry_date: 'asc' },
  })

  return NextResponse.json(batches)
}
