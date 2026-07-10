import { getPrintTemplates } from "@/app/actions/print-settings"
import { PrintSettingsClientV2 } from "./print-settings-client"

export default async function PrintSettingsPage() {
    const res = await getPrintTemplates();
    const templates = res.success ? (res.data as any) : {};
    const allTemplates = res.success ? (res as any).all || [] : [];

    return (
        <PrintSettingsClientV2 templates={templates} allTemplates={allTemplates} />
    );
}
