
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import EditBranchForm from "./edit-branch-form"

export default async function EditBranchPage(props: { params: Promise<any> }) {
    const params = await props.params;
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const companyId = session.user.companyId
    if (!companyId) redirect('/login')

    const branch = await prisma.hms_branch.findFirst({
        where: {
            id: id,
            company_id: companyId
        }
    })

    if (!branch) notFound()

    return (
        <EditBranchForm branch={branch} />
    )
}
