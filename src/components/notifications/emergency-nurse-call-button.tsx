"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Siren, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { triggerEmergencyNurseAlert } from '@/app/actions/nursing-inventory';

export function EmergencyNurseCallButton({ locationName = 'Room 101' }: { locationName?: string }) {
    const [isTriggering, setIsTriggering] = useState(false);

    const handleCall = async () => {
        setIsTriggering(true);
        try {
            const res = await triggerEmergencyNurseAlert(locationName, 'Patient Emergency Call');
            if (res.error) {
                toast.error("Call Failed", { description: res.error });
            } else {
                toast.success("Emergency Alert Sent", { description: `Nurses notified for ${locationName}` });
            }
        } catch (e: any) {
            toast.error("Call Failed", { description: e.message });
        } finally {
            setIsTriggering(false);
        }
    };

    return (
        <Button
            onClick={handleCall}
            disabled={isTriggering}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse flex items-center gap-2 shadow-lg"
        >
            {isTriggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
            Emergency Nurse Call
        </Button>
    );
}
