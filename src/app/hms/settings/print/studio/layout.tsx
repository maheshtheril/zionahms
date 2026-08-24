// This layout intentionally has NO sidebar — Print Studio needs full screen
export default function PrintStudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'white' }}>
            {children}
        </div>
    )
}
