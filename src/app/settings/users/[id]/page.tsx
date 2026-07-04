import { getUser, getHMSRoles, updateUserSystemRole, toggleUserStatus } from "@/app/actions/user"
import HMSRoleSelector from "@/components/hms-role-selector"
import Link from "next/link"
import { ArrowLeft, Mail, User, Shield, Activity, AlertTriangle } from "lucide-react"
import { DeleteUserButton } from "@/components/users/delete-user-button"
import { notFound } from "next/navigation"

export default async function ManageUserPage(props: { params: Promise<any> }) {
    const params = await props.params;
    try {
        const { id } = await params
        const user = await getUser(id)
        const allHMSRoles = await getHMSRoles()

        if (!user) {
            notFound()
        }

        // Debug logging (will show in build logs if access available, or ignore)
        // console.log("User:", user.id, "Roles count:", user.user_roles?.length)

        // Map Core Roles to UI
        const currentHMSRoleIds = (user.user_roles || [])
            .filter(ur => ur.role)
            .map(ur => ur.role!.id)

        return (
            <div className="max-w-4xl mx-auto space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/settings/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manage User</h1>
                        <p className="text-gray-500">{user.full_name || user.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: User Info & System Role */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* User Info Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                                    {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{user.full_name || user.name}</div>
                                    <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    {user.email}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Activity className="h-4 w-4 text-gray-400" />
                                    {user.is_active ? 'Active Account' : 'Inactive Account'}
                                </div>
                            </div>
                        </div>

                        {/* System Role Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-purple-600" />
                                System Access
                            </h3>
                            <form action={updateUserSystemRole} className="space-y-4">
                                <input type="hidden" name="user_id" value={user.id} />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">System Role</label>
                                    <select
                                        name="role"
                                        defaultValue={user.role || 'user'}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="user">User (Standard)</option>
                                        <option value="admin">Admin (Full Access)</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                                    Update System Role
                                </button>
                            </form>
                        </div>

                        {/* Status Toggle */}
                        {/* Only show if not modifying self to prevent lockout - TODO: Add logic for current user check */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-2">Account Status</h3>
                            <p className="text-xs text-gray-500 mb-4">Disable access for this user without deleting their data.</p>
                            <form action={toggleUserStatus.bind(null, user.id, !!user.is_active)}>
                                <button
                                    type="submit"
                                    className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors
                                    ${user.is_active
                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                            : 'border-green-200 text-green-600 hover:bg-green-50'
                                        }`}
                                >
                                    {user.is_active ? 'Deactivate User' : 'Activate User'}
                                </button>
                            </form>
                        </div>
                        <div className="bg-white dark:bg-slate-950 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm p-6 mt-6">
                            <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Permanently delete this user. This action cannot be undone and is only available for users with no associated records.
                            </p>
                            <DeleteUserButton userId={id} userName={user.full_name || user.email} />
                        </div>
                    </div>

                    {/* Right Column: HMS Roles */}
                    <div className="lg:col-span-2 space-y-6">
                        <HMSRoleSelector
                            userId={user.id}
                            allRoles={allHMSRoles}
                            currentRoleIds={currentHMSRoleIds}
                        />
                    </div>
                </div>
            </div>
        )
    } catch (e: any) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-xl font-bold text-red-600">Error Loading User</h1>
                <pre className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded text-left overflow-auto text-sm text-red-500">
                    {e.message}
                    {'\n'}
                    {JSON.stringify(e, null, 2)}
                </pre>
            </div>
        )
    }
}
