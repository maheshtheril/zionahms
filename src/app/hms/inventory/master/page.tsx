import { redirect } from "next/navigation";

export default async function InventoryMasterRedirect() {
    redirect("/hms/inventory/products");
}
