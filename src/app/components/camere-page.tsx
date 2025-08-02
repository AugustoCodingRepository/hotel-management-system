"use client"

import { useState, useRef } from "react"
import { EditableRoomDetails } from "./editable-room-details"
import { RoomActions } from "./room-actions"

export function CamerePage() {
  const [selectedRoom, setSelectedRoom] = useState(107)
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
      <EditableRoomDetails ref={roomDetailsRef} roomNumber={selectedRoom} />
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
