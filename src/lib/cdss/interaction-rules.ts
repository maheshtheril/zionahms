export type AlertSeverity = 'CRITICAL' | 'MODERATE' | 'INFO'
export type AlertCategory = 'DRUG_DRUG' | 'DRUG_ALLERGY' | 'DUPLICATE_THERAPY' | 'DOSE_ADVISORY'

export interface ClinicalRule {
    drugA: string // Generic / Root drug name or class
    drugB: string // Interacting generic or root drug
    severity: AlertSeverity
    category: AlertCategory
    title: string
    mechanism: string
    recommendation: string
    evidenceLevel: 'Level 1 (Established)' | 'Level 2 (Probable)' | 'Level 3 (Suspected)'
}

export interface AllergyClassRule {
    allergyKeyword: string
    medicationKeywords: string[]
    severity: AlertSeverity
    title: string
    mechanism: string
    recommendation: string
}

/**
 * Standard International Pharmacotherapy Interaction Rules (WHO / FDA / BNF Standard)
 */
export const CLINICAL_INTERACTION_RULES: ClinicalRule[] = [
    {
        drugA: 'warfarin',
        drugB: 'aspirin',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Severe Hemorrhage / Bleeding Hazard',
        mechanism: 'Concurrent use of Warfarin (Vitamin K antagonist) and Aspirin (antiplatelet) produces profound synergistic bleeding risk and mucosal ulceration.',
        recommendation: 'Avoid combination unless specifically indicated in mechanical valve or dual anti-thrombotic protocols. Monitor INR frequently and co-prescribe gastroprotection (PPI).',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'warfarin',
        drugB: 'ibuprofen',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Severe GI Bleed & Anticoagulant Potentiation',
        mechanism: 'NSAIDs displace warfarin from plasma proteins and cause gastric mucosal erosions, dramatically multiplying major GI bleeding risk.',
        recommendation: 'Absolute contraindication for routine pain/fever. Substitute with Acetaminophen/Paracetamol.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'sildenafil',
        drugB: 'nitroglycerin',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Fatal Hypotension / Hemodynamic Collapse',
        mechanism: 'PDE-5 inhibitors and organic nitrates potentiate cGMP-mediated vasodilation, resulting in severe, refractory arterial hypotension and myocardial ischemia.',
        recommendation: 'Contraindicated. Do not administer nitrates within 24 hours of Sildenafil or 48 hours of Tadalafil.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'tadalafil',
        drugB: 'isosorbide',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Fatal Hypotension & Cardiovascular Collapse',
        mechanism: 'Potentiated nitric oxide/cGMP pathway triggers catastrophic drop in systemic vascular resistance.',
        recommendation: 'Strictly contraindicated. Seek alternative antianginal therapy.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'lisinopril',
        drugB: 'spironolactone',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Life-Threatening Hyperkalemia Risk',
        mechanism: 'Concurrent ACE inhibitor and aldosterone receptor antagonist both inhibit renal potassium excretion, inducing cardiac arrhythmias.',
        recommendation: 'Check serum potassium and creatinine before initiating. Monitor electrolyte panel within 5-7 days.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'tramadol',
        drugB: 'fluoxetine',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Severe Serotonin Syndrome & Seizure Risk',
        mechanism: 'Dual serotonergic mechanism and CYP2D6 inhibition elevates systemic serotonin levels, leading to hyperthermia, tremor, and seizures.',
        recommendation: 'Avoid co-administration. Choose non-serotonergic opioid (e.g. low-dose oxycodone) or alternate analgesic.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'methotrexate',
        drugB: 'ibuprofen',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Severe Methotrexate Toxicity & Pancytopenia',
        mechanism: 'NSAIDs decrease renal tubular secretion of Methotrexate, causing toxic blood levels, bone marrow suppression, and acute renal failure.',
        recommendation: 'Strictly avoid with high-dose methotrexate. In low-dose rheumatic therapy, monitor CBC and liver/renal function closely.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'simvastatin',
        drugB: 'clarithromycin',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Severe Rhabdomyolysis & Acute Renal Failure',
        mechanism: 'Clarithromycin is a potent CYP3A4 inhibitor that increases simvastatin AUC up to 10-fold, causing myopathy and muscle breakdown.',
        recommendation: 'Temporarily suspend Simvastatin during macrolide antibiotic course, or prescribe Azithromycin (non-CYP3A4 inhibitor).',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'clopidogrel',
        drugB: 'omeprazole',
        severity: 'MODERATE',
        category: 'DRUG_DRUG',
        title: 'Reduced Antiplatelet Efficacy (Stent Risk)',
        mechanism: 'Omeprazole competitively inhibits CYP2C19, impeding bioactivation of Clopidogrel into its active antiplatelet thiol metabolite.',
        recommendation: 'Consider Pantoprazole or Rabeprazole, which exhibit significantly less CYP2C19 inhibition.',
        evidenceLevel: 'Level 2 (Probable)'
    },
    {
        drugA: 'ciprofloxacin',
        drugB: 'calcium',
        severity: 'MODERATE',
        category: 'DRUG_DRUG',
        title: 'Impaired Fluoroquinolone Chelation / Absorption',
        mechanism: 'Polyvalent cations form insoluble chelates with fluoroquinolones, cutting antibiotic bioavailability by up to 70%.',
        recommendation: 'Space administration: Take Ciprofloxacin 2 hours before or 6 hours after calcium, antacids, or iron supplements.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'metformin',
        drugB: 'contrast',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Contrast-Induced Lactic Acidosis',
        mechanism: 'Radiocontrast nephropathy can cause acute metformin accumulation leading to fatal lactic acidosis.',
        recommendation: 'Withhold Metformin at time of iodinated imaging procedure and for 48 hours post-procedure until eGFR confirms normal renal function.',
        evidenceLevel: 'Level 1 (Established)'
    },
    {
        drugA: 'digoxin',
        drugB: 'amiodarone',
        severity: 'CRITICAL',
        category: 'DRUG_DRUG',
        title: 'Severe Digitalis Toxicity & Heart Block',
        mechanism: 'Amiodarone inhibits P-glycoprotein-mediated renal and biliary clearance of Digoxin, doubling serum digoxin levels.',
        recommendation: 'Reduce Digoxin maintenance dose by 50% when initiating Amiodarone. Monitor serum digoxin concentrations and ECG.',
        evidenceLevel: 'Level 1 (Established)'
    }
]

/**
 * Standard Drug Allergy Cross-Reactivity Definitions
 */
export const ALLERGY_CLASS_RULES: AllergyClassRule[] = [
    {
        allergyKeyword: 'penicillin',
        medicationKeywords: [
            'penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'piperacillin',
            'ticarcillin', 'oxacillin', 'cloxacillin', 'cephalexin', 'cefuroxime',
            'ceftriaxone', 'cefepime', 'meropenem', 'imipenem'
        ],
        severity: 'CRITICAL',
        title: 'Beta-Lactam / Penicillin Cross-Reactivity Warning',
        mechanism: 'Patient has a documented Penicillin hypersensitivity. Prescribed medication shares beta-lactam core structure carrying anaphylaxis cross-reactivity risk.',
        recommendation: 'Avoid beta-lactam antibiotics. Consider Macrolides (Azithromycin), Fluoroquinolones, or Vancomycin/Clindamycin depending on culture sensitivity.'
    },
    {
        allergyKeyword: 'sulfa',
        medicationKeywords: [
            'sulfa', 'sulfamethoxazole', 'bactrim', 'septra', 'cotrimoxazole',
            'sulfadiazine', 'sulfasalazine', 'zonisamide'
        ],
        severity: 'CRITICAL',
        title: 'Sulfonamide Severe Allergic Reaction Alert',
        mechanism: 'Patient has a reported Sulfa allergy. Prescribed drug contains sulfonamide arylamine group with risk of Stevens-Johnson Syndrome (SJS) / Toxic Epidermal Necrolysis (TEN).',
        recommendation: 'Contraindicated. Prescribe non-sulfonamide antimicrobial alternative.'
    },
    {
        allergyKeyword: 'aspirin',
        medicationKeywords: [
            'aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac',
            'indomethacin', 'meloxicam', 'celecoxib', 'etoricoxib'
        ],
        severity: 'CRITICAL',
        title: 'NSAID / Aspirin Induced Bronchospasm & Anaphylaxis Risk',
        mechanism: 'Cross-reactive cyclooxygenase-1 (COX-1) inhibition can trigger life-threatening bronchospasm in aspirin-exacerbated respiratory disease (AERD).',
        recommendation: 'Avoid all conventional NSAIDs. Use Acetaminophen/Paracetamol for mild pain or consult allergy specialist.'
    },
    {
        allergyKeyword: 'opioid',
        medicationKeywords: [
            'morphine', 'codeine', 'tramadol', 'fentanyl', 'oxycodone',
            'hydrocodone', 'buprenorphine', 'methadone'
        ],
        severity: 'CRITICAL',
        title: 'Opioid Hypersensitivity Alert',
        mechanism: 'Patient has documented opioid allergy. Administering opioids carries risk of severe histamine release or true IgE-mediated anaphylaxis.',
        recommendation: 'Avoid opioid analgesics. Employ multimodal non-opioid pain strategies (e.g. Paracetamol, Nerve block, Gabapentinoids).'
    }
]
