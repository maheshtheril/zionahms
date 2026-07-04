import { AccountLedger } from "@/components/accounting/account-ledger";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "General Ledger | Accounting",
    description: "Detailed transaction history and account audit trail"
};

export default async function LedgerPage(props: { params: Promise<any> }) {
    const params = await props.params;
    const { id } = await params;

    return (
        <div className="flex-1">
            <AccountLedger initialAccountId={id} />
        </div>
    );
}
