"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2, Sparkles, Plus, Trash2, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { checkDrugInteractions, InteractionCheckResult } from '@/app/actions/drug-interaction-checker';

export function DrugInteractionCheckerModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Inputs
    const [newMeds, setNewMeds] = useState<string[]>(['Warfarin', 'Aspirin']);
    const [activeMeds, setActiveMeds] = useState<string[]>(['Omeprazole']);
    const [allergies, setAllergies] = useState<string[]>(['Penicillin']);

    const [medInput, setMedInput] = useState('');
    const [activeInput, setActiveInput] = useState('');
    const [allergyInput, setAllergyInput] = useState('');

    const [checkResult, setCheckResult] = useState<InteractionCheckResult | null>(null);

    const handleRunCheck = async () => {
        if (newMeds.length === 0) {
            toast.error("No Medicines", { description: "Add at least one new medication to check." });
            return;
        }

        setIsChecking(true);
        try {
            const res = await checkDrugInteractions({
                newMedicines: newMeds,
                activeMedicines: activeMeds,
                allergies: allergies
            });

            if (res.error || !res.data) {
                toast.error("Check Failed", { description: res.error || "Failed to analyze interactions" });
            } else {
                setCheckResult(res.data);
                if (res.data.hasWarnings) {
                    toast.warning("Interactions Detected", { description: `Found ${res.data.interactions.length + res.data.allergyWarnings.length} potential interaction/allergy risks.` });
                } else {
                    toast.success("No Interaction Risks", { description: "Prescription is safe from major interactions." });
                }
            }
        } catch (e: any) {
            toast.error("Check Error", { description: e.message });
        } finally {
            setIsChecking(false);
        }
    };

    const addMed = () => {
        if (medInput.trim()) {
            setNewMeds([...newMeds, medInput.trim()]);
            setMedInput('');
            setCheckResult(null);
        }
    };

    const removeMed = (index: number) => {
        setNewMeds(newMeds.filter((_, i) => i !== index));
        setCheckResult(null);
    };

    const addActive = () => {
        if (activeInput.trim()) {
            setActiveMeds([...activeMeds, activeInput.trim()]);
            setActiveInput('');
            setCheckResult(null);
        }
    };

    const addAllergy = () => {
        if (allergyInput.trim()) {
            setAllergies([...allergies, allergyInput.trim()]);
            setAllergyInput('');
            setCheckResult(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border-amber-500/30 font-bold flex items-center gap-2"
                >
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    AI Interaction Checker
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-2xl space-y-4 p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            <span>AI Drug Interaction & Allergy Checker</span>
                        </div>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                            CLINICAL SAFETY AI
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* New Prescribed Meds */}
                    <div className="space-y-2 p-3 bg-muted/30 border border-border/50 rounded-xl">
                        <label className="font-bold text-foreground flex items-center justify-between">
                            <span>Prescribed Medicines</span>
                            <Badge className="bg-indigo-500/10 text-indigo-400">{newMeds.length}</Badge>
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={medInput}
                                onChange={(e) => setMedInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addMed()}
                                placeholder="e.g. Amoxicillin, Aspirin"
                                className="h-8 text-xs bg-background"
                            />
                            <Button size="sm" onClick={addMed} className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white"><Plus className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {newMeds.map((m, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1 bg-background text-foreground border border-border">
                                    {m} <Trash2 className="h-3 w-3 cursor-pointer text-red-400" onClick={() => removeMed(idx)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Active Meds & Allergies */}
                    <div className="space-y-3 p-3 bg-muted/30 border border-border/50 rounded-xl">
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Active Patient Meds</label>
                            <div className="flex gap-2">
                                <Input
                                    value={activeInput}
                                    onChange={(e) => setActiveInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addActive()}
                                    placeholder="e.g. Warfarin, Digoxin"
                                    className="h-8 text-xs bg-background"
                                />
                                <Button size="sm" onClick={addActive} className="h-8 bg-slate-700 text-white"><Plus className="h-3.5 w-3.5" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {activeMeds.map((a, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px]">{a}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-border/50">
                            <label className="font-bold text-red-400">Known Allergies</label>
                            <div className="flex gap-2">
                                <Input
                                    value={allergyInput}
                                    onChange={(e) => setAllergyInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                                    placeholder="e.g. Penicillin, Sulfa"
                                    className="h-8 text-xs bg-background border-red-500/30"
                                />
                                <Button size="sm" onClick={addAllergy} variant="destructive" className="h-8"><Plus className="h-3.5 w-3.5" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {allergies.map((al, idx) => (
                                    <Badge key={idx} className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px]">{al}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Check Button */}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={handleRunCheck}
                        disabled={isChecking || newMeds.length === 0}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 w-full sm:w-auto"
                    >
                        {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                        Run AI Safety & Interaction Check
                    </Button>
                </div>

                {/* Results Preview */}
                {checkResult && (
                    <div className="space-y-3 pt-2">
                        {checkResult.hasWarnings ? (
                            <div className="p-4 rounded-xl border bg-red-950/40 border-red-500/40 space-y-3 text-xs">
                                <div className="font-bold text-red-300 flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" /> Safety Risks Detected</span>
                                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 uppercase font-mono">{checkResult.highestSeverity}</Badge>
                                </div>

                                {/* Drug-Drug Interactions */}
                                {checkResult.interactions && checkResult.interactions.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="font-bold text-red-200 uppercase tracking-wider text-[10px]">Drug-Drug Interactions ({checkResult.interactions.length})</label>
                                        {checkResult.interactions.map((inter, idx) => (
                                            <div key={idx} className="p-2.5 rounded-lg bg-background/60 border border-red-500/20 space-y-1">
                                                <div className="flex items-center justify-between font-bold text-red-300">
                                                    <span>⚠️ {inter.drug1} + {inter.drug2}</span>
                                                    <span className="text-[10px] uppercase font-mono text-amber-400">{inter.riskLevel}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">{inter.description}</p>
                                                <p className="text-[11px] font-semibold text-emerald-400">💡 Advice: {inter.recommendation}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Allergy Warnings */}
                                {checkResult.allergyWarnings && checkResult.allergyWarnings.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="font-bold text-red-200 uppercase tracking-wider text-[10px]">Allergy Contraindications ({checkResult.allergyWarnings.length})</label>
                                        {checkResult.allergyWarnings.map((al, idx) => (
                                            <div key={idx} className="p-2.5 rounded-lg bg-red-900/30 border border-red-500/40 text-red-200 space-y-1">
                                                <div className="font-bold text-red-300">🚨 {al.drug} vs Allergy: {al.allergy}</div>
                                                <p className="text-[11px] opacity-90">{al.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border bg-emerald-950/40 border-emerald-500/40 flex items-center gap-3 text-emerald-200 text-xs">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                                <div>
                                    <div className="font-bold text-sm text-emerald-300">Prescription Safety Verified</div>
                                    <p className="opacity-80">No major drug-drug interactions or allergen clashes detected.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
