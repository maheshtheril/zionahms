import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Clock, User, FileText, IndianRupee, Stethoscope } from "lucide-react"

export default async function AppointmentDetailPage(props: { params: Promise<any> }) {
    const params = await props.params;
    const { id } = await params

    const appointment = await prisma.hms_appointments.findUnique({
        where: { id },
        include: {
            hms_patient: true,
        }
    })

    if (!appointment) {
        return notFound()
    }

    // Manual fetch for clinician since relation might not be named `clinician`
    const doctor = appointment.clinician_id ? await prisma.hms_clinicians.findUnique({
        where: { id: appointment.clinician_id }
    }) : null

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hms/appointments" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Appointment Details
                            <span className={`text-sm px-2 py-1 rounded-full border ${appointment.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' :
                                appointment.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                                }`}>
                                {appointment.status || 'Scheduled'}
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm">ID: {appointment.id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/hms/billing/new?patientId=${appointment.patient_id}&appointmentId=${appointment.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                    >
                        <IndianRupee className="h-4 w-4" />
                        Bill This Visit
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Time & Schedule */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Schedule & Type
                    </h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium capitalize">
                                {appointment.type?.replace('_', ' ') || 'Consultation'}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium capitalize">
                                {appointment.mode?.replace('_', ' ') || 'In-Person'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-lg font-medium capitalize ${appointment.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                {appointment.priority || 'Normal'} Priority
                            </span>
                        </div>

                        <div className="pt-2 border-t border-gray-50">
                            <p className="text-sm text-gray-500">Start Time</p>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {new Date(appointment.starts_at).toLocaleString()}
                            </p>
                            {/* ... End time existing ... */}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">End Time</p>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {new Date(appointment.ends_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium text-gray-900">
                                {Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60000)} minutes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <User className="h-4 w-4 text-blue-600" />
                        Patient
                    </h3>
                    {appointment.hms_patient ? (
                        <div className="space-y-2">
                            <p className="font-medium text-lg text-blue-600">
                                <Link href={`/hms/patients/${appointment.patient_id}`} className="hover:underline">
                                    {appointment.hms_patient.first_name} {appointment.hms_patient.last_name}
                                </Link>
                            </p>
                            <p className="text-sm text-gray-500">Number: {appointment.hms_patient.patient_number}</p>
                            <p className="text-sm text-gray-500">Phone: {(appointment.hms_patient.contact as any)?.mobile || 'N/A'}</p>
                        </div>
                    ) : (
                        <p className="text-red-500">Patient information not found</p>
                    )}
                </div>

                {/* Doctor Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        Doctor
                    </h3>
                    {doctor ? (
                        <div className="space-y-2">
                            <p className="font-medium text-lg text-gray-900">Dr. {doctor.first_name} {doctor.last_name}</p>
                            <p className="text-sm text-gray-500">License: {doctor.license_no || 'N/A'}</p>
                            <div className="flex gap-2 mt-2">
                                <Link href={`/hms/doctors/${doctor.id}`} className="text-sm text-blue-600 hover:underline">
                                    View Profile
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">Doctor information unavailable</p>
                    )}
                </div>

                {/* Notes/Metadata */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Notes & Details
                    </h3>
                    <div className="prose prose-sm max-w-none text-gray-600">
                        {appointment.notes ? (
                            <p>{appointment.notes}</p>
                        ) : (
                            <p className="italic text-gray-400">No notes added for this appointment.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
