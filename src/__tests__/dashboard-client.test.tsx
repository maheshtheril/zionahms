import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DashboardClient } from '../components/hms/dashboard-client'

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
    
    render(<DashboardClient stats={mockStats} currencySymbol="₹" revenueChart={[]} appointments={[]} patients={[]} doctors={[]} />)
    
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
