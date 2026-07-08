"use client";

import { useState, useEffect } from "react";
import { Printer, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getPDFSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface PrintFormatSelectorProps {
    usage: string;
    documentId: string;
    buttonLabel?: string;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    children?: React.ReactNode;
}

export function PrintFormatSelector({
    usage,
    documentId,
    buttonLabel = "Print Options",
    className = "",
    variant = "outline",
    size = "sm",
    children
}: PrintFormatSelectorProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && templates.length === 0 && !loading) {
            setLoading(true);
            getPDFSettings()
                .then(res => {
                    if (res.success && res.settings?.templates) {
                        const usageTemplates = res.settings.templates.filter((t: any) => t.usage === usage);
                        setTemplates(usageTemplates);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch templates", err);
                    toast({ title: "Error", description: "Failed to load print formats", variant: "destructive" });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, templates.length, loading, usage]);

    const handlePrint = (templateId: string) => {
        const typeMap: Record<string, string> = {
            'sale_bill': 'sale_bill',
            'op_slip': 'appointment',
            'lab_report': 'lab_report',
            'payment_voucher': 'payment_voucher'
        };
        const printType = typeMap[usage] || usage;
        window.open(`/api/print/${printType}/${documentId}?templateId=${templateId}&autoPrint=true`, '_blank');
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                {children ? children : (
                    <Button variant={variant} size={size} className={className}>
                        <Printer className="h-4 w-4 mr-2" />
                        {buttonLabel}
                        <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {loading ? (
                    <div className="p-4 text-center text-xs text-slate-500">Loading formats...</div>
                ) : templates.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No custom formats available.</div>
                ) : (
                    templates.map((template) => {
                        const typeMap: Record<string, string> = {
                            'sale_bill': 'sale_bill',
                            'op_slip': 'appointment',
                            'lab_report': 'lab_report',
                            'payment_voucher': 'payment_voucher'
                        };
                        const printType = typeMap[usage] || usage;
                        
                        return (
                            <DropdownMenuItem
                                key={template.id}
                                asChild
                            >
                                <a 
                                    href={`/api/print/${printType}/${documentId}?templateId=${template.id}&autoPrint=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800 w-full"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-semibold text-sm">{template.name}</span>
                                        {template.is_default && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                </a>
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
