"use client";

/**
 * WORLD-CLASS PRINT FORMAT SELECTOR
 * Like Zoho Books "Select Format" at print time:
 * - Shows all available templates for this document type
 * - Visual mini-preview thumbnails
 * - Default template highlighted
 * - One-click print or preview
 * - Works for: sale_bill, pos_bill, purchase_receipt, op_slip, lab_report, etc.
 */

import { useState, useEffect } from "react";
import { Printer, ChevronDown, Star, Eye, X, Loader2, Check, FileText } from "lucide-react";
import { getPDFSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrintFormatSelectorProps {
    usage: string;
    documentId: string;
    buttonLabel?: string;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    children?: React.ReactNode;
    showLabel?: boolean;
}

// Map usage → print API type
const TYPE_MAP: Record<string, string> = {
    'sale_bill': 'sale_bill',
    'op_slip': 'appointment',
    'lab_report': 'lab_report',
    'payment_voucher': 'payment_voucher',
    'prescription': 'prescription',
    'pos_bill': 'pos_bill',
    'purchase_receipt': 'purchase_receipt',
    'shift_close': 'shift_close',
    'sales_return': 'sale_bill',
    'purchase_return': 'purchase_receipt',
    'doctor_note': 'sale_bill',
};

// Template color preview dot from stored brand config
function TemplateDot({ config }: { config: any }) {
    const color = config?.brand?.primaryColor || '#4f46e5';
    return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

export function PrintFormatSelector({
    usage,
    documentId,
    buttonLabel = "Print",
    className = "",
    variant = "outline",
    size = "sm",
    children,
    showLabel = true
}: PrintFormatSelectorProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [defaultTemplate, setDefaultTemplate] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const printType = TYPE_MAP[usage] || usage;

    const loadTemplates = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await getPDFSettings();
            if (res.success && res.settings?.templates) {
                const usageTemplates = res.settings.templates.filter((t: any) =>
                    t.usage === usage || t.usage === usage.replace('_', '-')
                );
                setTemplates(usageTemplates);
                setDefaultTemplate(usageTemplates.find((t: any) => t.is_default) || usageTemplates[0] || null);
            }
        } catch (err) {
            console.error("Failed to fetch templates", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [usage]);

    const handlePrint = (templateId?: string, preview = false) => {
        const query = new URLSearchParams();
        if (templateId) query.set('templateId', templateId);
        if (!preview) query.set('autoPrint', 'true');
        const url = `/api/print/${printType}/${documentId}?${query.toString()}`;
        window.open(url, '_blank');
        setIsOpen(false);
    };

    const handleQuickPrint = () => {
        if (defaultTemplate) {
            handlePrint(defaultTemplate.id);
        } else {
            handlePrint(undefined);
        }
    };

    // If only 1 template (or none), show a simple quick-print button
    if (templates.length <= 1 && !isOpen) {
        return (
            <button
                onClick={handleQuickPrint}
                disabled={loading}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 ${className}`}
                title={`Print with ${defaultTemplate?.name || 'default format'}`}
            >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                {showLabel && buttonLabel}
            </button>
        );
    }

    return (
        <div className="relative">
            {/* Trigger */}
            <div className="flex items-stretch">
                {/* Quick print with default */}
                <button
                    onClick={handleQuickPrint}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 ${className}`}
                    title={`Quick print: ${defaultTemplate?.name || 'default format'}`}
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                    {showLabel && buttonLabel}
                </button>
                {/* Dropdown toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`inline-flex items-center px-2 py-2 rounded-r-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${className}`}
                    title="Select print format"
                >
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[300]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-[400] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-900/20 min-w-[280px] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Print Format</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''} available</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <X className="w-3 h-3 text-slate-500" />
                            </button>
                        </div>

                        {/* Template List */}
                        <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                            {loading ? (
                                <div className="py-8 text-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                                    <p className="text-xs text-slate-400 mt-2">Loading formats...</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="py-8 text-center">
                                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400">No custom formats</p>
                                    <p className="text-[10px] text-slate-300 mt-1">Using system default</p>
                                </div>
                            ) : (
                                templates.map((template) => {
                                    const cfg = template.config as any || {};
                                    const brand = cfg.brand || {};
                                    const paper = cfg.pageSizeSettings?.format?.toUpperCase() || 'A4';
                                    const roles = (template.metadata as any)?.defaultForRoles || [];

                                    return (
                                        <div key={template.id} className={`group rounded-xl border-2 transition-all overflow-hidden ${template.is_default ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <div className="flex items-center gap-3 px-3 py-2.5">
                                                {/* Color dot */}
                                                <TemplateDot config={cfg} />
                                                
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{template.name}</span>
                                                        {template.is_default && (
                                                            <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full shrink-0">
                                                                <Star className="w-2 h-2" /> Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 font-medium">{paper}</span>
                                                        {roles.length > 0 && <span className="text-[10px] text-slate-300">· {roles.slice(0, 2).join(', ')}{roles.length > 2 ? '...' : ''}</span>}
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handlePrint(template.id, true)}
                                                        title="Preview"
                                                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors text-slate-500"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrint(template.id)}
                                                        title="Print"
                                                        className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 transition-colors text-white"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                            <a
                                href="/hms/settings/print"
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                <Settings2Icon className="w-3 h-3" />
                                Manage Templates
                            </a>
                            <button
                                onClick={() => handlePrint(undefined, true)}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            >
                                <Eye className="w-3 h-3" /> Preview Default
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Inline SVG icon to avoid import issues
function Settings2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
        </svg>
    );
}
