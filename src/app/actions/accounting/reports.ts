'use server'

import { auth } from "@/auth"
import { AccountingService } from "@/lib/services/accounting"
import { serialize } from "@/lib/utils"

export async function getDailyAccountingSummary(date?: Date) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getDailyReport(session.user.companyId, date || new Date())
    return serialize(res)
}

export async function getProfitAndLossStatement(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getProfitAndLoss(session.user.companyId, startDate, endDate)
    return serialize(res)
}

export async function getBalanceSheetStatement(date?: Date) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getBalanceSheet(session.user.companyId, date || new Date())
    return serialize(res)
}

export async function getFinancialTrends() {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getFinancialTrends(session.user.companyId)
    return serialize(res)
}

export async function getExecutiveInsights() {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getExecutiveInsights(session.user.companyId)
    return serialize(res)
}

export async function getDaybook(startDate: Date, endDate?: Date) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getDaybook(session.user.companyId, startDate, endDate || startDate)
    return serialize(res)
}

export async function getCashBankBook(type: 'cash' | 'bank', startDate: Date, endDate?: Date, accountIds?: string[]) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getCashBankBook(session.user.companyId, type, startDate, endDate, accountIds)
    return serialize(res)
}

export async function getCategoryAccounts(type: 'cash' | 'bank') {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getCategoryAccounts(session.user.companyId, type)
    return serialize(res)
}

export async function getTrialBalance(date?: Date) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getTrialBalance(session.user.companyId, date)
    return serialize(res)
}

export async function getAgeingReport(type: 'receivables' | 'payables') {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getAgeingReport(session.user.companyId, type)
    return serialize(res)
}

export async function getAccountLedger(accountId: string, startDate?: Date, endDate?: Date) {
    const session = await auth()
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" }

    const res = await AccountingService.getLedger(session.user.companyId, accountId, startDate, endDate)
    return serialize(res)
}
