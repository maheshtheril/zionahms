'use client'

import { useState } from "react"
import { CreatePatientForm } from "@/components/hms/create-patient-form"
import { Edit } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"

export function EditPatientButton({ patient }: { patient: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    className="h-10 px-4 bg-white text-gray-700 border border-gray-200 shadow-sm rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[95vh] p-0 border-none overflow-hidden sm:rounded-3xl flex flex-col bg-slate-900/40 backdrop-blur-xl shadow-2xl">
                <DialogTitle className="sr-only">Edit Patient Profile</DialogTitle>
                <CreatePatientForm
                    isDialog={true}
                    initialData={patient}
                    onClose={() => setIsOpen(false)}
                    onSuccess={() => {
                        setIsOpen(false);
                        window.location.reload();
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
