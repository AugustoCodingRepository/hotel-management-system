"use client"

import { useState, useEffect } from "react"

interface Room {
  number: number
  status: "libera" | "occupata" | "pulizie" | "manutenzione"
  customer?: string
  checkIn?: string
  checkOut?: string
  adults?: number
  children?: number
}

interface RoomListProps {
  selectedRoom?: number
  onRoomSelect?: (roomNumber: number) => void
}

export function RoomList({ selectedRoom, onRoomSelect }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    // Simula il caricamento delle camere
    const mockRooms: Room[] = []
    for (let i = 101; i <= 120; i++) {
      const random = Math.random()
      let status: Room["status"] = "libera"
      let customer = undefined
      let checkIn = undefined
      let checkOut = undefined
      let adults = undefined
      let children = undefined

      if (random > 0.7) {
        status = "occupata"
        customer = `Cliente ${i}`
        checkIn = "2025-01-27"
        checkOut = "2025-01-29"
        adults = Math.floor(Math.random() * 3) + 1
        children = Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0
      } else if (random > 0.85) {
        status = "pulizie"
      } else if (random > 0.95) {
        status = "manutenzione"
      }

      mockRooms.push({
        number: i,
        status,
        customer,
        checkIn,
        checkOut,
        adults,
        children,
      })
    }
    setRooms(mockRooms)
  }, [])

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "libera":
        return "bg-green-100 border-green-300 text-green-800"
      case "occupata":
        return "bg-red-100 border-red-300 text-red-800"
      case "pulizie":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "manutenzione":
        return "bg-gray-100 border-gray-300 text-gray-800"
      default:
        return "bg-white border-gray-300 text-gray-800"
    }
  }

  const getStatusText = (status: Room["status"]) => {
    switch (status) {
      case "libera":
        return "Libera"
      case "occupata":
        return "Occupata"
      case "pulizie":
        return "Pulizie"
      case "manutenzione":
        return "Manutenzione"
      default:
        return "Sconosciuto"
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Camere</h3>
      <div className="space-y-2">
        {rooms.map((room) => (
          <button
            key={room.number}
            onClick={() => onRoomSelect?.(room.number)}
            className={`
              w-full p-3 rounded-lg border-2 text-left transition-all duration-200
              ${
                selectedRoom === room.number
                  ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                  : `${getStatusColor(room.status)} hover:shadow-md`
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-lg">{room.number}</div>
                <div className={`text-xs ${selectedRoom === room.number ? "text-blue-100" : "opacity-75"}`}>
                  {getStatusText(room.status)}
                </div>
                {room.customer && (
                  <div className={`text-xs mt-1 ${selectedRoom === room.number ? "text-blue-100" : "opacity-75"}`}>
                    {room.customer}
                  </div>
                )}
              </div>
              {room.adults && (
                <div className={`text-xs ${selectedRoom === room.number ? "text-blue-100" : "opacity-75"}`}>
                  {room.adults}
                  {room.children ? `+${room.children}` : ""}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
