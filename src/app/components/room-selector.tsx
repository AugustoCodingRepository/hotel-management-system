"use client"

import { useState, useEffect } from "react"
import { Home, DoorOpen, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

interface Room {
  number: number
  hasAccount: boolean
  status: string
  checkOut?: string
  customer?: string
}

interface RoomSelectorProps {
  selectedRoom: number
  onRoomSelect: (roomNumber: number) => void
  activeSection: string
  onSectionChange: (section: string) => void
}

export function RoomSelector({ selectedRoom, onRoomSelect, activeSection, onSectionChange }: RoomSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRooms()

    // Ascolta i cambiamenti dei dati delle camere
    const handleRoomDataChanged = (event: CustomEvent) => {
      const { roomNumber, checkOut, hasData, customer } = event.detail
      console.log(`🔔 Room ${roomNumber} data changed: customer=${customer}, checkOut=${checkOut}, hasData=${hasData}`)
      updateRoomStatus(roomNumber, checkOut, hasData, customer)
    }

    window.addEventListener("roomDataChanged", handleRoomDataChanged as EventListener)

    // Ricarica periodicamente per sincronizzare con il database
    const interval = setInterval(() => {
      console.log("🔄 Periodic room status refresh")
      loadRooms()
    }, 30000) // Ogni 30 secondi

    return () => {
      window.removeEventListener("roomDataChanged", handleRoomDataChanged as EventListener)
      clearInterval(interval)
    }
  }, [])

  const updateRoomStatus = (roomNumber: number, checkOut: string, hasData: boolean, customer?: string) => {
    setRooms((prevRooms) => {
      return prevRooms.map((room) => {
        if (room.number === roomNumber) {
          const today = new Date().toLocaleDateString("it-IT")
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          const tomorrowStr = tomorrow.toLocaleDateString("it-IT")

          let newStatus = "available"
          if (hasData) {
            const isCheckingOutSoon = checkOut === today || checkOut === tomorrowStr
            newStatus = isCheckingOutSoon ? "checking_out" : "occupied"
          }

          console.log(`🔄 Updated room ${roomNumber}: ${room.customer || "empty"} → ${customer || "empty"}, status: ${room.status} → ${newStatus}`)

          return {
            ...room,
            hasAccount: hasData,
            status: newStatus,
            checkOut,
            customer: customer || "", // Aggiorna il nome del cliente
          }
        }
        return room
      })
    })
  }

  const loadRooms = async () => {
    setIsLoading(true)
    try {
      const allRooms: Room[] = []
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const todayStr = today.toLocaleDateString("it-IT")
      const tomorrowStr = tomorrow.toLocaleDateString("it-IT")

      console.log(`📅 Loading rooms - Today: ${todayStr}, Tomorrow: ${tomorrowStr}`)

      // Carica tutte le camere in parallelo per performance migliori
      const roomPromises = []
      for (let i = 101; i <= 129; i++) {
        if (i === 113) continue
        roomPromises.push(loadSingleRoom(i, todayStr, tomorrowStr))
      }

      const roomResults = await Promise.all(roomPromises)
      allRooms.push(...roomResults)

      setRooms(allRooms)
      console.log(`✅ Loaded ${allRooms.length} rooms`)
      
      // Log delle camere con clienti
      const occupiedRooms = allRooms.filter(r => r.customer)
      console.log(`👥 Rooms with customers:`, occupiedRooms.map(r => `${r.number}: ${r.customer}`))
      
    } catch (error) {
      console.error("Errore nel caricamento delle camere:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSingleRoom = async (roomNumber: number, todayStr: string, tomorrowStr: string): Promise<Room> => {
    let status = "available"
    let hasAccount = false
    let checkOut = ""
    let customer = ""

    try {
      const response = await fetch(`/api/room-accounts/${roomNumber}`)

      if (response.ok) {
        const account = await response.json()
        console.log(`📊 Room ${roomNumber} account:`, {
          customer: account.customer,
          checkOut: account.checkOut,
          hasServices: Object.keys(account.services?.camera || {}).length > 0
        })

        // Un account è considerato attivo se ha un cliente O servizi nella tabella
        const hasCustomer = account.customer && account.customer.trim() !== ""
        const hasServices = Object.keys(account.services?.camera || {}).length > 0
        
        if (hasCustomer || hasServices) {
          hasAccount = true
          checkOut = account.checkOut
          customer = account.customer || ""

          const isCheckingOutSoon = checkOut === todayStr || checkOut === tomorrowStr
          status = isCheckingOutSoon ? "checking_out" : "occupied"

          console.log(`✅ Room ${roomNumber}: ${customer || "No name"}, checkout ${checkOut}, status: ${status}`)
        } else {
          status = "available"
          console.log(`ℹ️ Room ${roomNumber}: Empty account, considered available`)
        }
      } else if (response.status === 404) {
        status = "available"
        console.log(`ℹ️ Room ${roomNumber}: No account found`)
      } else {
        console.error(`❌ Room ${roomNumber}: HTTP ${response.status}`)
        status = "available"
      }
    } catch (error) {
      console.error(`❌ Room ${roomNumber}: Error loading`, error)
      status = "available"
    }

    return {
      number: roomNumber,
      hasAccount,
      status,
      checkOut,
      customer,
    }
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-300 h-screen border-r border-gray-400 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Caricamento camere...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-300 h-screen border-r border-gray-400 flex flex-col">
      {/* Header con Dropdown */}
      <div className="p-4 border-b border-gray-400">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Reparto</h3>
        <Select value={activeSection} onValueChange={onSectionChange}>
          <SelectTrigger className="w-full bg-white mb-3">
            <SelectValue placeholder="Seleziona reparto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="camere">Camere</SelectItem>
            <SelectItem value="sala">Sala</SelectItem>
          </SelectContent>
        </Select>
        {activeSection === "camere" && (
          <div className="text-xs text-gray-600">
            <p>{rooms.length} camere disponibili</p>
            <p>Occupate: {rooms.filter((r) => r.status === "occupied").length}</p>
            <p>In partenza: {rooms.filter((r) => r.status === "checking_out").length}</p>
            <p>Con clienti: {rooms.filter((r) => r.customer).length}</p>
          </div>
        )}
      </div>

      {/* Room List - solo quando è selezionato "camere" */}
      {activeSection === "camere" && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {rooms.map((room) => (
              <div
                key={room.number}
                onClick={() => onRoomSelect(room.number)}
                className={cn(
                  "flex items-center justify-between p-3 rounded cursor-pointer text-sm font-medium border transition-all duration-200",
                  selectedRoom === room.number
                    ? "bg-cyan-400 text-white border-cyan-500 shadow-md"
                    : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300",
                )}
                title={room.customer ? `${room.customer} - Checkout: ${room.checkOut}` : "Camera libera"}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{room.number}</span>
                  {room.customer && (
                    <span className="text-xs opacity-75 truncate max-w-[100px]" title={room.customer}>
                      {room.customer}
                    </span>
                  )}
                  {!room.customer && room.hasAccount && (
                    <span className="text-xs opacity-75 text-orange-600">Servizi</span>
                  )}
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200",
                    room.status === "occupied"
                      ? "bg-green-500"
                      : room.status === "checking_out"
                        ? "bg-red-500"
                        : "bg-gray-400",
                  )}
                >
                  {room.status === "occupied" ? (
                    <Home className="w-3 h-3 text-white" />
                  ) : room.status === "checking_out" ? (
                    <DoorOpen className="w-3 h-3 text-white" />
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messaggio per sezione Sala */}
      {activeSection === "sala" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-sm">Gestione Sala</p>
            <p className="text-xs">Funzionalità in sviluppo</p>
          </div>
        </div>
      )}

      {/* Footer con legenda - solo per camere */}
      {activeSection === "camere" && (
        <div className="p-3 border-t border-gray-400 bg-gray-200">
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <Home className="w-3 h-3 text-green-600" />
              <span>Cliente presente</span>
            </div>
            <div className="flex items-center space-x-2">
              <DoorOpen className="w-3 h-3 text-red-600" />
              <span>Parte oggi/domani</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span>Camera libera</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
