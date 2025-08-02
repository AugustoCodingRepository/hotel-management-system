"use client"

import { Button } from "@/app/components/ui/button"

interface RoomActionsProps {
  notes: string
  onNotesChange: (notes: string) => void
  onCheckInToday: () => void
  onCheckOutTomorrow: () => void
  onAzzeraConto: () => void
  onPrint: () => void
}

export function RoomActions({
  notes,
  onNotesChange,
  onCheckInToday,
  onCheckOutTomorrow,
  onAzzeraConto,
  onPrint,
}: RoomActionsProps) {
  return (
    <div className="w-64 p-4 bg-white border-l border-gray-300 space-y-4">
      <Button onClick={onCheckInToday} className="w-full bg-gray-400 hover:bg-gray-500 text-white rounded-full">
        Check-in oggi
      </Button>

      <Button onClick={onCheckOutTomorrow} className="w-full bg-gray-400 hover:bg-gray-500 text-white rounded-full">
        Check-out domani
      </Button>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Note:</label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded resize-none text-sm"
          placeholder="Inserisci note..."
        />
      </div>

      <Button onClick={onPrint} className="w-full bg-gray-400 hover:bg-gray-500 text-white rounded-full mt-4">
        Stampa
      </Button>

      {/* Pulsante Azzera in rosso */}
      <Button
        onClick={onAzzeraConto}
        className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full mt-4 font-medium"
      >
        Azzera
      </Button>
    </div>
  )
}
