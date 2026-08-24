"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Sparkles, Loader2, Play, CheckCircle2, RotateCcw, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseSpokenClinicalNote, ParsedClinicalNote } from '@/app/actions/voice-clinical-parser';

interface VoiceDictationModalProps {
    onApplyClinicalNote: (note: ParsedClinicalNote) => void;
}

export function VoiceDictationModal({ onApplyClinicalNote }: VoiceDictationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-US');
    const [transcript, setTranscript] = useState('');
    const [parsedNote, setParsedNote] = useState<ParsedClinicalNote | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = selectedLang;

                rec.onresult = (event: any) => {
                    let currentText = '';
                    for (let i = 0; i < event.results.length; i++) {
                        currentText += event.results[i][0].transcript + ' ';
                    }
                    setTranscript(currentText.trim());
                };

                rec.onerror = (event: any) => {
                    console.error("Speech Recognition Error", event.error);
                    if (event.error !== 'no-speech') {
                        toast.error("Microphone Error", { description: event.error });
                    }
                    setIsListening(false);
                };

                rec.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = rec;
            }
        }
    }, [selectedLang]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Not Supported", { description: "Web Speech API is not supported in this browser. Try Chrome/Edge." });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setParsedNote(null);
            recognitionRef.current.lang = selectedLang;
            recognitionRef.current.start();
            setIsListening(true);
        }
    };


    const handleAnalyze = async () => {
        if (!transcript || transcript.trim().length < 5) {
            toast.error("Empty Dictation", { description: "Please speak or type a clinical note first." });
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        setIsAnalyzing(true);
        try {
            const res = await parseSpokenClinicalNote(transcript);
            if (res.error || !res.data) {
                toast.error("Analysis Failed", { description: res.error || "Could not parse dictation" });
            } else {
                setParsedNote(res.data);
                toast.success("Clinical Note Extracted", { description: "AI successfully extracted diagnosis & medicines." });
            }
        } catch (e: any) {
            toast.error("Analysis Error", { description: e.message });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApply = () => {
        if (parsedNote) {
            onApplyClinicalNote(parsedNote);
            toast.success("Applied to Prescription", { description: "Voice note populated into form fields." });
            setIsOpen(false);
        }
    };

    // Pre-fill demo sample dictation for instant testing
    const insertSampleDictation = () => {
        setTranscript("Patient presents with high fever and severe dry cough for 3 days. Diagnosis is acute bronchitis. Prescribe Paracetamol 500mg TDS for 5 days after food, and Cetirizine 10mg once daily at bedtime for 3 days. Order CBC and Chest X-Ray. Advise warm water intake and rest.");
        setParsedNote(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border-indigo-500/30 font-bold flex items-center gap-2"
                >
                    <Mic className="h-4 w-4 text-indigo-400" />
                    Voice Dictation AI
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-2xl space-y-4 p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                            <span>AI Voice Clinical Dictation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedLang}
                                onChange={(e) => setSelectedLang(e.target.value)}
                                className="bg-background text-foreground border border-border text-xs font-bold rounded-lg px-2.5 py-1 focus:ring-indigo-500"
                            >
                                <option value="en-US">🌐 English (US/Global)</option>
                                <option value="en-IN">🇮🇳 English (Indian Accent)</option>
                                <option value="ml-IN">🌴 മലയാളം (Malayalam)</option>
                                <option value="hi-IN">🇮🇳 हिंदी (Hindi)</option>
                                <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
                                <option value="te-IN">🇮🇳 తెలుగు (Telugu)</option>
                                <option value="ar-SA">🇸🇦 العربية (Arabic)</option>
                                <option value="es-ES">🇪🇸 Español (Spanish)</option>
                                <option value="fr-FR">🇫🇷 Français (French)</option>
                            </select>
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                                MULTI-LANG AI
                            </Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Mic & Waveform Panel */}
                <div className="flex flex-col items-center justify-center p-6 bg-muted/30 border border-border/50 rounded-xl space-y-3">

                    <Button
                        type="button"
                        size="icon"
                        onClick={toggleListening}
                        className={`h-16 w-16 rounded-full transition-all shadow-xl ${
                            isListening
                                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-8 ring-red-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                    >
                        {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                    </Button>
                    <p className="text-xs font-semibold text-muted-foreground">
                        {isListening ? "Listening... Speak your prescription naturally" : "Click mic to start hands-free voice dictation"}
                    </p>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={insertSampleDictation}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                        Load Sample Medical Dictation
                    </Button>
                </div>

                {/* Transcript Area */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Spoken Transcript</label>
                    <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Live transcript will appear here as you speak..."
                        className="min-h-[100px] bg-background font-medium text-sm border-border focus-visible:ring-indigo-500"
                    />
                </div>

                {/* Extract AI Button */}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !transcript}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2"
                    >
                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Extract Structured Note with AI
                    </Button>
                </div>

                {/* AI Extracted Result Preview */}
                {parsedNote && (
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-3 text-xs">
                        <div className="font-bold text-indigo-200 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Extracted Clinical Note</span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Ready to Apply</Badge>
                        </div>

                        {parsedNote.diagnosis && (
                            <div>
                                <span className="font-bold text-muted-foreground">Diagnosis: </span>
                                <span className="font-semibold text-foreground">{parsedNote.diagnosis}</span>
                            </div>
                        )}

                        {parsedNote.complaints && parsedNote.complaints.length > 0 && (
                            <div>
                                <span className="font-bold text-muted-foreground">Symptoms: </span>
                                <span className="text-foreground">{parsedNote.complaints.join(', ')}</span>
                            </div>
                        )}

                        {parsedNote.medicines && parsedNote.medicines.length > 0 && (
                            <div className="space-y-1">
                                <span className="font-bold text-muted-foreground">Prescribed Medicines ({parsedNote.medicines.length}):</span>
                                <div className="grid grid-cols-1 gap-1">
                                    {parsedNote.medicines.map((m, idx) => (
                                        <div key={idx} className="p-2 bg-background/50 rounded-lg border border-border/50 flex items-center justify-between">
                                            <span className="font-bold text-foreground">{m.name} {m.dosage}</span>
                                            <span className="text-indigo-300 font-mono text-[11px]">{m.frequency} ({m.duration}) — {m.instructions}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                onClick={handleApply}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Apply to Patient Prescription
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
