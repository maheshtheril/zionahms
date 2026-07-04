import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            return NextResponse.json({ error: "No company found" });
        }
        
        const companyId = company.id;
        const tenantId = company.tenant_id;

        // 1. Wipe existing tests and panel links
        const existingTests = await prisma.hms_lab_test.findMany({
            where: { company_id: companyId },
            select: { id: true }
        });
        const existingTestIds = existingTests.map(t => t.id);

        if (existingTestIds.length > 0) {
            await prisma.hms_lab_test_panel_member.deleteMany({
                where: { panel_id: { in: existingTestIds } }
            });
            await prisma.hms_lab_test.deleteMany({
                where: { company_id: companyId }
            });
        }

        // 2. Base Individual Tests
        const baseTests = [
            // Biochemistry
            { name: 'Glucose (Fasting)', price: 0, units: 'mg/dL', reference_range: '70 - 110', method: 'Hexokinase' },
            { name: 'Glucose (Post Prandial)', price: 0, units: 'mg/dL', reference_range: '< 140', method: 'Hexokinase' },
            { name: 'Glucose (Random)', price: 0, units: 'mg/dL', reference_range: '70 - 140', method: 'Hexokinase' },
            { name: 'HbA1c', price: 0, units: '%', reference_range: '4.5 - 6.0', method: 'HPLC' },
            { name: 'Blood Urea', price: 0, units: 'mg/dL', reference_range: '15 - 40', method: 'GLDH' },
            { name: 'Serum Creatinine', price: 0, units: 'mg/dL', reference_range: '0.6 - 1.2', method: 'Jaffe' },
            { name: 'Uric Acid', price: 0, units: 'mg/dL', reference_range: '3.4 - 7.0', method: 'Uricase' },
            { name: 'Total Bilirubin', price: 0, units: 'mg/dL', reference_range: '0.2 - 1.2', method: 'Diazo' },
            { name: 'Direct Bilirubin', price: 0, units: 'mg/dL', reference_range: '< 0.3', method: 'Diazo' },
            { name: 'SGOT (AST)', price: 0, units: 'U/L', reference_range: '5 - 40', method: 'IFCC' },
            { name: 'SGPT (ALT)', price: 0, units: 'U/L', reference_range: '7 - 56', method: 'IFCC' },
            { name: 'Alkaline Phosphatase (ALP)', price: 0, units: 'U/L', reference_range: '44 - 147', method: 'IFCC' },
            { name: 'Total Protein', price: 0, units: 'g/dL', reference_range: '6.0 - 8.3', method: 'Biuret' },
            { name: 'Albumin', price: 0, units: 'g/dL', reference_range: '3.5 - 5.0', method: 'BCG' },
            { name: 'Calcium', price: 0, units: 'mg/dL', reference_range: '8.5 - 10.2', method: 'Arsenazo III' },
            { name: 'Phosphorus', price: 0, units: 'mg/dL', reference_range: '2.5 - 4.5', method: 'Molybdate' },
            { name: 'Total Cholesterol', price: 0, units: 'mg/dL', reference_range: '< 200', method: 'CHOD-PAP' },
            { name: 'Triglycerides', price: 0, units: 'mg/dL', reference_range: '< 150', method: 'GPO-PAP' },
            { name: 'HDL Cholesterol', price: 0, units: 'mg/dL', reference_range: '40 - 60', method: 'Direct' },
            { name: 'LDL Cholesterol', price: 0, units: 'mg/dL', reference_range: '< 100', method: 'Calculated' },
            { name: 'Serum Sodium', price: 0, units: 'mEq/L', reference_range: '135 - 145', method: 'ISE' },
            { name: 'Serum Potassium', price: 0, units: 'mEq/L', reference_range: '3.5 - 5.0', method: 'ISE' },
            { name: 'Serum Chloride', price: 0, units: 'mEq/L', reference_range: '96 - 106', method: 'ISE' },

            // Hematology
            { name: 'Hemoglobin', price: 0, units: 'g/dL', reference_range: '12.0 - 16.0', method: 'Cyanmethemoglobin' },
            { name: 'Total RBC Count', price: 0, units: 'millions/cumm', reference_range: '4.5 - 5.5', method: 'Impedance' },
            { name: 'Total WBC Count', price: 0, units: 'cells/cumm', reference_range: '4000 - 11000', method: 'Impedance' },
            { name: 'Neutrophils', price: 0, units: '%', reference_range: '40 - 75', method: 'Microscopy/Automated' },
            { name: 'Lymphocytes', price: 0, units: '%', reference_range: '20 - 45', method: 'Microscopy/Automated' },
            { name: 'Eosinophils', price: 0, units: '%', reference_range: '1 - 6', method: 'Microscopy/Automated' },
            { name: 'Monocytes', price: 0, units: '%', reference_range: '2 - 10', method: 'Microscopy/Automated' },
            { name: 'Basophils', price: 0, units: '%', reference_range: '0 - 1', method: 'Microscopy/Automated' },
            { name: 'Platelet Count', price: 0, units: 'lakhs/cumm', reference_range: '1.5 - 4.5', method: 'Impedance' },
            { name: 'PCV / Hematocrit', price: 0, units: '%', reference_range: '36 - 46', method: 'Calculated' },
            { name: 'MCV', price: 0, units: 'fL', reference_range: '80 - 100', method: 'Calculated' },
            { name: 'MCH', price: 0, units: 'pg', reference_range: '27 - 32', method: 'Calculated' },
            { name: 'MCHC', price: 0, units: 'g/dL', reference_range: '32 - 36', method: 'Calculated' },
            { name: 'ESR', price: 0, units: 'mm/hr', reference_range: '0 - 20', method: 'Westergren' },

            // Thyroid
            { name: 'Total T3', price: 0, units: 'ng/dL', reference_range: '80 - 200', method: 'CLIA' },
            { name: 'Total T4', price: 0, units: 'ug/dL', reference_range: '4.5 - 12.0', method: 'CLIA' },
            { name: 'TSH', price: 0, units: 'uIU/mL', reference_range: '0.4 - 4.0', method: 'CLIA' },

            // Urine
            { name: 'Urine Routine', price: 0, units: 'n/a', reference_range: 'Normal', method: 'Dipstick & Microscopy' },
            { name: 'Urine Microalbumin', price: 0, units: 'mg/L', reference_range: '< 20', method: 'Immunoturbidimetry' },

            // Serology
            { name: 'CRP (Quantitative)', price: 0, units: 'mg/L', reference_range: '< 6.0', method: 'Immunoturbidimetry' },
            { name: 'Rheumatoid Factor', price: 0, units: 'IU/mL', reference_range: '< 14', method: 'Latex Agglutination' },
            { name: 'Widal Test', price: 0, units: 'n/a', reference_range: 'Negative', method: 'Slide Agglutination' },
            { name: 'VDRL', price: 0, units: 'n/a', reference_range: 'Non-Reactive', method: 'Flocculation' },
            { name: 'HBsAg', price: 0, units: 'n/a', reference_range: 'Negative', method: 'Rapid / ELISA' },
            { name: 'HCV Antibodies', price: 0, units: 'n/a', reference_range: 'Negative', method: 'Rapid / ELISA' },
            { name: 'HIV 1 & 2', price: 0, units: 'n/a', reference_range: 'Negative', method: 'Rapid / ELISA' }
        ];

        const insertedTests: any = {};
        for (const test of baseTests) {
            const created = await prisma.hms_lab_test.create({
                data: {
                    ...test,
                    is_panel: false,
                    tenant_id: tenantId,
                    company_id: companyId
                }
            });
            insertedTests[test.name] = created.id;
        }

        // 3. Define Packages (Panels)
        const packages = [
            {
                name: 'Complete Blood Count (CBC)',
                price: 0,
                members: ['Hemoglobin', 'Total RBC Count', 'Total WBC Count', 'Neutrophils', 'Lymphocytes', 'Eosinophils', 'Monocytes', 'Basophils', 'Platelet Count', 'PCV / Hematocrit', 'MCV', 'MCH', 'MCHC']
            },
            {
                name: 'Liver Function Test (LFT)',
                price: 0,
                members: ['Total Bilirubin', 'Direct Bilirubin', 'SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase (ALP)', 'Total Protein', 'Albumin']
            },
            {
                name: 'Renal Function Test (RFT)',
                price: 0,
                members: ['Blood Urea', 'Serum Creatinine', 'Uric Acid', 'Calcium', 'Phosphorus']
            },
            {
                name: 'Lipid Profile',
                price: 0,
                members: ['Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol']
            },
            {
                name: 'Thyroid Profile (TFT)',
                price: 0,
                members: ['Total T3', 'Total T4', 'TSH']
            },
            {
                name: 'Serum Electrolytes',
                price: 0,
                members: ['Serum Sodium', 'Serum Potassium', 'Serum Chloride']
            },
            {
                name: 'Comprehensive Metabolic Panel (CMP)',
                price: 0,
                members: ['Glucose (Fasting)', 'Blood Urea', 'Serum Creatinine', 'Calcium', 'Serum Sodium', 'Serum Potassium', 'Serum Chloride', 'Total Protein', 'Albumin', 'Total Bilirubin', 'SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase (ALP)']
            }
        ];

        for (const pkg of packages) {
            const createdPkg = await prisma.hms_lab_test.create({
                data: {
                    name: pkg.name,
                    price: pkg.price,
                    is_panel: true,
                    tenant_id: tenantId,
                    company_id: companyId,
                    units: 'Package',
                    reference_range: 'Depends on child tests'
                }
            });

            // Link members
            const memberData = pkg.members.map((memberName, index) => {
                const memberId = insertedTests[memberName];
                return {
                    panel_id: createdPkg.id,
                    member_test_id: memberId,
                    ord: index
                };
            }).filter(m => m.member_test_id); // Ensure ID exists

            if (memberData.length > 0) {
                await prisma.hms_lab_test_panel_member.createMany({
                    data: memberData
                });
            }
        }

        return NextResponse.json({ success: true, message: "Catalog seeded successfully" });
    } catch (err: any) {
        console.error("Seeding Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
