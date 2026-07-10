/**
 * WORLD-CLASS PRINT TEMPLATE PRESETS
 * Pre-built invoice designs — Visual gallery templates, like Zoho Books & QuickBooks
 * Each preset defines: layout style, brand colors, sections, paper size
 */

export type PrintLayout = 'classic' | 'modern' | 'bold' | 'minimal' | 'compact' | 'thermal' | 'tally' | 'gst';

export interface TemplateBrand {
    primaryColor: string;
    accentColor: string;
    headerBg: string;
    headerText: string;
    fontFamily: 'helvetica' | 'times' | 'courier';
    logoPosition: 'left' | 'center' | 'right' | 'hidden';
    logoSize: number;
}

export interface TemplateSections {
    showLogo: boolean;
    showHospitalName: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showTaxId: boolean;
    showPatientId: boolean;
    showDoctorName: boolean;
    showTaxColumn: boolean;
    showDiscountColumn: boolean;
    showUOMColumn: boolean;
    showHSNColumn: boolean;
    showBankDetails: boolean;
    showQRCode: boolean;
    showTerms: boolean;
    showSignature: boolean;
    showDueDate: boolean;
    showSerialNumbers: boolean;
}

export interface PrintTemplatePreset {
    id: string;
    name: string;
    description: string;
    layout: PrintLayout;
    brand: TemplateBrand;
    sections: TemplateSections;
    paper: 'a4' | 'a5' | 'roll80';
    previewColors: { bg: string; header: string; accent: string; text: string };
}

export const BUILT_IN_PRESETS: PrintTemplatePreset[] = [
    {
        id: 'classic_blue',
        name: 'Classic Blue',
        description: 'Traditional hospital invoice. Professional navy header with clean white body.',
        layout: 'classic',
        brand: {
            primaryColor: '#1e3a8a',
            accentColor: '#3b82f6',
            headerBg: '#1e3a8a',
            headerText: '#ffffff',
            fontFamily: 'helvetica',
            logoPosition: 'left',
            logoSize: 70,
        },
        sections: {
            showLogo: true, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: true, showTaxId: true,
            showPatientId: true, showDoctorName: true,
            showTaxColumn: true, showDiscountColumn: true, showUOMColumn: true, showHSNColumn: false,
            showBankDetails: false, showQRCode: false, showTerms: true, showSignature: true,
            showDueDate: false, showSerialNumbers: false
        },
        paper: 'a4',
        previewColors: { bg: '#ffffff', header: '#1e3a8a', accent: '#3b82f6', text: '#1e293b' }
    },
    {
        id: 'modern_indigo',
        name: 'Modern Indigo',
        description: 'Sleek split-layout. Color sidebar on left, invoice details on right. Used by top hospitals.',
        layout: 'modern',
        brand: {
            primaryColor: '#4f46e5',
            accentColor: '#818cf8',
            headerBg: '#4f46e5',
            headerText: '#ffffff',
            fontFamily: 'helvetica',
            logoPosition: 'left',
            logoSize: 65,
        },
        sections: {
            showLogo: true, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: true, showTaxId: true,
            showPatientId: true, showDoctorName: true,
            showTaxColumn: true, showDiscountColumn: true, showUOMColumn: false, showHSNColumn: false,
            showBankDetails: false, showQRCode: true, showTerms: false, showSignature: false,
            showDueDate: false, showSerialNumbers: false
        },
        paper: 'a4',
        previewColors: { bg: '#ffffff', header: '#4f46e5', accent: '#818cf8', text: '#1e293b' }
    },
    {
        id: 'bold_emerald',
        name: 'Bold Emerald',
        description: 'High-contrast dark green header. Eye-catching design for premium clinics.',
        layout: 'bold',
        brand: {
            primaryColor: '#065f46',
            accentColor: '#10b981',
            headerBg: '#065f46',
            headerText: '#ffffff',
            fontFamily: 'helvetica',
            logoPosition: 'center',
            logoSize: 60,
        },
        sections: {
            showLogo: true, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: false, showTaxId: true,
            showPatientId: true, showDoctorName: true,
            showTaxColumn: true, showDiscountColumn: false, showUOMColumn: false, showHSNColumn: false,
            showBankDetails: true, showQRCode: false, showTerms: true, showSignature: true,
            showDueDate: false, showSerialNumbers: false
        },
        paper: 'a4',
        previewColors: { bg: '#ffffff', header: '#065f46', accent: '#10b981', text: '#1e293b' }
    },
    {
        id: 'minimal_slate',
        name: 'Minimal',
        description: 'Ultra-clean. No color blocks. Just sharp typography. Inspired by Zoho Books minimal.',
        layout: 'minimal',
        brand: {
            primaryColor: '#334155',
            accentColor: '#64748b',
            headerBg: '#ffffff',
            headerText: '#0f172a',
            fontFamily: 'helvetica',
            logoPosition: 'right',
            logoSize: 60,
        },
        sections: {
            showLogo: true, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: true, showTaxId: false,
            showPatientId: true, showDoctorName: false,
            showTaxColumn: true, showDiscountColumn: false, showUOMColumn: false, showHSNColumn: false,
            showBankDetails: false, showQRCode: false, showTerms: false, showSignature: false,
            showDueDate: false, showSerialNumbers: false
        },
        paper: 'a4',
        previewColors: { bg: '#ffffff', header: '#f8fafc', accent: '#334155', text: '#1e293b' }
    },
    {
        id: 'gst_standard',
        name: 'GST Tax Invoice',
        description: 'Indian GST compliant. CGST/SGST columns, HSN codes, supplier details. Tally-compatible.',
        layout: 'gst',
        brand: {
            primaryColor: '#7c3aed',
            accentColor: '#a78bfa',
            headerBg: '#7c3aed',
            headerText: '#ffffff',
            fontFamily: 'helvetica',
            logoPosition: 'left',
            logoSize: 65,
        },
        sections: {
            showLogo: true, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: true, showTaxId: true,
            showPatientId: true, showDoctorName: false,
            showTaxColumn: true, showDiscountColumn: true, showUOMColumn: true, showHSNColumn: true,
            showBankDetails: true, showQRCode: true, showTerms: true, showSignature: true,
            showDueDate: true, showSerialNumbers: true
        },
        paper: 'a4',
        previewColors: { bg: '#ffffff', header: '#7c3aed', accent: '#a78bfa', text: '#1e293b' }
    },
    {
        id: 'compact_a5',
        name: 'Compact A5',
        description: 'Half-page format. Save paper. Perfect for OPD and quick billing.',
        layout: 'compact',
        brand: {
            primaryColor: '#0369a1',
            accentColor: '#38bdf8',
            headerBg: '#0369a1',
            headerText: '#ffffff',
            fontFamily: 'helvetica',
            logoPosition: 'left',
            logoSize: 50,
        },
        sections: {
            showLogo: true, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: false, showTaxId: false,
            showPatientId: true, showDoctorName: true,
            showTaxColumn: false, showDiscountColumn: false, showUOMColumn: false, showHSNColumn: false,
            showBankDetails: false, showQRCode: false, showTerms: false, showSignature: false,
            showDueDate: false, showSerialNumbers: false
        },
        paper: 'a5',
        previewColors: { bg: '#ffffff', header: '#0369a1', accent: '#38bdf8', text: '#1e293b' }
    },
    {
        id: 'thermal_80mm',
        name: 'Thermal 80mm',
        description: 'POS thermal receipt. 80mm paper. Fast billing counter format.',
        layout: 'thermal',
        brand: {
            primaryColor: '#000000',
            accentColor: '#374151',
            headerBg: '#ffffff',
            headerText: '#000000',
            fontFamily: 'courier',
            logoPosition: 'center',
            logoSize: 50,
        },
        sections: {
            showLogo: false, showHospitalName: true, showAddress: true,
            showPhone: true, showEmail: false, showTaxId: false,
            showPatientId: false, showDoctorName: false,
            showTaxColumn: true, showDiscountColumn: false, showUOMColumn: false, showHSNColumn: false,
            showBankDetails: false, showQRCode: false, showTerms: false, showSignature: false,
            showDueDate: false, showSerialNumbers: false
        },
        paper: 'roll80',
        previewColors: { bg: '#ffffff', header: '#ffffff', accent: '#000000', text: '#000000' }
    }
];

export const LAYOUT_DESCRIPTIONS: Record<PrintLayout, { icon: string; label: string }> = {
    classic: { icon: '🏛️', label: 'Classic' },
    modern: { icon: '✨', label: 'Modern' },
    bold: { icon: '💪', label: 'Bold' },
    minimal: { icon: '◻️', label: 'Minimal' },
    compact: { icon: '📄', label: 'Compact' },
    thermal: { icon: '🧾', label: 'Thermal' },
    tally: { icon: '📊', label: 'Tally Style' },
    gst: { icon: '🇮🇳', label: 'GST Invoice' },
};

export const PAPER_OPTIONS = [
    { value: 'a4', label: 'A4 (210 × 297mm)', icon: '📄', desc: 'Standard hospital invoice' },
    { value: 'a5', label: 'A5 (148 × 210mm)', icon: '📋', desc: 'Compact half-page' },
    { value: 'roll80', label: '80mm Thermal', icon: '🧾', desc: 'POS counter receipt' },
] as const;

export const FONT_OPTIONS = [
    { value: 'helvetica', label: 'Helvetica (Modern)', preview: 'Aa' },
    { value: 'times', label: 'Times New Roman (Classic)', preview: 'Aa' },
    { value: 'courier', label: 'Courier (Monospace)', preview: 'Aa' },
] as const;

export const COLOR_PALETTES = [
    { label: 'Navy', primary: '#1e3a8a', accent: '#3b82f6' },
    { label: 'Indigo', primary: '#4f46e5', accent: '#818cf8' },
    { label: 'Emerald', primary: '#065f46', accent: '#10b981' },
    { label: 'Purple', primary: '#7c3aed', accent: '#a78bfa' },
    { label: 'Rose', primary: '#9f1239', accent: '#fb7185' },
    { label: 'Sky', primary: '#0369a1', accent: '#38bdf8' },
    { label: 'Slate', primary: '#334155', accent: '#64748b' },
    { label: 'Amber', primary: '#92400e', accent: '#f59e0b' },
    { label: 'Black', primary: '#000000', accent: '#374151' },
    { label: 'Custom', primary: '', accent: '' },
];
