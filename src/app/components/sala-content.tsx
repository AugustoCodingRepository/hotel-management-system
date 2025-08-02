"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { TableManagement } from "./table-management"

interface Table {
  number: number
  isOccupied: boolean
  customers?: number
  order?: string
}

interface SalaContentProps {
  activeSection: string
  onSectionChange: (section: string) => void
  viewingTable: number | null
  onTableSelect: (tableNumber: number | null) => void
}

export function SalaContent({ activeSection, onSectionChange, viewingTable, onTableSelect }: SalaContentProps) {
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [tables, setTables] = useState<Table[]>(() => {
    // Inizializza 40 tavoli
    const initialTables: Table[] = []
    for (let i = 1; i <= 40; i++) {
      initialTables.push({
        number: i,
        isOccupied: Math.random() > 0.7, // Alcuni tavoli occupati casualmente per demo
        customers: Math.random() > 0.7 ? Math.floor(Math.random() * 6) + 1 : undefined,
      })
    }
    return initialTables
  })

  // Se stiamo visualizzando un tavolo specifico, mostra la pagina di gestione
  if (viewingTable) {
    return <TableManagement tableNumber={viewingTable} onBackToSala={() => onTableSelect(null)} />
  }

  const handleTableClick = (tableNumber: number) => {
    setSelectedTable(tableNumber)
    onTableSelect(tableNumber)
    console.log(`🍽️ Selected table ${tableNumber}`)
  }

  const handleAddTable = () => {
    console.log("➕ Add new table clicked")
    // Logica per aggiungere un nuovo tavolo
  }

  const handleChiusura = () => {
    console.log("🔒 Chiusura clicked")
    // Logica per la chiusura giornaliera
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-200">
      {/* Area Tavoli */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Griglia Tavoli */}
          <div className="grid grid-cols-9 gap-4 mb-8">
            {/* Prime 4 righe: 9 tavoli ciascuna */}
            {tables.slice(0, 36).map((table) => (
              <button
                key={table.number}
                onClick={() => handleTableClick(table.number)}
                className={`
                  w-20 h-20 rounded-lg border-2 font-bold text-lg transition-all duration-200
                  ${
                    selectedTable === table.number
                      ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                      : table.isOccupied
                        ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                        : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                  }
                `}
                title={
                  table.isOccupied
                    ? `Tavolo ${table.number} - Occupato${table.customers ? ` (${table.customers} persone)` : ""}`
                    : `Tavolo ${table.number} - Libero`
                }
              >
                {table.number}
                {table.customers && <div className="text-xs mt-1 opacity-75">{table.customers}p</div>}
              </button>
            ))}
          </div>

          {/* Ultima riga: tavoli 37-40 + bottone + */}
          <div className="grid grid-cols-9 gap-4">
            {tables.slice(36, 40).map((table) => (
              <button
                key={table.number}
                onClick={() => handleTableClick(table.number)}
                className={`
                  w-20 h-20 rounded-lg border-2 font-bold text-lg transition-all duration-200
                  ${
                    selectedTable === table.number
                      ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                      : table.isOccupied
                        ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                        : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                  }
                `}
                title={
                  table.isOccupied
                    ? `Tavolo ${table.number} - Occupato${table.customers ? ` (${table.customers} persone)` : ""}`
                    : `Tavolo ${table.number} - Libero`
                }
              >
                {table.number}
                {table.customers && <div className="text-xs mt-1 opacity-75">{table.customers}p</div>}
              </button>
            ))}

            {/* Bottone + per aggiungere tavolo */}
            <button
              onClick={handleAddTable}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-400 text-gray-600 hover:border-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
              title="Aggiungi nuovo tavolo"
            >
              <Plus className="w-8 h-8" />
            </button>

            {/* Spazi vuoti per mantenere l'allineamento */}
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>

      {/* Footer con bottone Chiusura */}
      <div className="bg-white border-t border-gray-300 p-4 flex justify-end">
        <Button
          onClick={handleChiusura}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-lg font-medium"
        >
          CHIUSURA
        </Button>
      </div>
    </div>
  )
}
