import { QRCodeSVG } from 'qrcode.react'
import { User, Phone, Calendar, MapPin, Activity, Banknote, CreditCard, Wifi } from "lucide-react"
import { useRef, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { ZionaLogo } from '@/components/branding/ziona-logo'

interface PatientIDCardProps {
    patient: {
        id: string
        patient_number: string
        first_name: string
        last_name: string
        dob?: Date | string
        gender?: string
        blood_group?: string
        contact?: {
            phone?: string
            address?: {
                city?: string
                state?: string
            }
        }
        metadata?: {
            title?: string
            registration_date?: string
            registration_expiry?: string
        }
    }
    registrationFee?: number
    upiId?: string
    hospitalName?: string
    hospitalLogo?: string
}

export function PatientIDCard({
    patient,
    registrationFee = 100,
    upiId = 'hospital@upi',
    hospitalName = 'Cloud HMS',
    hospitalLogo
}: PatientIDCardProps) {
    const { toast } = useToast()
    const [terminalStatus, setTerminalStatus] = useState<'idle' | 'connecting' | 'waiting' | 'success'>('idle')

    const cardRef = useRef<HTMLDivElement>(null)
    const paymentQRRef = useRef<HTMLDivElement>(null)

    // Generate UPI payment link for swiping machines
    const generateUPIPaymentString = () => {
        const params = new URLSearchParams({
            pa: upiId, // UPI ID
            pn: hospitalName, // Payee name
            am: registrationFee.toString(), // Amount
            cu: 'INR', // Currency
            tn: `Registration Fee - ${patient.patient_number}` // Transaction note
        })
        return `upi://pay?${params.toString()}`
    }

    const handlePrint = () => {
        if (cardRef.current) {
            const printWindow = window.open('', '', 'width=800,height=600')
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Patient ID Card - ${patient.patient_number}</title>
                            <style>
                                @media print {
                                    @page { margin: 0; size: 85.6mm 53.98mm; }
                                    body { margin: 0; padding: 0; }
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                    margin: 0;
                                    padding: 10mm;
                                    background: white;
                                }
                                .card {
                                    width: 85.6mm;
                                    height: 53.98mm;
                                    border: 2px solid #4F46E5;
                                    border-radius: 8px;
                                    overflow: hidden;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    position: relative;
                                }
                                .header {
                                    background: rgba(255,255,255,0.95);
                                    color: #1e293b;
                                    padding: 8px 12px;
                                    text-align: center;
                                    border-bottom: 3px solid #4F46E5;
                                }
                                .hospital-name {
                                    font-size: 16px;
                                    font-weight: 900;
                                    text-transform: uppercase;
                                    letter-spacing: 1px;
                                }
                                .content {
                                    display: flex;
                                    padding: 12px;
                                    gap: 12px;
                                }
                                .info {
                                    flex: 1;
                                }
                                .patient-name {
                                    font-size: 18px;
                                    font-weight: 900;
                                    margin-bottom: 4px;
                                    text-transform: uppercase;
                                }
                                .patient-id {
                                    font-size: 12px;
                                    font-weight: 700;
                                    background: rgba(255,255,255,0.2);
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    display: inline-block;
                                    margin-bottom: 8px;
                                }
                                .details {
                                    font-size: 10px;
                                    line-height: 1.6;
                                }
                                .qr-section {
                                    background: white;
                                    padding: 8px;
                                    border-radius: 8px;
                                    display: flex;
                                    align-items: center;
                                    justify-center;
                                }
                                .footer {
                                    position: absolute;
                                    bottom: 0;
                                    left: 0;
                                    right: 0;
                                    background: rgba(0,0,0,0.2);
                                    padding: 4px 12px;
                                    font-size: 8px;
                                    text-align: center;
                                }
                            </style>
                        </head>
                        <body>
                            ${cardRef.current.innerHTML}
                        </body>
                    </html>
                `)
                printWindow.document.close()
                setTimeout(() => {
                    printWindow.print()
                    printWindow.close()
                }, 250)
            }
        }
    }

    const patientData = {
        id: patient.id,
        number: patient.patient_number,
        name: `${patient.metadata?.title || ''} ${patient.first_name} ${patient.last_name}`.trim(),
        phone: patient.contact?.phone,
        dob: patient.dob ? new Date(patient.dob).toLocaleDateString('en-IN') : '',
        gender: patient.gender,
        blood: patient.blood_group
    }

    const upiPaymentString = generateUPIPaymentString()

    return (
        <div className="space-y-6">
            {/* Patient ID Card */}
            <div ref={cardRef} className="card w-full max-w-[85.6mm] mx-auto" style={{ height: '53.98mm' }}>
                <div className="header flex items-center justify-between !py-2">
                    {hospitalName.includes('Ziona') || hospitalName.includes('Cloud') ? (
                        <ZionaLogo size={24} colorScheme="signature" theme="light" />
                    ) : (
                        <div className="hospital-name !text-slate-900 !text-sm">{hospitalName}</div>
                    )}
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Digital ID</div>
                </div>
                <div className="content">
                    <div className="info">
                        <div className="patient-name">{patientData.name}</div>
                        <div className="patient-id">ID: {patient.patient_number}</div>
                        <div className="details">
                            {patientData.phone && <div>📞 {patientData.phone}</div>}
                            {patientData.dob && <div>🎂 DOB: {patientData.dob}</div>}
                            {patientData.gender && <div>⚥ {patientData.gender.toUpperCase()}</div>}
                            {patientData.blood && <div>🩸 {patientData.blood}</div>}
                        </div>
                    </div>
                    <div className="qr-section">
                        <QRCodeSVG
                            value={JSON.stringify(patientData)}
                            size={80}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>
                <div className="footer">
                    Scan QR code for instant patient verification • Emergency Contact: {patientData.phone || 'N/A'}
                </div>
            </div>

            {/* Print Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
                <button
                    onClick={handlePrint}
                    className="px-6 py-3 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                    🪪 Print ID Card
                </button>
            </div>
        </div>
    )
}
