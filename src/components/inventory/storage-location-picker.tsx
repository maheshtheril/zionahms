'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react'

interface LocationData {
    id: string;
    name: string;
    type: string;
    parent_id: string | null;
}

interface StorageLocationPickerProps {
    initialZone?: string;
    initialRack?: string;
    initialShelf?: string;
    locations: LocationData[];
    onChange?: (zone: string, rack: string, shelf: string) => void;
}

export function StorageLocationPicker({ 
    initialZone = '', 
    initialRack = '', 
    initialShelf = '', 
    locations = [],
    onChange 
}: StorageLocationPickerProps) {
    
    const [zone, setZone] = useState(initialZone);
    const [rack, setRack] = useState(initialRack);
    const [shelf, setShelf] = useState(initialShelf);

    // Update parent explicitly if needed
    useEffect(() => {
        if (onChange) {
            onChange(zone, rack, shelf);
        }
    }, [zone, rack, shelf, onChange]);

    // Build hierarchical options based on selection
    const zones = Array.from(new Set(locations.filter(l => l.type === 'ZONE').map(l => l.name)));
    
    // Find selected zone id to filter racks
    const selectedZoneObj = locations.find(l => l.type === 'ZONE' && l.name.toLowerCase() === zone.toLowerCase());
    const validRacks = selectedZoneObj 
        ? locations.filter(l => l.type === 'RACK' && l.parent_id === selectedZoneObj.id)
        : locations.filter(l => l.type === 'RACK'); // Show all racks if no zone
    const rackNames = Array.from(new Set(validRacks.map(l => l.name)));

    // Find selected rack id to filter shelves
    const selectedRackObj = validRacks.find(l => l.name.toLowerCase() === rack.toLowerCase());
    const validShelves = selectedRackObj 
        ? locations.filter(l => l.type === 'SHELF' && l.parent_id === selectedRackObj.id)
        : locations.filter(l => l.type === 'SHELF');
    const shelfNames = Array.from(new Set(validShelves.map(l => l.name)));

    return (
        <div className="flex w-full items-center">
            {/* hidden inputs for the form to pick up */}
            <input type="hidden" name="locZone" value={zone} />
            <input type="hidden" name="locRack" value={rack} />
            <input type="hidden" name="locShelf" value={shelf} />
            <input type="hidden" name="storageLocation" value={[zone, rack, shelf].filter(Boolean).join(' | ')} />

            <div className="flex-1 relative group flex items-center bg-gray-50/50 rounded-lg px-2 border border-gray-100 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 tracking-wider select-none">Zone</span>
                <input 
                    type="text" 
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g. Backroom"
                    className="w-full bg-transparent outline-none text-sm font-semibold placeholder:text-gray-300 placeholder:font-normal py-1.5"
                    title="Zone, Room, or Floor"
                    list="zones-list"
                />
                <datalist id="zones-list">
                    {zones.map(z => <option key={z} value={z} />)}
                </datalist>
            </div>

            <div className="flex-1 relative group flex items-center bg-gray-50/50 rounded-lg px-2 border border-gray-100 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 tracking-wider select-none">Rack</span>
                <input 
                    type="text" 
                    value={rack}
                    onChange={(e) => setRack(e.target.value)}
                    placeholder="e.g. A1"
                    className="w-full bg-transparent outline-none text-sm font-semibold placeholder:text-gray-300 placeholder:font-normal py-1.5"
                    title="Rack or Aisle number"
                    list="racks-list"
                />
                <datalist id="racks-list">
                    {rackNames.map(r => <option key={r} value={r} />)}
                </datalist>
            </div>

            <div className="flex-1 relative group flex items-center bg-gray-50/50 rounded-lg px-2 border border-gray-100 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 tracking-wider select-none">Shelf</span>
                <input 
                    type="text" 
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="e.g. 05"
                    className="w-full bg-transparent outline-none text-sm font-semibold placeholder:text-gray-300 placeholder:font-normal py-1.5"
                    title="Shelf or Bin number"
                    list="shelves-list"
                />
                <datalist id="shelves-list">
                    {shelfNames.map(s => <option key={s} value={s} />)}
                </datalist>
            </div>
        </div>
    )
}
