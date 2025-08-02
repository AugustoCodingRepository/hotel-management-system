"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"

interface Room {
  number: number
  customer: string
  checkIn: string
  checkOut: string
}

interface AssignToRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableNumber: number
  orderTotal: number
  covers?: number
  onAssigned: () => void
}

export function AssignToRoomDialog({
  open,
  onOpenChange,
  tableNumber,
  orderTotal,
  covers = 0, // Default a 0 se non fornito
  onAssigned,
}: AssignToRoomDialogProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      loadEligibleRooms()
    }
  }, [open])

  const loadEligibleRooms = async () => {
    setLoading(true)
    try {
      console.log("🔍 Loading eligible rooms for assignment...")

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const tomorrowStr = tomorrow.toLocaleDateString("it-IT")

      console.log(`📅 Looking for rooms with check-out >= ${tomorrowStr}`)

      const eligibleRooms: Room[] = []

      // Controlla tutte le camere
      for (let i = 101; i <= 129; i++) {
        if (i === 113) continue // Salta camera 113

        try {
          const response = await fetch(`/api/room-accounts/${i}`)

          if (response.ok) {
            const account = await response.json()

            // Controlla se ha un cliente e se il check-out è domani o dopo
            if (account.customer && account.customer.trim() !== "") {
              const checkOutDate = new Date(account.checkOut.split("/").reverse().join("-"))
              const tomorrowDate = new Date(tomorrow)
              tomorrowDate.setHours(0, 0, 0, 0)
              checkOutDate.setHours(0, 0, 0, 0)

              if (checkOutDate >= tomorrowDate) {
                eligibleRooms.push({
                  number: i,
                  customer: account.customer,
                  checkIn: account.checkIn,
                  checkOut: account.checkOut,
                })
                console.log(`✅ Room ${i}: ${account.customer}, check-out: ${account.checkOut}`)
              } else {
                console.log(`❌ Room ${i}: Check-out too early (${account.checkOut})`)
              }
            }
          }
        } catch (error) {
          console.error(`Error loading room ${i}:`, error)
        }
      }

      setRooms(eligibleRooms)
      console.log(`📊 Found ${eligibleRooms.length} eligible rooms`)
    } catch (error) {
      console.error("Error loading eligible rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoomSelect = (roomNumber: number) => {
    setSelectedRoom(roomNumber)
    setShowConfirmation(true)
  }

  const handleConfirmAssignment = async () => {
    if (!selectedRoom) return

    setAssigning(true)
    try {
      console.log(`🏠 Assigning table ${tableNumber} order to room ${selectedRoom}`)

      // Determina se è lunch o dinner basato sull'orario
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinutes = now.getMinutes()
      const isAfter1830 = currentHour > 18 || (currentHour === 18 && currentMinutes >= 30)
      const mealType = isAfter1830 ? "dinner" : "lunch"

      console.log(`🕐 Current time: ${currentHour}:${currentMinutes.toString().padStart(2, "0")}`)
      console.log(`🍽️ Meal type: ${mealType}`)
      console.log(`👥 Covers: ${covers}`)

      // Ottieni la data corrente in formato italiano
      const operationDate = now.toLocaleDateString("it-IT")
      console.log(`📅 Operation date: ${operationDate}`)

      // Chiama l'API per assegnare l'ordine alla camera
      const response = await fetch(`/api/room-accounts/${selectedRoom}/assign-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber,
          orderTotal,
          mealType,
          operationDate,
          covers,
        }),
      })

      const result = await response.json()
      console.log("API Response:", result)

      if (!response.ok) {
        throw new Error(result.error || `Failed to assign order: ${response.status}`)
      }

      console.log("✅ Order assigned successfully:", result)

      onAssigned()
      onOpenChange(false)
      setShowConfirmation(false)
      setSelectedRoom(null)
    } catch (error) {
      console.error("❌ Error assigning order:", error)
      alert(`Errore nell'assegnazione dell'ordine alla camera: ${error.message}`)
    } finally {
      setAssigning(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedRoom(null)
  }

  // Determina dove verrà assegnato l'ordine
  const getAssignmentDestination = () => {
    if (covers === 0) {
      return "BAR"
    }
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const isAfter1830 = currentHour > 18 || (currentHour === 18 && currentMinutes >= 30)
    return isAfter1830 ? "DINNER" : "LUNCH"
  }

  if (showConfirmation && selectedRoom) {
    const room = rooms.find((r) => r.number === selectedRoom)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Assegnazione</DialogTitle>
            <DialogDescription>STAI ASSEGNANDO L'ORDINE ALLA CAMERA {selectedRoom}, SEI SICURO?</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Camera:</strong> {selectedRoom}
              </p>
              <p>
                <strong>Cliente:</strong> {room?.customer}
              </p>
              <p>
                <strong>Check-in:</strong> {room?.checkIn}
              </p>
              <p>
                <strong>Check-out:</strong> {room?.checkOut}
              </p>
              <p>
                <strong>Totale ordine:</strong> €{orderTotal.toFixed(2)}
              </p>
              <p>
                <strong>Coperti:</strong> {covers}
              </p>
              <p>
                <strong>Sarà aggiunto a:</strong> {getAssignmentDestination()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={assigning}>
              No, Annulla
            </Button>
            <Button onClick={handleConfirmAssignment} disabled={assigning}>
              {assigning ? "Assegnando..." : "Sì, Conferma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assegna Ordine a Camera</DialogTitle>
          <DialogDescription>
            Seleziona la camera a cui assegnare l'ordine del tavolo {tableNumber} (€{orderTotal.toFixed(2)}) - {covers}{" "}
            coperti
            <br />
            <span className="text-sm text-blue-600">Verrà assegnato a: {getAssignmentDestination()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Caricamento camere...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600 mb-2">Nessuna camera disponibile</div>
              <div className="text-sm text-gray-500">Non ci sono camere con check-out da domani in poi</div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid gap-2">
                {rooms.map((room) => (
                  <div
                    key={room.number}
                    onClick={() => handleRoomSelect(room.number)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg">Camera {room.number}</div>
                        <div className="text-gray-600">{room.customer}</div>
                        <div className="text-sm text-gray-500">
                          Check-in: {room.checkIn} • Check-out: {room.checkOut}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Seleziona
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
