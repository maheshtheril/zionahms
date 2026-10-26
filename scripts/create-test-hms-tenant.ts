import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

async function main() {
    const timestamp = Date.now().toString().slice(-4)
    const hospitalName = process.env.HOSPITAL_NAME || `Apex Royal Hospital ${timestamp}`
    const email = (process.env.ADMIN_EMAIL || `admin.hms${timestamp}@apexroyal.local`).toLowerCase()
    const password = process.env.ADMIN_PASSWORD || 'Hospital@2026'

    console.log(`\n======================================================`)
    console.log(`🏥 CREATING COMPLETE NEW HMS TENANT: ${hospitalName}`)
    console.log(`======================================================\n`)

    const tenantId = crypto.randomUUID()
    const companyId = crypto.randomUUID()
    const branchId = crypto.randomUUID()
    const userId = crypto.randomUUID()
    const doctorId = crypto.randomUUID()

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
        data: {
            id: tenantId,
            name: `${hospitalName} (Tenant)`,
            slug: `apex-royal-${timestamp}`
        }
    })
    console.log(`✔ [1/8] Created Tenant: ${tenant.name} (${tenant.id})`)

    // 2. Create Company
    const company = await prisma.company.create({
        data: {
            id: companyId,
            tenant_id: tenantId,
            name: hospitalName,
            industry: 'Healthcare / Hospital',
            enabled: true,
            metadata: {
                address: '100 Medical Center Blvd',
                phone: '+1-555-0100',
                email: email
            }
        }
    })
    console.log(`✔ [2/8] Created Hospital Company: ${company.name}`)

    // 3. Create Main Clinic Branch
    const branch = await prisma.hms_branch.create({
        data: {
            id: branchId,
            tenant_id: tenantId,
            company_id: companyId,
            name: 'Central Hospital Campus',
            code: 'CENTRAL',
            type: 'hospital',
            is_active: true
        }
    })
    console.log(`✔ [3/8] Created Hospital Facility Branch: ${branch.name}`)

    // 4. Create Admin User
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.app_user.create({
        data: {
            id: userId,
            tenant_id: tenantId,
            company_id: companyId,
            current_branch_id: branchId,
            email: email,
            password: hashedPassword,
            name: 'Dr. Arthur Pendelton, MD',
            role: 'DOCTOR',
            is_admin: true,
            is_active: true
        }
    })
    console.log(`✔ [4/8] Created Physician Administrator: ${user.name} (${user.email})`)

    // 5. Create Clinician Profile for Doctor Cockpit
    const clinician = await prisma.hms_clinicians.create({
        data: {
            id: doctorId,
            tenant_id: tenantId,
            company_id: companyId,
            user_id: userId,
            first_name: 'Arthur',
            last_name: 'Pendelton',
            email: email,
            salutation: 'Dr.',
            specialization: 'Internal Medicine & Cardiology',
            license_no: `MED-REG-${timestamp}`,
            consultation_fee: 500,
            consultation_start_time: '08:00',
            consultation_end_time: '18:00',
            is_active: true
        }
    })
    console.log(`✔ [5/8] Registered Clinician Profile: ${clinician.salutation} ${clinician.first_name} ${clinician.last_name}`)

    // 6. Create Clinical Products & Medicines
    const standardProducts = [
        { sku: 'REG-FEE', name: 'Patient Registration Fee', uom: 'EACH', price: 150, is_service: true, stockable: false },
        { sku: 'CONS-GEN', name: 'General OPD Consultation', uom: 'VISIT', price: 250, is_service: true, stockable: false },
        { sku: 'WARFARIN-5', name: 'Warfarin 5mg Tablet', uom: 'TAB', price: 12, is_service: false, stockable: true },
        { sku: 'ASPIRIN-75', name: 'Aspirin 75mg Tablet', uom: 'TAB', price: 4, is_service: false, stockable: true },
        { sku: 'AMOX-500', name: 'Amoxicillin 500mg Strip', uom: 'STRIP', price: 65, is_service: false, stockable: true },
        { sku: 'PARACETAMOL-500', name: 'Paracetamol 500mg', uom: 'TAB', price: 3, is_service: false, stockable: true },
        { sku: 'CBC-PANEL', name: 'Complete Blood Count (CBC)', uom: 'TEST', price: 350, is_service: true, stockable: false }
    ]

    await prisma.hms_product.createMany({
        data: standardProducts.map(p => ({
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            company_id: companyId,
            sku: p.sku,
            name: p.name,
            is_service: p.is_service,
            is_stockable: p.stockable,
            price: p.price,
            uom: p.uom,
            is_active: true
        }))
    })
    console.log(`✔ [6/8] Seeded 7 Clinical Formulary Products & Tests`)

    // 7. Create Ward & Inpatient Beds
    const wardId = crypto.randomUUID()
    const ward = await prisma.hms_ward.create({
        data: {
            id: wardId,
            tenant_id: tenantId,
            company_id: companyId,
            branch_id: branchId,
            name: 'Executive Medical Ward',
            is_active: true
        }
    })

    const bed1Id = crypto.randomUUID()
    const bed2Id = crypto.randomUUID()
    await prisma.hms_bed.createMany({
        data: [
            { id: bed1Id, tenant_id: tenantId, company_id: companyId, ward_id: wardId, bed_no: 'Bed 301', status: 'available' },
            { id: bed2Id, tenant_id: tenantId, company_id: companyId, ward_id: wardId, bed_no: 'Bed 302', status: 'available' }
        ]
    })
    console.log(`✔ [7/8] Configured Ward "${ward.name}" with 2 Beds`)

    // 8. Create Sample Patient with Vitals & Token Appointment
    const patientId = crypto.randomUUID()
    const patient = await prisma.hms_patient.create({
        data: {
            id: patientId,
            tenant_id: tenantId,
            company_id: companyId,
            patient_number: `MRN-${timestamp}`,
            first_name: 'Eleanor',
            last_name: 'Vance',
            full_name: 'Eleanor Vance',
            gender: 'female',
            dob: new Date('1990-04-15'),
            blood_group: 'O+',
            status: 'active',
            contact: {
                phone: '+1-555-8899',
                email: 'eleanor.vance@example.com',
                address: { street: '42 Baker Street', city: 'Metropolis', country: 'US' }
            },
            metadata: {
                allergies: ['Penicillin']
            }
        }
    })

    // Record initial vitals
    await prisma.hms_vitals.create({
        data: {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            company_id: companyId,
            patient_id: patientId,
            systolic: 124,
            diastolic: 82,
            pulse: 74,
            temperature: 36.8,
            spo2: 99,
            weight: 62.0
        }
    })

    // Book today's appointment with token number 1
    const today = new Date()
    const appointment = await prisma.hms_appointments.create({
        data: {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            company_id: companyId,
            patient_id: patientId,
            clinician_id: doctorId,
            token_number: 1,
            starts_at: today,
            ends_at: new Date(today.getTime() + 30 * 60 * 1000),
            status: 'scheduled',
            type: 'consultation',
            mode: 'in_person',
            notes: 'Routine cardiology follow-up & vitals check'
        }
    })

    console.log(`✔ [8/8] Registered Sample Patient "${patient.full_name}" with Vitals and Token #1\n`)

    console.log(`======================================================`)
    console.log(`🎉 NEW HMS TENANT IS READY FOR FULL TESTING!`)
    console.log(`======================================================`)
    console.log(`🌐 Base URL:           http://localhost:3002`)
    console.log(`🔑 Login Email:        ${email}`)
    console.log(`🔒 Login Password:     ${password}`)
    console.log(`------------------------------------------------------`)
    console.log(`📋 Patient MRN:        ${patient.patient_number}`)
    console.log(`🩺 Doctor Name:        ${clinician.salutation} ${clinician.first_name} ${clinician.last_name}`)
    console.log(`🎟️ Active Token:       #1 (${appointment.notes})`)
    console.log(`⚠️ Documented Allergy: Penicillin (Tests CDSS safety)`)
    console.log(`------------------------------------------------------`)
    console.log(`🔗 DIRECT WORKFLOW URLS:`)
    console.log(`1. Doctor Cockpit:     http://localhost:3002/doctor-cockpit`)
    console.log(`2. Patient Chart:      http://localhost:3002/hms/patients/${patientId}`)
    console.log(`3. Live Waiting TV:    http://localhost:3002/hms/reception/queue-tv`)
    console.log(`4. Inpatient Wards:    http://localhost:3002/hms/wards`)
    console.log(`5. FHIR Patient R4:    http://localhost:3002/api/fhir/v4/Patient/${patientId}/$everything`)
    console.log(`======================================================\n`)
}

main()
    .catch(e => {
        console.error('Failed to create test tenant:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
