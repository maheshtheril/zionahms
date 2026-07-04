'use client'

import { useState } from "react"
import { ProductForm } from "./product-form"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface EditProductModalProps {
    product: any;
    suppliers: any[];
    taxRates: any[];
    uoms: any[];
    categories: any[];
    manufacturers: any[];
    uomCategories: any[];
    batches?: any[];
    isOpen: boolean;
    onClose: () => void;
}

export function EditProductModal({
    product,
    suppliers,
    taxRates,
    uoms,
    categories,
    manufacturers,
    uomCategories,
    batches = [],
    isOpen,
    onClose
}: EditProductModalProps) {
    const router = useRouter();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[98vw] h-[95vh] flex flex-col p-0 border-none bg-transparent shadow-none focus:outline-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                        Update product details and stock information.
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-white rounded-2xl flex-1 overflow-y-auto shadow-2xl border border-gray-100 p-6 custom-scrollbar">
                    <ProductForm
                        key={product?.id || 'new'}
                        suppliers={suppliers}
                        taxRates={taxRates}
                        uoms={uoms}
                        categories={categories}
                        manufacturers={manufacturers}
                        uomCategories={uomCategories}
                        initialData={product}
                        batches={batches}
                        onSuccess={() => {
                            onClose();
                            router.refresh();
                        }}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
