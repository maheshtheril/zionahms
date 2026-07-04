'use client'

import { useState, useEffect } from 'react'
import { getProductAvailableUOMs, calculateSalePriceForUOM } from '@/app/actions/product-uom'
import { useLocalization } from "@/contexts/localization-context";

type UOMOption = {
    uom: string
    factor: number
    isBase: boolean
}

type Props = {
    productId: string
    basePrice: number
    defaultQty?: number
    defaultUOM?: string
    onChange: (data: {
        qty: number
        uom: string
        unitPrice: number
        lineTotal: number
        conversionFactor: number
    }) => void
    className?: string
}

/**
 * UOM-Enabled Quantity/Price Selector
 * Automatically calculates price based on selected UOM
 * 
 * Example:
 * - Product: Paracetamol (base: Unit @ {currencySymbol}3)
 * - UOMs: Unit (1x), Strip (15x)
 * - Select "Strip" → Price becomes {currencySymbol}45 (3 × 15)
 * - Select 2 qty → Total = {currencySymbol}90
 */
export function UOMSelector({
    productId,
    basePrice,
    defaultQty = 1,
    defaultUOM,
    onChange,
    className = ''
}: Props) {
    const { currencySymbol } = useLocalization();
    const [uomOptions, setUomOptions] = useState<UOMOption[]>([])
    const [selectedUOM, setSelectedUOM] = useState<string>(defaultUOM || '')
    const [quantity, setQuantity] = useState(defaultQty)
    const [unitPrice, setUnitPrice] = useState(basePrice)
    const [loading, setLoading] = useState(true)

    // Load available UOMs for product
    useEffect(() => {
        if (!productId) return

        const loadUOMs = async () => {
            setLoading(true)
            const result = await getProductAvailableUOMs(productId)

            if (result.success && result.data) {
                setUomOptions(result.data)

                // Set default UOM (either provided or base UOM)
                const defaultOption = defaultUOM
                    ? result.data.find(u => u.uom === defaultUOM)
                    : result.data.find(u => u.isBase)

                if (defaultOption) {
                    setSelectedUOM(defaultOption.uom)
                }
            }
            setLoading(false)
        }

        loadUOMs()
    }, [productId, defaultUOM])

    // Calculate price when UOM changes
    useEffect(() => {
        if (!productId || !selectedUOM) return

        const calculatePrice = async () => {
            const result = await calculateSalePriceForUOM(productId, basePrice, selectedUOM)

            if (result.success && result.price !== undefined) {
                setUnitPrice(result.price)
            } else {
                // Fallback to base price
                setUnitPrice(basePrice)
            }
        }

        calculatePrice()
    }, [productId, selectedUOM, basePrice])

    // Notify parent of changes
    useEffect(() => {
        const currentOption = uomOptions.find(u => u.uom === selectedUOM)
        const lineTotal = quantity * unitPrice

        onChange({
            qty: quantity,
            uom: selectedUOM,
            unitPrice,
            lineTotal,
            conversionFactor: currentOption?.factor || 1
        })
    }, [quantity, selectedUOM, unitPrice])

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
        )
    }

    // If no UOM options (single UOM product), show simple qty input
    if (uomOptions.length <= 1) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-right"
                    placeholder="Qty"
                />
                <span className="text-sm text-gray-500">
                    {uomOptions[0]?.uom || 'Unit'}
                </span>
                <span className="text-sm text-gray-700 font-medium">
                    @ {currencySymbol}{unitPrice.toFixed(2)}
                </span>
            </div>
        )
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Quantity Input */}
            <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-20 px-2 py-1 border rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Qty"
            />

            {/* UOM Selector */}
            <select
                value={selectedUOM}
                onChange={(e) => setSelectedUOM(e.target.value)}
                className="px-3 py-1 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                {uomOptions.map((option) => (
                    <option key={option.uom} value={option.uom}>
                        {option.uom}
                        {!option.isBase && ` (${option.factor}x)`}
                    </option>
                ))}
            </select>

            {/* Price Display */}
            <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">@</span>
                <span className="font-medium text-gray-900">
                    {currencySymbol}{unitPrice.toFixed(2)}
                </span>
            </div>

            {/* Line Total */}
            <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 ml-2">
                <span>=</span>
                <span>{currencySymbol}{(quantity * unitPrice).toFixed(2)}</span>
            </div>

            {/* Conversion Info (if not base UOM) */}
            {uomOptions.find(u => u.uom === selectedUOM && !u.isBase) && (
                <div className="text-xs text-gray-400 ml-1">
                    ({uomOptions.find(u => u.uom === selectedUOM)?.factor}x base)
                </div>
            )}
        </div>
    )
}

/**
 * Simple UOM display for read-only mode
 */
export function UOMDisplay({
    quantity,
    uom,
    unitPrice,
    className = ''
}: {
    quantity: number
    uom: string
    unitPrice: number
    className?: string
}) {
    const { currencySymbol } = useLocalization();
    const total = quantity * unitPrice

    return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
            <span className="font-medium">{quantity}</span>
            <span className="text-gray-500">{uom}</span>
            <span className="text-gray-400">×</span>
            <span>{currencySymbol}{unitPrice.toFixed(2)}</span>
            <span className="text-gray-400">=</span>
            <span className="font-semibold text-blue-600">{currencySymbol}{total.toFixed(2)}</span>
        </div>
    )
}
