"use client"

import { useState, useRef } from "react"
import { EditableRoomDetailsRealtime } from "./editable-room-details-realtime"
import { RoomActions } from "./room-actions"
import { RoomSelector } from "./room-selector"

interface CamerePageFixedProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function CamerePageFixed({ activeSection, onSectionChange }: CamerePageFixedProps) {
  const [selectedRoom, setSelectedRoom] = useState(107) // Camera iniziale
  const [notes, setNotes] = useState("")

  const roomDetailsRef = useRef<{
    handleCheckInToday: () => void
    handleCheckOutTomorrow: () => void
    handleAzzeraConto: () => void
    handlePrint: () => void
  }>(null)

  const handleRoomSelect = (roomNumber: number) => {
    console.log(`🏠 Cambio camera: ${selectedRoom} → ${roomNumber}`)
    setSelectedRoom(roomNumber)
    setNotes("") // Reset notes quando cambi camera
  }

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
      {/* Sidebar con selezione camere */}
      <RoomSelector
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />

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
