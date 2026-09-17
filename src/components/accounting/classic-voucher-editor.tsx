'use client';

import { TallyPaymentForm } from './tally-voucher-form';

export interface ClassicVoucherEditorProps {
    type: 'payment' | 'receipt';
    initialData?: any;
    onSave: (data: any) => Promise<any>;
    onCancel: () => void;
    suppliersSearch?: (query: string) => Promise<any[]>;
    patientsSearch?: (query: string) => Promise<any[]>;
    accountsSearch?: (query: string) => Promise<any[]>;
    journalsSearch?: (query: string) => Promise<any[]>;
    getBills?: (partnerId: string, includeIds?: string[]) => Promise<any>;
    currency?: string;
}

export function ClassicVoucherEditor(props: ClassicVoucherEditorProps) {
    return <TallyPaymentForm {...props} />;
}
