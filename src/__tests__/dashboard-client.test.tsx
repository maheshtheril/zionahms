import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'

// Mock subcomponents and contexts to keep client unit test completely decoupled from DB
vi.mock('@/components/appointments/appointment-form', () => ({
  AppointmentForm: () => <div data-testid="appointment-form-mock" />
}))

vi.mock('@/components/hms/create-patient-form', () => ({
  CreatePatientForm: () => <div data-testid="create-patient-form-mock" />
}))

vi.mock('@/contexts/localization-context', () => ({
  useLocalization: () => ({ currencySymbol: '$' })
}))

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children }: { children: React.ReactNode }) => {
      return <a>{children}</a>
    }
  }
})

// Mock next-auth
vi.mock('next-auth/react', () => {
  return {
    useSession: () => ({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    }),
  }
})

vi.mock('next-auth', () => ({
  default: () => ({}),
  getServerSession: () => Promise.resolve({ user: { name: 'Test User' } }),
}))

import { DashboardClient } from '../components/hms/dashboard-client'

describe('DashboardClient', () => {
  it('renders stats correctly', () => {
    const mockStats = {
      todayAppointments: 15,
      activePatients: 120,
      totalPatients: 200,
      pendingBills: 5,
      revenue: 45000,
      todayRevenue: 5000
    }
    
    render(<DashboardClient user={{ name: 'Test User' }} stats={mockStats} revenueChart={[]} appointments={[]} patients={[]} doctors={[]} />)
    
    // Check if the titles are present
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument()
    expect(screen.getByText('Total Patients')).toBeInTheDocument()
    expect(screen.getByText('Pending Bills')).toBeInTheDocument()
    
    // Check values
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
