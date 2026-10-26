import { LiveTokenTVDisplay } from '@/components/realtime/live-token-tv-display'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'OPD Live Waiting Room Display | Ziona HMS',
    description: 'Real-time hospital token queue and consultation room calling display'
}

export default function QueueTVPage() {
    return <LiveTokenTVDisplay hospitalName="Outpatient Department" />
}
