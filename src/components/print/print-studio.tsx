'use client'

/**
 * WORLD-CLASS PRINT STUDIO
 * Like Zoho Books + QuickBooks combined:
 * - Visual template gallery with live mini-previews
 * - One-click preset apply
 * - Brand customizer (color, font, logo position)
 * - Section toggles (show/hide columns, bank details, QR, etc.)
 * - Live PDF preview iframe
 * - Save, name, and set as default
 * - Role assignment per template
 */

import { useState, useEffect, useTransition } from 'react'
import { 
    Check, Palette, FileText, Eye, Save, Plus, Trash2, 
    Star, Settings2, ChevronRight, Printer, Zap, 
    LayoutTemplate, SlidersHorizontal, Users, RefreshCw,
    MonitorPlay, X, ImageIcon, AlignLeft, AlignCenter, AlignRight,
    Type, Grid, ToggleLeft, ToggleRight, Copy, AlertCircle, Loader2
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { 
    setPrintTemplateActive, 
    updatePrintTemplateConfig, 
    createPrintTemplate,
    deletePrintTemplate
} from '@/app/actions/print-settings'
import { 
    BUILT_IN_PRESETS, 
    PAPER_OPTIONS, 
    COLOR_PALETTES, 
    FONT_OPTIONS,
    type PrintTemplatePreset,
    type PrintLayout
} from '@/lib/print/template-presets'
import { useRouter } from 'next/navigation'

const ROLES = ['ADMIN', 'RECEPTION', 'PHARMACIST', 'DOCTOR', 'NURSE', 'LAB', 'CASHIER', 'ACCOUNTANT'] as const;

const SECTION_GROUPS = [
    {
        label: 'Header Information',
        icon: '🏥',
        fields: [
            { key: 'showLogo', label: 'Company Logo' },
            { key: 'showHospitalName', label: 'Hospital / Company Name' },
            { key: 'showAddress', label: 'Address' },
            { key: 'showPhone', label: 'Phone Number' },
            { key: 'showEmail', label: 'Email Address' },
            { key: 'showTaxId', label: 'GSTIN / Tax ID' },
        ]
    },
    {
        label: 'Patient & Doctor',
        icon: '👤',
        fields: [
            { key: 'showPatientId', label: 'Patient ID' },
            { key: 'showDoctorName', label: 'Doctor Name' },
            { key: 'showDueDate', label: 'Due Date' },
        ]
    },
    {
        label: 'Line Item Columns',
        icon: '📋',
        fields: [
            { key: 'showTaxColumn', label: 'Tax Amount (CGST/SGST)' },
            { key: 'showDiscountColumn', label: 'Discount Amount' },
            { key: 'showUOMColumn', label: 'Unit of Measure (UOM)' },
            { key: 'showHSNColumn', label: 'HSN / SAC Code' },
            { key: 'showSerialNumbers', label: 'Serial Numbers' },
        ]
    },
    {
        label: 'Footer Elements',
        icon: '📌',
        fields: [
            { key: 'showBankDetails', label: 'Bank Account Details' },
            { key: 'showQRCode', label: 'UPI Payment QR Code' },
            { key: 'showTerms', label: 'Terms & Conditions' },
            { key: 'showSignature', label: 'Authorized Signatory' },
        ]
    }
];

function TemplatePreviewCard({ preset, isSelected, isDefault, onSelect, onSetDefault }: {
    preset: PrintTemplatePreset;
    isSelected: boolean;
    isDefault: boolean;
    onSelect: () => void;
    onSetDefault: () => void;
}) {
    const colors = preset.previewColors;
    const isNarrow = preset.paper === 'roll80';
    
    return (
        <div 
            onClick={onSelect}
            className={`
                group relative cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden
                ${isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                }
            `}
        >
            {/* Mini Bill Preview — SVG */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-center items-center" style={{ height: 120 }}>
                <svg 
                    viewBox={isNarrow ? "0 0 60 100" : "0 0 100 130"} 
                    width={isNarrow ? 50 : 80} 
                    height={isNarrow ? 84 : 104}
                    className="drop-shadow-md"
                >
                    {/* Paper background */}
                    <rect x="0" y="0" width={isNarrow ? 60 : 100} height={isNarrow ? 100 : 130} rx="1" fill="white" />

                    {/* Header bar */}
                    <rect x="0" y="0" width={isNarrow ? 60 : 100} height={isNarrow ? 22 : 28} rx="0" fill={colors.header} />

                    {/* Logo circle */}
                    {preset.sections.showLogo && preset.brand.logoPosition !== 'hidden' && (
                        <circle 
                            cx={preset.brand.logoPosition === 'right' ? (isNarrow ? 48 : 82) : (isNarrow ? 12 : 14)} 
                            cy={isNarrow ? 11 : 14} 
                            r={isNarrow ? 6 : 8} 
                            fill="white" fillOpacity="0.3" 
                        />
                    )}
                    {/* Company name lines */}
                    <rect x={isNarrow ? 20 : 26} y={isNarrow ? 7 : 10} width={isNarrow ? 30 : 50} height={isNarrow ? 3 : 4} rx="1" fill="white" fillOpacity="0.9" />
                    <rect x={isNarrow ? 20 : 26} y={isNarrow ? 12 : 17} width={isNarrow ? 20 : 35} height={isNarrow ? 2 : 2.5} rx="1" fill="white" fillOpacity="0.5" />

                    {/* Divider */}
                    <line x1="5" y1={isNarrow ? 26 : 32} x2={isNarrow ? 55 : 95} y2={isNarrow ? 26 : 32} stroke={colors.accent} strokeWidth="0.5" strokeDasharray="2,1" />

                    {/* Bill title */}
                    <rect x={isNarrow ? 15 : 30} y={isNarrow ? 29 : 35} width={isNarrow ? 30 : 40} height={isNarrow ? 3 : 4} rx="1" fill={colors.accent} fillOpacity="0.8" />

                    {/* Patient row */}
                    <rect x="5" y={isNarrow ? 35 : 43} width={isNarrow ? 35 : 55} height={isNarrow ? 2 : 3} rx="1" fill={colors.text} fillOpacity="0.7" />
                    <rect x="5" y={isNarrow ? 39 : 48} width={isNarrow ? 25 : 40} height={isNarrow ? 1.5 : 2} rx="1" fill={colors.text} fillOpacity="0.3" />

                    {/* Table header */}
                    <rect x="4" y={isNarrow ? 45 : 55} width={isNarrow ? 52 : 92} height={isNarrow ? 4 : 5} rx="0.5" fill={colors.header} fillOpacity="0.15" />
                    <rect x="5" y={isNarrow ? 46 : 56.5} width={isNarrow ? 25 : 45} height={isNarrow ? 2 : 2.5} rx="1" fill={colors.text} fillOpacity="0.4" />

                    {/* Table rows */}
                    {[0,1,2].map(i => (
                        <g key={i}>
                            <rect x="4" y={isNarrow ? 51+i*5 : 62+i*7} width={isNarrow ? 52 : 92} height={isNarrow ? 4 : 6} rx="0" fill={i%2===0 ? '#f8fafc' : 'white'} fillOpacity="0.7" />
                            <rect x="5" y={isNarrow ? 52.5+i*5 : 64+i*7} width={isNarrow ? 18 : 35} height={isNarrow ? 1.5 : 2} rx="1" fill={colors.text} fillOpacity="0.4" />
                            <rect x={isNarrow ? 42 : 75} y={isNarrow ? 52.5+i*5 : 64+i*7} width={isNarrow ? 10 : 16} height={isNarrow ? 1.5 : 2} rx="1" fill={colors.text} fillOpacity="0.5" />
                        </g>
                    ))}

                    {/* Total line */}
                    <line x1={isNarrow ? 30 : 50} y1={isNarrow ? 68 : 83} x2={isNarrow ? 55 : 95} y2={isNarrow ? 68 : 83} stroke={colors.accent} strokeWidth="0.5" />
                    <rect x={isNarrow ? 38 : 60} y={isNarrow ? 70 : 85} width={isNarrow ? 17 : 30} height={isNarrow ? 3 : 4} rx="1" fill={colors.accent} fillOpacity="0.9" />

                    {/* Footer */}
                    <rect x={isNarrow ? 10 : 20} y={isNarrow ? 95 : 124} width={isNarrow ? 40 : 60} height={isNarrow ? 1.5 : 2} rx="1" fill={colors.text} fillOpacity="0.2" />
                </svg>
            </div>

            {/* Card Info */}
            <div className="p-3 bg-white dark:bg-slate-900">
                <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{preset.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">{preset.description}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ backgroundColor: colors.header + '20', color: colors.header }}>
                            {preset.paper.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Selected overlay */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 text-white" />
                </div>
            )}

            {/* Default badge */}
            {isDefault && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5" /> ACTIVE
                </div>
            )}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
    );
}

interface PrintStudioProps {
    templates: Record<string, any[]>;
    allTemplates?: any[];
    usage?: string;
    onTemplateUpdate?: () => void;
}

export function PrintStudio({ templates, allTemplates = [], usage = 'sale_bill', onTemplateUpdate }: PrintStudioProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Which template is being edited
    const [selectedPresetId, setSelectedPresetId] = useState<string>('classic_blue');
    const [activeTab, setActiveTab] = useState<'gallery' | 'brand' | 'sections' | 'roles' | 'automation'>('gallery');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [templateName, setTemplateName] = useState('My Custom Template');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    // Editable config state (mirrors PrintTemplatePreset structure but editable)
    const [brand, setBrand] = useState<PrintTemplatePreset['brand']>({
        primaryColor: '#1e3a8a',
        accentColor: '#3b82f6',
        headerBg: '#1e3a8a',
        headerText: '#ffffff',
        fontFamily: 'helvetica',
        logoPosition: 'left',
        logoSize: 70,
    });
    const [sections, setSections] = useState<PrintTemplatePreset['sections']>({
        showLogo: true, showHospitalName: true, showAddress: true,
        showPhone: true, showEmail: true, showTaxId: true,
        showPatientId: true, showDoctorName: true,
        showTaxColumn: true, showDiscountColumn: true, showUOMColumn: true, showHSNColumn: false,
        showBankDetails: false, showQRCode: false, showTerms: true, showSignature: true,
        showDueDate: false, showSerialNumbers: false,
    });
    const [paper, setPaper] = useState<'a4' | 'a5' | 'roll80'>('a4');
    const [roles, setRoles] = useState<string[]>([]);
    const [automation, setAutomation] = useState({
        autoPrint: false,
        previewBeforePrint: true,
        whatsappOnSave: false,
        emailOnSave: false,
        actionAfterSave: 'success_screen',
        copies: 1,
    });
    const [columns, setColumns] = useState({
        showTax: true,
        showDiscount: true,
        showUOM: true,
        showHsn: false,
    });

    const currentTemplates = usage === 'pos_bill' ? templates.pos_bill : templates.sale_bill;

    const applyPreset = (preset: PrintTemplatePreset) => {
        setSelectedPresetId(preset.id);
        setBrand(preset.brand);
        setSections(preset.sections);
        setPaper(preset.paper);
        setTemplateName(preset.name);
        // Sync columns with sections
        setColumns({
            showTax: preset.sections.showTaxColumn,
            showDiscount: preset.sections.showDiscountColumn,
            showUOM: preset.sections.showUOMColumn,
            showHsn: preset.sections.showHSNColumn,
        });
    };

    const loadFromTemplate = (tpl: any) => {
        setEditingTemplateId(tpl.id);
        setTemplateName(tpl.name);
        const cfg = tpl.config || {};
        const meta = (tpl.metadata as any) || {};
        setBrand({
            primaryColor: cfg.brand?.primaryColor || '#1e3a8a',
            accentColor: cfg.brand?.accentColor || '#3b82f6',
            headerBg: cfg.brand?.headerBg || '#1e3a8a',
            headerText: cfg.brand?.headerText || '#ffffff',
            fontFamily: cfg.brand?.fontFamily || 'helvetica',
            logoPosition: cfg.brand?.logoPosition || 'left',
            logoSize: cfg.brand?.logoSize || 70,
        });
        setSections(cfg.sections || sections);
        setPaper(cfg.pageSizeSettings?.format || 'a4');
        setRoles(meta.defaultForRoles || []);
        setAutomation({ ...automation, ...(cfg.automation || {}) });
        setColumns({ ...columns, ...(cfg.columns || {}) });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const config = {
                brand,
                sections,
                pageSizeSettings: { format: paper },
                columns,
                automation,
                advanced: {
                    showBankDetails: sections.showBankDetails,
                    showQRCode: sections.showQRCode,
                    showTerms: sections.showTerms,
                    showSignature: sections.showSignature,
                },
                presetId: selectedPresetId,
                source: 'print_studio',
            };
            const metadata = { defaultForRoles: roles };

            if (editingTemplateId) {
                const res = await updatePrintTemplateConfig(editingTemplateId, config, metadata);
                if (res.success) {
                    toast({ title: '✅ Template Updated', description: `"${templateName}" saved successfully.` });
                } else {
                    throw new Error(res.error);
                }
            } else {
                const res = await createPrintTemplate({ name: templateName, usage, config, metadata });
                if (res.success) {
                    setEditingTemplateId(res.id ?? null);
                    toast({ title: '✅ Template Created', description: `"${templateName}" is ready. Set it as default to activate.` });
                } else {
                    throw new Error(res.error);
                }
            }
            router.refresh();
            onTemplateUpdate?.();
        } catch (e: any) {
            toast({ title: 'Save Failed', description: e.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        startTransition(async () => {
            const res = await setPrintTemplateActive(id, usage);
            if (res.success) {
                toast({ title: '⚡ Template Activated', description: 'This format is now live for all prints.' });
                router.refresh();
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        startTransition(async () => {
            const res = await deletePrintTemplate(id);
            if (res.success) {
                toast({ title: 'Template Deleted' });
                setEditingTemplateId(null);
                setIsCreatingNew(false);
                router.refresh();
            }
        });
    };

    const toggleRole = (role: string) => {
        setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };

    const toggleSection = (key: keyof PrintTemplatePreset['sections']) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const TABS = [
        { id: 'gallery', label: 'Templates', icon: LayoutTemplate },
        { id: 'brand', label: 'Brand', icon: Palette },
        { id: 'sections', label: 'Sections', icon: Grid },
        { id: 'roles', label: 'Roles', icon: Users },
        { id: 'automation', label: 'Automation', icon: Zap },
    ] as const;

    return (
        <div className="flex flex-col h-full">
            {/* ── TOP TOOLBAR ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
                        <Printer className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Print Studio</h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Design · Save · Activate</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest transition-colors shadow-md shadow-indigo-600/30 disabled:opacity-60"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>

            {/* ── MAIN AREA ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ── LEFT: Active Templates List ── */}
                <div className="w-56 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Your Templates</p>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                        {currentTemplates.map(tpl => (
                            <button
                                key={tpl.id}
                                onClick={() => loadFromTemplate(tpl)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-xs ${
                                    editingTemplateId === tpl.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold truncate">{tpl.name}</span>
                                    {tpl.is_default && <Star className={`w-3 h-3 shrink-0 ${editingTemplateId === tpl.id ? 'text-yellow-300' : 'text-emerald-500'}`} />}
                                </div>
                                <p className={`text-[10px] mt-0.5 ${editingTemplateId === tpl.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {(tpl.config as any)?.pageSizeSettings?.format?.toUpperCase() || 'A4'}
                                    {tpl.is_default ? ' · Default' : ''}
                                </p>
                            </button>
                        ))}
                        <button
                            onClick={() => { setEditingTemplateId(null); setIsCreatingNew(true); setTemplateName('New Template'); }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border border-dashed transition-all text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 ${isCreatingNew && !editingTemplateId ? 'border-indigo-400 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                            <div className="flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> New Template
                            </div>
                        </button>
                    </div>

                    {/* Actions for selected template */}
                    {editingTemplateId && (
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            <button
                                onClick={() => handleSetDefault(editingTemplateId)}
                                disabled={isPending}
                                className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                            >
                                <Star className="w-3 h-3" /> Set as Default
                            </button>
                            <button
                                onClick={() => handleDelete(editingTemplateId)}
                                disabled={isPending}
                                className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Config Panel ── */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Template Name Input */}
                    <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder="Template name..."
                            className="flex-1 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-300 border-none outline-none"
                        />
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 overflow-x-auto scrollbar-none">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors mr-1 ${
                                    activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* ── GALLERY TAB ── */}
                        {activeTab === 'gallery' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Choose a Starting Template</h3>
                                    <p className="text-[11px] text-slate-400">Pick a professional design, then customize it in Brand & Sections tabs</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {BUILT_IN_PRESETS.map(preset => (
                                        <TemplatePreviewCard
                                            key={preset.id}
                                            preset={preset}
                                            isSelected={selectedPresetId === preset.id}
                                            isDefault={false}
                                            onSelect={() => applyPreset(preset)}
                                            onSetDefault={() => {}}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── BRAND TAB ── */}
                        {activeTab === 'brand' && (
                            <div className="space-y-6">
                                {/* Paper Size */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Paper Size</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PAPER_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setPaper(opt.value as any)}
                                                className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                    paper === opt.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <span className="text-lg">{opt.icon}</span>
                                                <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">{opt.label}</p>
                                                <p className="text-[10px] text-slate-400">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Palette */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Brand Color</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {COLOR_PALETTES.filter(p => p.primary).map(palette => (
                                            <button
                                                key={palette.label}
                                                type="button"
                                                title={palette.label}
                                                onClick={() => setBrand(prev => ({ ...prev, primaryColor: palette.primary, accentColor: palette.accent, headerBg: palette.primary }))}
                                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${brand.primaryColor === palette.primary ? 'border-white shadow-md ring-2 ring-slate-400' : 'border-transparent'}`}
                                                style={{ backgroundColor: palette.primary }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-slate-400 mb-1">Header Color</label>
                                            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                                                <input type="color" value={brand.primaryColor} onChange={e => setBrand(prev => ({ ...prev, primaryColor: e.target.value, headerBg: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                                                <input type="text" value={brand.primaryColor} onChange={e => setBrand(prev => ({ ...prev, primaryColor: e.target.value, headerBg: e.target.value }))} className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-slate-400 mb-1">Accent Color</label>
                                            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                                                <input type="color" value={brand.accentColor} onChange={e => setBrand(prev => ({ ...prev, accentColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                                                <input type="text" value={brand.accentColor} onChange={e => setBrand(prev => ({ ...prev, accentColor: e.target.value }))} className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Font */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Font Family</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {FONT_OPTIONS.map(font => (
                                            <button
                                                key={font.value}
                                                type="button"
                                                onClick={() => setBrand(prev => ({ ...prev, fontFamily: font.value as any }))}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                    brand.fontFamily === font.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="block text-lg font-bold text-slate-800 dark:text-white" style={{ fontFamily: font.value === 'helvetica' ? 'Arial, sans-serif' : font.value === 'times' ? 'Georgia, serif' : 'monospace' }}>{font.preview}</span>
                                                <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">{font.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logo Position */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Logo Position</label>
                                    <div className="flex gap-2">
                                        {(['left', 'center', 'right', 'hidden'] as const).map(pos => {
                                            const Icon = pos === 'left' ? AlignLeft : pos === 'center' ? AlignCenter : pos === 'right' ? AlignRight : X;
                                            return (
                                                <button
                                                    key={pos}
                                                    type="button"
                                                    onClick={() => setBrand(prev => ({ ...prev, logoPosition: pos }))}
                                                    className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all ${
                                                        brand.logoPosition === pos
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" /> {pos}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Logo Size */}
                                {brand.logoPosition !== 'hidden' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Logo Size: {brand.logoSize}pt</label>
                                        <input
                                            type="range" min={30} max={120} step={5} value={brand.logoSize}
                                            onChange={e => setBrand(prev => ({ ...prev, logoSize: Number(e.target.value) }))}
                                            className="w-full accent-indigo-600"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── SECTIONS TAB ── */}
                        {activeTab === 'sections' && (
                            <div className="space-y-6">
                                {SECTION_GROUPS.map(group => (
                                    <div key={group.label}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-base">{group.icon}</span>
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.label}</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {group.fields.map(field => (
                                                <div key={field.key} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                    <label className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer font-medium">{field.label}</label>
                                                    <Toggle
                                                        checked={sections[field.key as keyof typeof sections] as boolean}
                                                        onChange={() => toggleSection(field.key as any)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── ROLES TAB ── */}
                        {activeTab === 'roles' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Role-Based Default</h3>
                                    <p className="text-[11px] text-slate-400">When a user from these roles prints a {usage.replace('_', ' ')}, this template is used automatically.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map(role => {
                                        const isSelected = roles.includes(role);
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => toggleRole(role)}
                                                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>{role}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {roles.length > 0 && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                                        ✅ This template will auto-activate for: <strong>{roles.join(', ')}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── AUTOMATION TAB ── */}
                        {activeTab === 'automation' && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Post-Bill Automation</h3>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Action After Bill Saved</label>
                                    <select
                                        value={automation.actionAfterSave}
                                        onChange={e => setAutomation(prev => ({ ...prev, actionAfterSave: e.target.value }))}
                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="success_screen">Show Success Screen (Default)</option>
                                        <option value="new_bill">Open New Bill (Fast Mode)</option>
                                        <option value="list">Go to Bill List</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Print Copies</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number" min={1} max={5} value={automation.copies}
                                            onChange={e => setAutomation(prev => ({ ...prev, copies: Number(e.target.value) }))}
                                            className="w-20 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-center font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-xs text-slate-400">copies printed each time</span>
                                    </div>
                                </div>

                                {[
                                    { key: 'autoPrint', label: 'Auto-Print (Skip Preview)', sub: 'Print immediately after save without showing preview', icon: Printer, color: 'text-indigo-500' },
                                    { key: 'previewBeforePrint', label: 'Show Preview Before Print', sub: 'Let user see the bill before printing', icon: Eye, color: 'text-blue-500' },
                                    { key: 'whatsappOnSave', label: 'Auto-Send via WhatsApp', sub: 'Send bill PDF to patient via WhatsApp automatically', icon: Zap, color: 'text-green-500' },
                                    { key: 'emailOnSave', label: 'Auto-Send via Email', sub: 'Email bill PDF to patient automatically', icon: FileText, color: 'text-sky-500' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-start justify-between gap-4 py-3 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-start gap-2.5">
                                            <item.icon className={`w-4 h-4 mt-0.5 ${item.color}`} />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                                            </div>
                                        </div>
                                        <Toggle
                                            checked={automation[item.key as keyof typeof automation] as boolean}
                                            onChange={v => setAutomation(prev => ({ ...prev, [item.key]: v }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PREVIEW MODAL ── */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4" onClick={() => setIsPreviewOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Preview: {templateName}</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex justify-center items-start">
                            <div className="bg-white shadow-xl rounded w-full" style={{
                                maxWidth: paper === 'roll80' ? '80mm' : paper === 'a5' ? '148mm' : '210mm',
                                minHeight: '297mm',
                                fontFamily: brand.fontFamily === 'helvetica' ? 'Arial, sans-serif' : brand.fontFamily === 'times' ? 'Georgia, serif' : 'monospace',
                            }}>
                                {/* Preview Header */}
                                <div style={{ backgroundColor: brand.primaryColor, color: brand.headerText, padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {sections.showLogo && brand.logoPosition !== 'hidden' && (
                                            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ImageIcon style={{ width: 20, height: 20 }} />
                                            </div>
                                        )}
                                        <div>
                                            {sections.showHospitalName && <div style={{ fontWeight: 900, fontSize: 14 }}>ELITE MEDICAL CENTER</div>}
                                            {sections.showAddress && <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>123 Hospital Road, Kerala, India</div>}
                                            {sections.showPhone && <div style={{ fontSize: 10, opacity: 0.7 }}>📞 +91 98765 43210</div>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 20px', fontSize: 11, color: '#1e293b' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bill To</div>
                                            <div style={{ fontWeight: 900, fontSize: 13, marginTop: 2 }}>JOHN DOE</div>
                                            {sections.showPatientId && <div style={{ fontSize: 10, color: '#64748b' }}>ID: P-900827</div>}
                                            {sections.showDoctorName && <div style={{ fontSize: 10, color: '#64748b' }}>Dr. Alexander Fleming</div>}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Invoice</div>
                                            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>INV-2026-001</div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>10 Jul 2026</div>
                                        </div>
                                    </div>
                                    {/* Table */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                                        <thead>
                                            <tr style={{ backgroundColor: brand.primaryColor + '15' }}>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', color: brand.primaryColor }}>Item</th>
                                                {sections.showUOMColumn && <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, fontSize: 9, color: brand.primaryColor }}>UOM</th>}
                                                <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: brand.primaryColor }}>Qty</th>
                                                <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: brand.primaryColor }}>Rate</th>
                                                {sections.showDiscountColumn && <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: brand.primaryColor }}>Disc</th>}
                                                {sections.showTaxColumn && <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: brand.primaryColor }}>Tax</th>}
                                                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: brand.primaryColor }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['Consultation Fee', 'Lab Blood Test', 'Medicines Pack'].map((item, i) => (
                                                <tr key={item} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                                                    <td style={{ padding: '5px 8px' }}>{item}</td>
                                                    {sections.showUOMColumn && <td style={{ padding: '5px 4px', textAlign: 'center', color: '#64748b' }}>Nos</td>}
                                                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>1</td>
                                                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{[500, 350, 1200][i]}</td>
                                                    {sections.showDiscountColumn && <td style={{ padding: '5px 4px', textAlign: 'right', color: '#16a34a' }}>0</td>}
                                                    {sections.showTaxColumn && <td style={{ padding: '5px 4px', textAlign: 'right', color: '#64748b' }}>{[25, 17, 60][i]}</td>}
                                                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{[525, 367, 1260][i]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Grand Total</div>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: brand.primaryColor }}>₹ 2,152</div>
                                        </div>
                                    </div>
                                    {sections.showBankDetails && (
                                        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#f8fafc', borderRadius: 6, fontSize: 9 }}>
                                            <div style={{ fontWeight: 700, marginBottom: 2 }}>Bank Details</div>
                                            <div style={{ color: '#64748b' }}>Account: 1234567890 | IFSC: SBIN001234</div>
                                        </div>
                                    )}
                                    {sections.showSignature && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                            <div style={{ textAlign: 'center', fontSize: 9 }}>
                                                <div style={{ borderTop: '1px solid #334155', width: 100, marginBottom: 3 }}></div>
                                                <div style={{ color: '#64748b' }}>Authorized Signatory</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
