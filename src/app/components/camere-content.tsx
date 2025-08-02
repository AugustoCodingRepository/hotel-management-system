"use client"

import { useRef, useState } from "react"
import { EditableRoomDetailsRealtime } from "@/app/components/editable-room-details-realtime"
import { RoomActions } from "@/app/components/room-actions"

interface CamereContentProps {
  selectedRoom: number
}

export function CamereContent({ selectedRoom }: CamereContentProps) {
  const [notes, setNotes] = useState("")

  const roomDetailsRef = useRef<{
    handleCheckInToday: () => void
    handleCheckOutTomorrow: () => void
    handleAzzeraConto: () => void
    handlePrint: () => void
  }>(null)

  const handleCheckInToday = () => {
    roomDetailsRef.current?.handleCheckInToday()
  }

  const handleCheckOutTomorrow = () => {
    roomDetailsRef.current?.handleCheckOutTomorrow()
  }

  const handleAzzeraConto = () => {
    roomDetailsRef.current?.handleAzzeraConto()
  }

  const handlePrint = () => {
    roomDetailsRef.current?.handlePrint()
  }

  return (
    <div className="flex h-full">
      {/* Dettagli camera */}
      <EditableRoomDetailsRealtime ref={roomDetailsRef} roomNumber={selectedRoom} />

      {/* Azioni camera */}
      <RoomActions
        notes={notes}
        onNotesChange={setNotes}
        onCheckInToday={handleCheckInToday}
        onCheckOutTomorrow={handleCheckOutTomorrow}
        onAzzeraConto={handleAzzeraConto}
        onPrint={handlePrint}
      />
    </div>
  )
}
