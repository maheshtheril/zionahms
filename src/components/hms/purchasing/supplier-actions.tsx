'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Power, Eye } from 'lucide-react';
import { deleteSupplier, updateSupplier } from '@/app/actions/purchase';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SupplierDialog } from './supplier-dialog';
import { useRouter } from 'next/navigation';

interface SupplierActionsProps {
    supplier: any; // Full supplier object
}

export function SupplierActions({ supplier }: SupplierActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const router = useRouter();

    const isActive = supplier.is_active;

    const handleToggleStatus = async () => {
        setLoading(true);
        try {
            const result = await updateSupplier(supplier.id, { is_active: !isActive });
            if (result.success) {
                toast.success("Success", { description: `Supplier ${isActive ? 'deactivated' : 'activated'} successfully` });
                router.refresh();
            } else {
                toast.error("Error", { description: result.error });
            }
        } catch (error) {
            toast.error("Error", { description: "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) return;

        setLoading(true);
        try {
            const result = await deleteSupplier(supplier.id);
            if (result.success) {
                toast.success("Success", { description: "Supplier deleted successfully" });
                router.refresh();
            } else {
                toast.error("Error", { description: result.error });
            }
        } catch (error) {
            toast.error("Error", { description: "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(supplier.id)}
                    >
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleStatus} disabled={loading}>
                        <Power className={`mr-2 h-4 w-4 ${isActive ? 'text-red-500' : 'text-green-500'}`} />
                        {isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={loading}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showEditDialog && (
                <SupplierDialog
                    isOpen={showEditDialog}
                    onClose={() => setShowEditDialog(false)}
                    onSuccess={() => {
                        setShowEditDialog(false);
                        router.refresh();
                        toast.success("Success", { description: "Supplier updated successfully" });
                    }}
                    initialData={supplier}
                />
            )}
        </>
    );
}
