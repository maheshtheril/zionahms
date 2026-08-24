'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Megaphone, AlertTriangle, ShieldAlert, Zap, Timer } from 'lucide-react'
import { sendBroadcast } from '@/app/actions/broadcast'
import { toast } from 'sonner'

export function BroadcastCenter() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [priority, setPriority] = useState('high')
    const [type, setType] = useState('general')

    const handleSubmit = async () => {
        if (!message) {
            toast.error("Missing Signal", { description: "Please enter the broadcast message." })
            return
        }

        setLoading(true)
        const result = await sendBroadcast({
            message,
            priority,
            type,
            durationHours: priority === 'critical' ? 2 : 4
        })

        if (result.success) {
            toast.success("Signal Broadcasted", { description: "The emergency signal has been transmitted to all active personnel." })
            setOpen(false)
            setMessage('')
        } else {
            toast.error("Transmission Failed", { description: result.error as string })
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-500/20 rounded-2xl h-12 px-6 font-black text-xs tracking-widest">
                    <Megaphone className="h-4 w-4 mr-2" />
                    BROADCAST CENTER
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-card bg-background/95 border-border text-foreground sm:max-w-[500px] rounded-[2.5rem] backdrop-blur-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <Zap className="h-4 w-4 text-rose-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Emergency Command</span>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Broadcast Signal</DialogTitle>
                </DialogHeader>

                <div className="space-y-8 mt-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical Priority</Label>
                        <RadioGroup value={priority} onValueChange={setPriority} className="grid grid-cols-3 gap-4">
                            <div className={`p-4 rounded-2xl border transition-all ${priority === 'normal' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-muted/50 border-transparent'}`}>
                                <RadioGroupItem value="normal" id="p1" className="sr-only" />
                                <Label htmlFor="p1" className="flex flex-col items-center gap-2 cursor-pointer">
                                    <ShieldAlert className={`h-5 w-5 ${priority === 'normal' ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-black tracking-tighter">NORMAL</span>
                                </Label>
                            </div>
                            <div className={`p-4 rounded-2xl border transition-all ${priority === 'high' ? 'bg-orange-500/10 border-orange-500' : 'bg-muted/50 border-transparent'}`}>
                                <RadioGroupItem value="high" id="p2" className="sr-only" />
                                <Label htmlFor="p2" className="flex flex-col items-center gap-2 cursor-pointer">
                                    <Zap className={`h-5 w-5 ${priority === 'high' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-black tracking-tighter">HIGH</span>
                                </Label>
                            </div>
                            <div className={`p-4 rounded-2xl border transition-all ${priority === 'critical' ? 'bg-rose-500/10 border-rose-500' : 'bg-muted/50 border-transparent'}`}>
                                <RadioGroupItem value="critical" id="p3" className="sr-only" />
                                <Label htmlFor="p3" className="flex flex-col items-center gap-2 cursor-pointer">
                                    <Zap className={`h-5 w-5 ${priority === 'critical' ? 'text-rose-500' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-black tracking-tighter">CRITICAL</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signal Content</Label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g. Code Blue in Ward 4B - Immediate response required."
                            className="w-full min-h-[120px] p-4 bg-muted/50 border border-border rounded-2xl focus:ring-rose-500/50 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full h-14 font-black text-xs tracking-[0.2em] rounded-2xl shadow-2xl transition-all ${priority === 'critical' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                        >
                            {loading ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
