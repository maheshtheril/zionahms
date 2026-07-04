'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PaymentVoucherForm } from '@/components/accounting/payment-voucher-form';
import { getPayment } from '@/app/actions/accounting/payments';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPayment() {
            const res = await getPayment(id);
            if (res.success) {
                // Pass the raw db object to PaymentVoucherForm which is designed to handle it
                setInitialData(res.data);
            } else {
                console.error("Failed to load payment:", res.error);
                router.push('/hms/accounting/payments');
            }
            setIsLoading(false);
        }
        loadPayment();
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 font-medium">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
                <p>Retrieving Voucher Data...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <PaymentVoucherForm
                initialData={initialData}
                headerActions={
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9"
                        onClick={() => window.open(`/api/print/payment_voucher/${initialData.id}?autoPrint=true`, '_blank')}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Voucher
                    </Button>
                }
                onClose={() => router.push('/hms/accounting/payments')}
                onSuccess={() => {
                    // Success handling is now built into PaymentVoucherForm
                }}
            />
        </div>
    );
}
