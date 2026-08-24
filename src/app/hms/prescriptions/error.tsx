'use client'
import { useEffect } from 'react'
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>{error.message || 'An unexpected error occurred. Please try again.'}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Try Again</button>
          <a href='/hms/dashboard' style={{ padding: '10px 24px', background: '#f1f5f9', color: '#334155', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Dashboard</a>
        </div>
        {error.digest && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 16 }}>Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
