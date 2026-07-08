'use client'

import { useState } from "react"
import { setPrintTemplateActive, updatePrintTemplateConfig } from "@/app/actions/print-settings"
import { FileText, MonitorCheck, Printer, CheckCircle2, Circle, Settings2, X, Save, MessageSquare, Mail, Eye, Power } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function PrintSettingsClient({ templates }: { templates: any }) {
    const [pending, setPending] = useState(false);
    const [editingConfig, setEditingConfig] = useState<any | null>(null);
    const saleBillTemplates = templates.sale_bill || [];
    const posBillTemplates = templates.pos_bill || [];

    const handleSetActive = async (id: string, usage: string) => {
        setPending(true);
        await setPrintTemplateActive(id, usage);
        setPending(false);
    }

    const openConfigModal = (e: React.MouseEvent, tpl: any) => {
        e.stopPropagation();
        
        // Ensure default structure exists
        const config = tpl.config || {};
        const automation = config.automation || { autoPrint: false, previewBeforePrint: true, whatsappOnSave: false, emailOnSave: false };
        const columns = config.columns || { showTax: true, showDiscount: true, showUOM: true, showHsn: false };
        const advanced = config.advanced || { showBankDetails: false, showQRCode: false, showTerms: false, showSignature: false };
        
        setEditingConfig({ 
            id: tpl.id, 
            name: tpl.name,
            config: { ...config, automation, columns, advanced }
        });
    }

    const saveConfig = async () => {
        if (!editingConfig) return;
        setPending(true);
        await updatePrintTemplateConfig(editingConfig.id, editingConfig.config);
        setEditingConfig(null);
        setPending(false);
    }

    const updateAutomation = (key: string, val: boolean) => {
        setEditingConfig((prev: any) => ({
            ...prev,
            config: { ...prev.config, automation: { ...prev.config.automation, [key]: val } }
        }))
    }

    const updateColumns = (key: string, val: boolean) => {
        setEditingConfig((prev: any) => ({
            ...prev,
            config: { ...prev.config, columns: { ...prev.config.columns, [key]: val } }
        }))
    }

    const updateAdvanced = (key: string, val: boolean) => {
        setEditingConfig((prev: any) => ({
            ...prev,
            config: { ...prev.config, advanced: { ...prev.config.advanced, [key]: val } }
        }))
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* General Billing Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">General Billing Format</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Used in back-office billing and invoice generation</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {saleBillTemplates.map((tpl: any) => (
                        <div 
                            key={tpl.id}
                            onClick={() => !pending && handleSetActive(tpl.id, 'sale_bill')}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between
                                ${tpl.is_default 
                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' 
                                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tpl.is_default ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${tpl.is_default ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {tpl.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Format: {(tpl.config as any)?.pageSizeSettings?.format?.toUpperCase() || 'Standard'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => openConfigModal(e, tpl)}
                                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                    <Settings2 className="w-5 h-5" />
                                </button>
                                {tpl.is_default ? <CheckCircle2 className="w-6 h-6 text-indigo-600" /> : <Circle className="w-6 h-6 text-slate-300" />}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Retail POS Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                        <MonitorCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Retail POS Format</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Used in high-speed Retail, Bakery, Pharmacy, and Supermarket POS terminals</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posBillTemplates.map((tpl: any) => (
                        <div 
                            key={tpl.id}
                            onClick={() => !pending && handleSetActive(tpl.id, 'pos_bill')}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between
                                ${tpl.is_default 
                                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm' 
                                    : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tpl.is_default ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${tpl.is_default ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {tpl.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Format: {(tpl.config as any)?.pageSizeSettings?.format?.toUpperCase() || ((tpl.config as any)?.source === 'legacy_html' ? 'Browser Print' : 'Standard')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => openConfigModal(e, tpl)}
                                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                    <Settings2 className="w-5 h-5" />
                                </button>
                                {tpl.is_default ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Circle className="w-6 h-6 text-slate-300" />}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Config Modal */}
            <Dialog open={!!editingConfig} onOpenChange={(o) => !o && setEditingConfig(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-indigo-600" />
                            Profile: {editingConfig?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {editingConfig && (
                        <div className="space-y-6 py-4">
                            {/* Automation Settings */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b pb-2">Post-Save Automation</h4>
                                
                                <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <Label className="text-slate-700 dark:text-slate-300">Action After Save</Label>
                                    <select 
                                        className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-indigo-500"
                                        value={editingConfig.config.automation.actionAfterSave || 'list'}
                                        onChange={(e) => updateAutomation('actionAfterSave', e.target.value)}
                                    >
                                        <option value="success_screen">Show Success Overlay (Default)</option>
                                        <option value="new_bill">Ready for New Bill (Fast)</option>
                                        <option value="list">Return to Bill List</option>
                                    </select>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Power className="w-4 h-4 text-slate-400" />
                                        <Label className="cursor-pointer">Auto-Print Instantly</Label>
                                    </div>
                                    <Switch 
                                        checked={editingConfig.config.automation.autoPrint}
                                        onCheckedChange={(c) => updateAutomation('autoPrint', c)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Eye className="w-4 h-4 text-slate-400" />
                                        <Label className="cursor-pointer">Preview Before Print</Label>
                                    </div>
                                    <Switch 
                                        checked={editingConfig.config.automation.previewBeforePrint}
                                        onCheckedChange={(c) => updateAutomation('previewBeforePrint', c)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-4 h-4 text-green-500" />
                                        <Label className="cursor-pointer">Auto-Send via WhatsApp</Label>
                                    </div>
                                    <Switch 
                                        checked={editingConfig.config.automation.whatsappOnSave}
                                        onCheckedChange={(c) => updateAutomation('whatsappOnSave', c)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        <Label className="cursor-pointer">Auto-Send via Email</Label>
                                    </div>
                                    <Switch 
                                        checked={editingConfig.config.automation.emailOnSave}
                                        onCheckedChange={(c) => updateAutomation('emailOnSave', c)}
                                    />
                                </div>
                            </div>

                            {/* Column Settings */}
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b pb-2">Column Visibility</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="col-tax"
                                            checked={editingConfig.config.columns.showTax}
                                            onCheckedChange={(c) => updateColumns('showTax', c)}
                                        />
                                        <Label htmlFor="col-tax">Tax Amount</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="col-disc"
                                            checked={editingConfig.config.columns.showDiscount}
                                            onCheckedChange={(c) => updateColumns('showDiscount', c)}
                                        />
                                        <Label htmlFor="col-disc">Discount Amount</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="col-uom"
                                            checked={editingConfig.config.columns.showUOM}
                                            onCheckedChange={(c) => updateColumns('showUOM', c)}
                                        />
                                        <Label htmlFor="col-uom">Unit (UOM)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="col-hsn"
                                            checked={editingConfig.config.columns.showHsn}
                                            onCheckedChange={(c) => updateColumns('showHsn', c)}
                                        />
                                        <Label htmlFor="col-hsn">HSN Code</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced ERP Features */}
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b pb-2">Business & Compliance (ERP Standard)</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="adv-bank"
                                            checked={editingConfig.config.advanced?.showBankDetails}
                                            onCheckedChange={(c) => updateAdvanced('showBankDetails', c)}
                                        />
                                        <Label htmlFor="adv-bank">Bank Details</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="adv-qr"
                                            checked={editingConfig.config.advanced?.showQRCode}
                                            onCheckedChange={(c) => updateAdvanced('showQRCode', c)}
                                        />
                                        <Label htmlFor="adv-qr">UPI / ZATCA QR Code</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="adv-terms"
                                            checked={editingConfig.config.advanced?.showTerms}
                                            onCheckedChange={(c) => updateAdvanced('showTerms', c)}
                                        />
                                        <Label htmlFor="adv-terms">Terms & Conditions</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="adv-sign"
                                            checked={editingConfig.config.advanced?.showSignature}
                                            onCheckedChange={(c) => updateAdvanced('showSignature', c)}
                                        />
                                        <Label htmlFor="adv-sign">Authorized Signatory</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingConfig(null)}>Cancel</Button>
                        <Button onClick={saveConfig} disabled={pending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Save className="w-4 h-4 mr-2" /> Save Config
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
