"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Package,
    ArrowRightLeft,
    Truck,
    Settings,
    Users,
    Download,
    FileText
} from "lucide-react"

// Hardcoded for now until we fully switch to dynamic sidebar everywhere
// or this component is replaced by the main app sidebar. 
// But let's show both sections.

const inventoryItems = [
    { title: "Command Center", href: "/hms/inventory", icon: LayoutDashboard },
    { title: "Products", href: "/hms/inventory/products", icon: Package },
    { title: "Receive Stock", href: "/hms/purchasing/receipts/new", icon: Download },
    // { title: "Stock Moves", href: "/hms/inventory/moves", icon: ArrowRightLeft }, // Hidden until impl
    // { title: "Configuration", href: "/hms/inventory/settings", icon: Settings } // Hidden until impl
]

const purchasingItems = [
    { title: "Suppliers", href: "/hms/inventory/suppliers", icon: Users },
    // Add POs when ready
    // { title: "Purchase Orders", href: "/hms/inventory/po", icon: Truck },
]

export function InventorySidebar() {
    const pathname = usePathname()

    const [isOpen, setIsOpen] = useState(false)

    // Helper to close on navigation
    // Since this is client component, we can watch pathname changes? 
    // Effect might be overkill, let's just use onClick in Links.

    // Sidebar Content Component to reuse
    const Content = () => (
        <div className="p-4 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold tracking-tight text-foreground/90 mb-4 px-2">
                Inventory
            </h2>
            <div className="space-y-1 mb-6">
                {inventoryItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            pathname === item.href
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
                {/* Stock Moves (Uncommented) */}
                <Link
                    href="/hms/inventory/moves"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                        pathname === "/hms/inventory/moves"
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground"
                    )}
                >
                    <ArrowRightLeft className="h-4 w-4" />
                    Stock Moves
                </Link>
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-foreground/90 mb-4 px-2 border-t pt-4">
                Masters
            </h2>
            <div className="space-y-1 mb-6">
                <Link
                    href="/hms/inventory/categories"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                        pathname === "/hms/inventory/categories"
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Categories
                </Link>
                <Link
                    href="/hms/inventory/uom"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                        pathname === "/hms/inventory/uom"
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Units (UOM)
                </Link>
                <Link
                    href="/hms/inventory/manufacturers"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                        pathname === "/hms/inventory/manufacturers"
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Manufacturers
                </Link>
                <Link
                    href="/hms/inventory/locations"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                        pathname === "/hms/inventory/locations"
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Godowns (Stores)
                </Link>
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-foreground/90 mb-4 px-2 border-t pt-4">
                Purchasing
            </h2>
            <div className="space-y-1">
                {purchasingItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            pathname === item.href
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
                <h2 className="text-lg font-semibold tracking-tight text-foreground/90 mb-4 px-2 border-t pt-4">
                    Reports
                </h2>
                <div className="space-y-1 mb-6">
                    <Link
                        href="/hms/inventory/reports/stock"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            pathname === "/hms/inventory/reports/stock"
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "text-muted-foreground"
                        )}
                    >
                        <FileText className="h-4 w-4" />
                        Stock Report
                    </Link>
                    <Link
                        href="/hms/inventory/reports/ageing"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            pathname === "/hms/inventory/reports/ageing"
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "text-muted-foreground"
                        )}
                    >
                        <FileText className="h-4 w-4" />
                        Stock Ageing
                    </Link>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop: Static Sidebar */}
            <div className="w-64 border-r bg-card h-[calc(100vh-4rem)] hidden md:block overflow-y-auto">
                <Content />
            </div>

            {/* Mobile: Toggle & Drawer */}
            <div className="md:hidden">
                {/* Floating Toggle or Header Strip? 
                    Inventory Layout is flex row. If sidebar is hidden, content expands.
                    We should probably inject a 'Menu' button if valid? 
                    Or just fixed toggle? 
                    Let's utilize a fixed button bottom-right or top-right? 
                    Or top bar in content? Layout.tsx handles content.
                    Since this component is IN the layout, we can render the toggle here.
                 */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-12 w-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-primary/90"
                >
                    <Settings className="h-6 w-6" />
                </button>

                {/* Drawer Overlay */}
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                        <aside className="relative w-72 max-w-xs bg-background border-r flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                            <Content />
                        </aside>
                    </div>
                )}
            </div>
        </>
    )
}
