"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Home, DoorOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Room {
  number: number
  isCheckingOut: boolean
  isOccupied: boolean
}

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  selectedRoom?: number
  onRoomSelect?: (roomNumber: number) => void
}

export function Sidebar({ activeSection, onSectionChange, selectedRoom, onRoomSelect }: SidebarProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>(activeSection)

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value)
    onSectionChange(value)
  }

  // Generate rooms 101-129 excluding 113
  const rooms: Room[] = []
  for (let i = 101; i <= 129; i++) {
    if (i === 113) continue

    // Mock data - some rooms are checking out (red), others are staying (green)
    const isCheckingOut = [103, 107, 110, 115, 116, 123].includes(i)

    rooms.push({
      number: i,
      isCheckingOut,
      isOccupied: true,
    })
  }

  return (
    <div className="w-64 bg-gray-300 h-screen border-r border-gray-400 flex flex-col">
      {/* Department Selection */}
      <div className="p-4 border-b border-gray-400">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Reparto</h3>
        <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Seleziona reparto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="camere">Camere</SelectItem>
            <SelectItem value="sala">Sala</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Room List - only show when camere is selected */}
      {activeSection === "camere" && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {rooms.map((room) => (
              <div
                key={room.number}
                onClick={() => onRoomSelect?.(room.number)}
                className={cn(
                  "flex items-center justify-between p-3 rounded cursor-pointer text-sm font-medium border",
                  selectedRoom === room.number
                    ? "bg-cyan-400 text-white border-cyan-500"
                    : "bg-white hover:bg-gray-50 border-gray-200",
                )}
              >
                <span className="font-medium">{room.number}</span>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    room.isCheckingOut ? "bg-red-500" : "bg-green-500",
                  )}
                >
                  {room.isCheckingOut ? (
                    <DoorOpen className="w-3 h-3 text-white" />
                  ) : (
                    <Home className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
