'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { EditDoctorDialog } from './edit-doctor-dialog'

export function DoctorProfileActions({ doctor, departments, roles, specializations, employees }: any) {
    const [isEditOpen, setIsEditOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 flex items-center gap-2 font-medium transition-colors"
            >
                <Pencil className="h-4 w-4" />
                Edit Profile
            </button>

            <EditDoctorDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                doctor={doctor}
                departments={departments}
                roles={roles}
                specializations={specializations}
                employees={employees}
            />
        </>
    )
}
