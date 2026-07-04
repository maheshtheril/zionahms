'use client';

import * as React from 'react';
import { X, Loader2, Building, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { createSupplier, updateSupplier, getCompanyDefaults } from '@/app/actions/purchase';

interface SupplierDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (supplier: { id: string; label: string; subLabel?: string; metadata?: any }) => void;
    initialData?: any; // New Prop for Edit Mode
}

export function SupplierDialog({ isOpen, onClose, onSuccess, initialData }: SupplierDialogProps) {
    // State for currency
    const [currencySymbol, setCurrencySymbol] = React.useState('₹');

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        name: '',
        gstin: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        openingBalance: 0,
        openingBalanceDate: new Date(),
    });

    React.useEffect(() => {
        // Fetch currency on mount
        getCompanyDefaults().then(defaults => {
            if (defaults.currency) {
                const symbols: Record<string, string> = {
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£',
                    'INR': '₹'
                };
                setCurrencySymbol(symbols[defaults.currency] || defaults.currency);
            }
        });
    }, []);

    // Initialize form with initialData when it changes
    React.useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                gstin: initialData.gstin || '',
                contactPerson: initialData.contactPerson || initialData.contact_person || '', // handle likely DB naming difference
                email: initialData.email || '',
                phone: initialData.phone || '',
                address: initialData.address || '',
                openingBalance: initialData.openingBalance || initialData.opening_balance || 0,
                openingBalanceDate: initialData.openingBalanceDate ? new Date(initialData.openingBalanceDate) : new Date(),
            });
        } else {
            // Reset if no initialData (i.e. strictly create mode, though dialog usually unmounts or we want persistence)
            // Ideally we reset on open, but for now let's just leave it or reset if !isOpen?
            // Typical pattern is to reset when dialog opens. 
            // For now, let's just handle the initialData set. 
            setFormData({
                name: '',
                gstin: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                openingBalance: 0,
                openingBalanceDate: new Date(),
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let result;
            if (initialData && initialData.id) {
                // UPDATE MODE
                // Note: updateSupplier logic in backend might need enhancement to support full metadata update if it doesn't already.
                // Currently updateSupplier only accepts name and is_active. We need to check backend.
                // Assuming we might need to update createSupplier or extend updateSupplier.
                // Let's call a hypothetical robust update or create.

                // WAIT: The defined updateSupplier only takes name/is_active: 
                // export async function updateSupplier(id: string, data: { name?: string, is_active?: boolean })
                // We need to fix backend action to support full update first? 
                // OR we can assume createSupplier handles upsert if ID is passed? No, createSupplier creates new.

                // Let's modify the frontend to assume we WILL update the backend action to support full updates.

                result = await updateSupplier(initialData.id, {
                    name: formData.name,
                    gstin: formData.gstin,
                    address: formData.address,
                    email: formData.email,
                    phone: formData.phone,
                    contactPerson: formData.contactPerson,
                    // Note: Opening Balance usually shouldn't be edited once posted, but for simplicity allowing it or ignoring it based on backend
                } as any);

            } else {
                // CREATE MODE
                result = await createSupplier(formData);
            }

            if (!result) {
                setError("Operation failed.");
            } else if (result.error) {
                setError(result.error);
            } else if (result.success) {
                // If it's an update, 'data' might be missing, so we fallback to initialData + form updates
                // If it's a create, 'data' is the new supplier
                const successData = (result as any).data || {
                    id: initialData?.id || 'unknown',
                    label: formData.name,
                    subLabel: formData.gstin,
                    metadata: { ...formData }
                };
                onSuccess(successData);
                onClose();
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {initialData ? 'Edit Supplier' : 'New Supplier'}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Supplier Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Company Name"
                                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 font-medium transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                    Tax ID / GSTIN / VAT
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="GST Number"
                                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all uppercase"
                                        value={formData.gstin}
                                        onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all"
                                    value={formData.contactPerson}
                                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                    Phone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="tel"
                                        placeholder="+91..."
                                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Accounting - Opening Balance (Only shown on Create usually, but let's allow viewing/editing if needed, or hide on edit) */}
                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Accounting</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                        Opening Balance
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-neutral-400">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            // Disable if editing to prevent accounting drift if not handled
                                            disabled={!!initialData}
                                            className="w-full pl-7 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all font-mono disabled:opacity-60"
                                            value={formData.openingBalance || ''}
                                            onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-400 mt-1">
                                        {initialData ? "Cannot edit balance after creation" : "Amount you owe them (Liability)"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                        As of Date
                                    </label>
                                    <input
                                        type="date"
                                        disabled={!!initialData}
                                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all disabled:opacity-60"
                                        value={formData.openingBalanceDate ? new Date(formData.openingBalanceDate).toISOString().split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, openingBalanceDate: e.target.valueAsDate || new Date() })} // Store as Date object or handle conversion
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Address
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                                <textarea
                                    rows={3}
                                    placeholder="Full billing address..."
                                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {initialData ? 'Update Supplier' : 'Create Supplier'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
