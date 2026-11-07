import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { checkPermission } from '@/app/actions/rbac';
import {
  Activity,
  Stethoscope,
  Pill,
  FlaskConical,
  BedDouble,
  FileText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  LogIn,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  HeartPulse,
} from 'lucide-react';

const HOSPITAL_MODULES = [
  {
    icon: Users,
    badge: 'Zero Crowding',
    title: 'Smart Reception, OPD Registration & Live Token Queue',
    desc: 'Register patients in 15 seconds, print UHID barcode cards, and let patients track their live doctor token number on their own mobile phone.',
  },
  {
    icon: Stethoscope,
    badge: 'AI Powered',
    title: 'Doctor Consultation Desk & Handwriting Scanner',
    desc: 'Doctors can type prescriptions in 3 clicks or write on paper — our AI camera reads handwritten prescriptions and sends orders straight to Pharmacy & Lab.',
  },
  {
    icon: BedDouble,
    badge: '24×7 Ward Care',
    title: 'In-Patient (IPD) Beds, Nursing Chart & Discharge Summary',
    desc: 'Visual bed occupancy map across General Ward, Private Rooms, and ICU. Track vitals, nursing medication schedules, doctor rounds, and instant NABH discharge summaries.',
  },
  {
    icon: FlaskConical,
    badge: 'NABL Ready',
    title: 'Pathology Lab (LIS) & Radiology Reporting',
    desc: 'Sample barcode collection, automated normal reference ranges, critical value alerts, pathologist digital signatures, and WhatsApp QR lab reports.',
  },
  {
    icon: Pill,
    badge: 'Zero Expiry Loss',
    title: 'Hospital Pharmacy, Batch & Schedule H/H1 Control',
    desc: 'Live prescriptions appear automatically on the pharmacy counter screen. Track batch numbers, 30/60/90-day near-expiry alerts, and ward medicine indents.',
  },
  {
    icon: FileText,
    badge: 'Complete Finance',
    title: 'Cashless Insurance, TPA, Package Billing & Tally/GST',
    desc: 'Manage surgery packages, advance deposits, insurance pre-authorizations, doctor payout shares, and complete hospital daybook & accounting.',
  },
];

const ROLE_WORKSPACES = [
  {
    role: 'Doctors & Consultants',
    icon: '👨‍⚕️',
    points: [
      '1-click patient history, past lab reports & vitals trend',
      'Voice-to-text clinical notes & AI prescription pad scanner',
      'Custom specialty templates (General, Ortho, Gynec, Pedia, Dental, Eye)',
    ],
  },
  {
    role: 'Front Desk & Reception',
    icon: '🏥',
    points: [
      'Fast UHID registration & Aadhaar/mobile lookup',
      'TV queue display screen + mobile token tracking link',
      'OPD consultation billing, refund control & shift cash handover',
    ],
  },
  {
    role: 'Nurses & Ward Staff',
    icon: '🩺',
    points: [
      'Bed transfer, ICU vitals charting & intake/output logs',
      'Ward medicine indenting & consumable billing',
      'Operation Theatre (OT) scheduling & surgical checklist',
    ],
  },
  {
    role: 'Hospital Management & Owners',
    icon: '📊',
    points: [
      'Live mobile dashboard of daily OPD/IPD revenue & occupancy',
      'Department-wise & doctor-wise revenue share calculation',
      'Strict role permissions & full audit trail of every bill edit',
    ],
  },
];

function ZionaHMSPublicLanding() {
  return (
    <div className="min-h-screen bg-[#060b16] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Festive Deepavali Top Ribbon */}
      <div className="bg-gradient-to-r from-amber-950 via-orange-900 to-amber-950 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-amber-100">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
            🪔 Happy Deepavali from ZionaHMS &amp; ZaayaSoft!
          </span>
          <span className="hidden sm:inline text-amber-200/80">—</span>
          <span>
            Wishing your hospital, doctors, and care teams good health, light, and excellence in patient care.
          </span>
          <Link
            href="/signup"
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-bold text-amber-200 hover:bg-amber-400/30 transition"
          >
            Start Free Hospital Trial <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060b16]/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Ziona<span className="text-cyan-400">HMS</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  by ZaayaSoft
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Complete Hospital, Clinic, Lab &amp; Pharmacy Management System
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#modules" className="hover:text-white transition">
              Hospital Modules
            </a>
            <a href="#departments" className="hover:text-white transition">
              For Every Department
            </a>
            <a href="#how-it-works" className="hover:text-white transition">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Plans
            </a>
          </nav>

          {/* Prominent Hospital / Staff Login & Registration Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2.5 text-sm font-bold text-white transition shadow-sm"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>Hospital / Staff Login</span>
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition"
            >
              <span>Register Hospital</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-[#060b16] to-[#060b16] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 text-xs sm:text-sm font-semibold text-cyan-300 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Trusted by Multi-Specialty Hospitals, Nursing Homes, Polyclinics &amp; Diagnostic Centers</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Run Your Entire Hospital —{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300 bg-clip-text text-transparent">
                From Reception to Discharge
              </span>{" "}
              — in One Connected System.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Connect your <strong className="text-white">OPD Reception</strong>,{" "}
              <strong className="text-white">Doctor Chambers</strong>,{" "}
              <strong className="text-white">In-Patient Wards</strong>,{" "}
              <strong className="text-white">Pharmacy</strong>, and{" "}
              <strong className="text-white">Pathology Lab</strong> effortlessly. Eliminate paper slips, billing leaks, and long patient waiting lines.
            </p>

            {/* Primary CTA Buttons */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 px-7 py-4 text-base font-extrabold shadow-xl transition"
              >
                <LogIn className="w-5 h-5 text-blue-600" />
                <span>Doctor / Staff Login</span>
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-7 py-4 text-base font-extrabold text-slate-950 shadow-xl shadow-cyan-500/25 transition"
              >
                <span>Start Free Hospital Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#modules"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-4 text-base font-semibold text-slate-200 transition"
              >
                <span>Explore All Modules</span>
              </a>
            </div>

            {/* Key Highlights */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">15 Sec</div>
                <div className="text-xs text-slate-400 mt-1">Fast OPD Token Registration</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">AI Rx Scan</div>
                <div className="text-xs text-slate-400 mt-1">Reads Doctor Handwriting</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Live Queue</div>
                <div className="text-xs text-slate-400 mt-1">Patient Mobile Token Tracker</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">NABH / NABL</div>
                <div className="text-xs text-slate-400 mt-1">Ready Clinical Formats</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Hospital Modules */}
      <section id="modules" className="py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              ALL-IN-ONE HEALTHCARE PLATFORM
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Everything Your Hospital Needs Under One Roof
            </h2>
            <p className="mt-3 text-slate-400 text-base sm:text-lg">
              No need to buy separate software for Reception, Lab, Pharmacy, and Accounting. Every department stays synced in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOSPITAL_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="rounded-2xl bg-slate-900/70 border border-white/10 p-6 hover:border-cyan-500/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                        {mod.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{mod.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for Every Role in Your Hospital */}
      <section id="departments" className="py-20 bg-slate-950/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              ROLE-BASED WORKSPACES
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Dedicated Screens for Doctors, Nurses, Reception &amp; Admins
            </h2>
            <p className="mt-3 text-slate-400 text-base">
              When your staff logs in at <Link href="/login" className="text-cyan-400 underline">zionahms.com/login</Link>, ZionaHMS automatically opens their exact department dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLE_WORKSPACES.map((item) => (
              <div
                key={item.role}
                className="rounded-2xl bg-slate-900/80 border border-white/10 p-7"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="text-xl font-bold text-white">{item.role}</h3>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-300">
                  {item.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Patient Flow Works */}
      <section id="how-it-works" className="py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              SMOOTH PATIENT JOURNEY
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              How ZionaHMS Connects Every Step of Care
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-7">
              <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 font-extrabold flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Patient Arrives &amp; Gets Token</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Reception registers the patient by phone number and prints an OPD slip with a QR code. The patient immediately sees their live queue position on their phone.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-7">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Doctor Prescribes or Scans Rx</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The doctor calls the next token with 1 click, records clinical notes or snaps a photo of their handwritten prescription pad, and orders lab tests or medicines.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-7">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Pharmacy, Lab &amp; Final Bill</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Pharmacy and Lab counters receive the doctor&apos;s order automatically — zero missed charges, faster medicine dispensing, and WhatsApp PDF reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="pricing" className="py-20 bg-slate-950/60 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              TRANSPARENT HOSPITAL PLANS
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Flexible Plans for Clinics &amp; Multi-Specialty Hospitals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">Clinic &amp; Polyclinic Edition</h3>
                <p className="mt-2 text-xs text-slate-400">
                  For OPD clinics, day-care centers, dental/eye clinics, and diagnostic centers.
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹1,499</span>
                  <span className="text-slate-400 text-sm">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited OPD Appointments &amp; Token Queue</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Doctor EMR, Prescription Printing &amp; AI Rx Scanner</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Built-in Pharmacy &amp; Lab Reporting</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp Prescription &amp; Bill Sharing</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 py-3.5 text-sm font-bold text-white transition"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-cyan-950/80 to-slate-900/90 border-2 border-cyan-500/60 p-8 flex flex-col justify-between relative shadow-2xl shadow-cyan-500/10">
              <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-1 text-xs font-extrabold text-slate-950">
                🪔 Full Hospital Suite
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Multi-Specialty Hospital ERP</h3>
                <p className="mt-2 text-xs text-cyan-200/80">
                  Complete OPD + IPD Wards + OT + ICU + Pharmacy + Lab + Accounting.
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹3,999</span>
                  <span className="text-slate-400 text-sm">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Everything in Clinic + Unlimited IPD Beds &amp; Wards</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Nursing Station, ICU Charting &amp; OT Management</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Insurance / TPA Billing &amp; Doctor Share Payouts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dedicated Hospital Onboarding &amp; Staff Training</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition"
                >
                  <span>Register Your Hospital Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#04070f] text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-extrabold">
                  Z
                </div>
                <span className="text-lg font-extrabold text-white">ZionaHMS</span>
                <span className="text-xs text-slate-500">by ZaayaSoft Technologies</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 max-w-md">
                Part of the ZaayaSoft Enterprise Ecosystem alongside{" "}
                <a href="https://www.zionapos.store" className="text-cyan-400 hover:underline">
                  ZionaPOS (Retail &amp; Billing)
                </a>{" "}
                and{" "}
                <a href="https://dressupindia.store" className="text-cyan-400 hover:underline">
                  ZionaFashion (Online Boutiques)
                </a>
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-xs font-medium">
              <Link href="/login" className="text-white hover:text-cyan-400 transition">
                Hospital / Staff Login
              </Link>
              <Link href="/signup" className="text-white hover:text-cyan-400 transition">
                Register New Hospital
              </Link>
              <a
                href="https://zaayasoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                ZaayaSoft Corporate ↗
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} ZaayaSoft Technologies. All rights reserved.</p>
            <p>🪔 Wishing all doctors, nurses, and healthcare heroes a joyful Deepavali!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    return <ZionaHMSPublicLanding />;
  }

  // ROLE & PERMISSION BASED REDIRECTS (100% preserved for logged-in hospital users)
  const role = session.user.role?.toLowerCase() || '';

  // 1. Admins should not be auto-redirected to specific functional dashboards (they likely want the Menu)
  if (!session.user.isAdmin && role !== 'admin' && role !== 'super_admin') {

    // 2. Doctor Access
    if (role === 'doctor' || await checkPermission('hms:dashboard:doctor')) {
      redirect('/hms/doctor/dashboard');
    }

    // 3. Nurse Access
    if (role === 'nurse' || await checkPermission('hms:dashboard:nurse')) {
      redirect('/hms/nursing/dashboard');
    }

    // 4. Reception Access
    if (role === 'receptionist' || role.includes('reception') || await checkPermission('hms:dashboard:reception')) {
      redirect('/hms/reception/dashboard');
    }

    // 5. Lab Access
    if (role.includes('lab') || await checkPermission('hms:dashboard:lab')) {
      redirect('/hms/lab/dashboard');
    }

    // 6. Pharmacy Access
    if (role.includes('pharmac') || await checkPermission('hms:dashboard:pharmacy')) {
      redirect('/hms/pharmacy/dashboard');
    }
  }

  console.log('[DEBUG] Root Router:', {
    user: session.user.email,
    tenant: session.user.tenantId,
    sessionFlags: { hms: session.user.hasHMS, crm: session.user.hasCRM }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { tenantId } = session.user as any;
  let industry = '';
  // Check Industry
  if (tenantId) {
    const company = await prisma.company.findFirst({ where: { tenant_id: tenantId } });
    industry = company?.industry || '';
  }

  // Check Active Modules
  const tenantModules = await prisma.tenant_module.findMany({
    where: { tenant_id: tenantId, enabled: true },
    select: { module_key: true }
  });
  const moduleKeys = tenantModules.map(m => m.module_key);

  console.log('[DEBUG] DB Check:', { industry, moduleKeys });

  const isHealthcare = !industry || industry === 'Healthcare' || industry === 'Hospital';
  const hasCRM = moduleKeys.includes('crm');
  const hasHMS = moduleKeys.includes('hms');

  // Decision Logic:
  // Prioritize CRM if explicit, then HMS if explicit.

  // 1. If HMS is present AND User has Access, go HMS.
  if ((hasHMS || isHealthcare) && await checkPermission('hms:view')) {
    redirect('/hms/dashboard');
  }

  // 2. If CRM is present AND User has Access, go CRM.
  if ((hasCRM || !isHealthcare) && await checkPermission('crm:view')) {
    redirect('/crm/dashboard');
  }

  // 3. Fallback based on Industry (Legacy behavior)
  // Only if NO specific module is found in DB.
  if (!hasCRM && !hasHMS) {
    if (isHealthcare) redirect('/hms/dashboard');
  }

  // 4. Default fallback (Safer)
  // If explicitly subscribed modules didn't match permissions above (or were missing), try generic permission checks.

  if (await checkPermission('hms:view')) {
    redirect('/hms/dashboard');
  }

  if (await checkPermission('crm:view')) {
    redirect('/crm/dashboard');
  }

  // 5. Absolute fallback -> Welcome / Home
  redirect('/hms/dashboard');
}
