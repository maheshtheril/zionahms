'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { globalSearch, SearchResult } from '@/app/actions/global-search'
import { Search, Users, Receipt, Calendar, Stethoscope, X, ArrowRight, Loader2 } from 'lucide-react'

const TYPE_ICONS: Record<string, any> = {
    patient: Users,
    bill: Receipt,
    appointment: Calendar,
    doctor: Stethoscope,
    medicine: Search,
}

const TYPE_COLORS: Record<string, string> = {
    patient: '#4f46e5',
    bill: '#0891b2',
    appointment: '#059669',
    doctor: '#dc2626',
    medicine: '#d97706',
}

const BADGE_BG: Record<string, string> = {
    patient: '#eef2ff',
    bill: '#ecfeff',
    appointment: '#f0fdf4',
    doctor: '#fef2f2',
    medicine: '#fffbeb',
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Open on Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(o => !o)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
            setQuery('')
            setResults([])
            setSelectedIndex(0)
        }
    }, [open])

    // Search on query change
    useEffect(() => {
        if (!query || query.length < 2) { setResults([]); return }
        startTransition(async () => {
            const res = await globalSearch(query)
            setResults(res)
            setSelectedIndex(0)
        })
    }, [query])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
        if (e.key === 'Enter' && results[selectedIndex]) {
            router.push(results[selectedIndex].url)
            setOpen(false)
        }
    }, [results, selectedIndex, router])

    if (!open) return (
        <button
            onClick={() => setOpen(true)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
            }}
            title="Global Search (Ctrl+K)"
        >
            <Search size={14} />
            <span>Search...</span>
            <kbd style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>⌘K</kbd>
        </button>
    )

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
            />
            {/* Modal */}
            <div style={{
                position: 'fixed', top: '12vh', left: '50%', transform: 'translateX(-50%)',
                width: '90vw', maxWidth: 580, zIndex: 9999,
                background: 'white', borderRadius: 16,
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
                overflow: 'hidden', fontFamily: 'Arial, sans-serif',
            }}>
                {/* Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                    {isPending
                        ? <Loader2 size={18} style={{ color: '#4f46e5', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                        : <Search size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    }
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search patients, bills, appointments, doctors..."
                        style={{
                            flex: 1, border: 'none', outline: 'none', fontSize: 15,
                            color: '#0f172a', background: 'transparent', fontFamily: 'inherit',
                        }}
                    />
                    <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                        {results.map((r, i) => {
                            const Icon = TYPE_ICONS[r.type] || Search
                            const color = TYPE_COLORS[r.type] || '#4f46e5'
                            const bgColor = BADGE_BG[r.type] || '#f8fafc'
                            return (
                                <div
                                    key={r.id + r.type}
                                    onClick={() => { router.push(r.url); setOpen(false) }}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                                        cursor: 'pointer', transition: 'background 0.1s',
                                        background: i === selectedIndex ? '#f8fafc' : 'white',
                                        borderBottom: '1px solid #f8fafc',
                                    }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={16} style={{ color }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{r.subtitle}</div>
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color, background: bgColor, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>{r.badge}</div>
                                    {i === selectedIndex && <ArrowRight size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Empty state */}
                {query.length >= 2 && !isPending && results.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                        <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <div style={{ fontSize: 14 }}>No results for &ldquo;{query}&rdquo;</div>
                    </div>
                )}

                {/* Hint */}
                <div style={{ padding: '8px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
                    <span><kbd style={{ padding: '1px 4px', background: '#f1f5f9', borderRadius: 3, border: '1px solid #e2e8f0' }}>↑↓</kbd> Navigate</span>
                    <span><kbd style={{ padding: '1px 4px', background: '#f1f5f9', borderRadius: 3, border: '1px solid #e2e8f0' }}>Enter</kbd> Open</span>
                    <span><kbd style={{ padding: '1px 4px', background: '#f1f5f9', borderRadius: 3, border: '1px solid #e2e8f0' }}>Esc</kbd> Close</span>
                </div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>
    )
}
