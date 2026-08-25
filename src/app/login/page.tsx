
import LoginClient from "./login-client"
import { getTenantBrandingByHost } from "../actions/branding"

export const dynamic = 'force-dynamic'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ org?: string; message?: string }>
}) {
    const params = await searchParams;
    const branding = await getTenantBrandingByHost(params?.org);

    return <LoginClient branding={branding} initialMessage={params?.message} />
}

