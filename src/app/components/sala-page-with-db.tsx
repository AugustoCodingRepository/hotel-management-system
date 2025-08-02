"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Plus } from "lucide-react"
import type { RestaurantTable } from "@/lib/mongodb-schemas"
import { RealTimeClock } from "./real-time-clock"
import { TableManagement } from "./table-management"

interface SalaPageProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onInventoryClick: () => void
  onBackToHome: () => void
}

export function SalaPageWithDB({ activeSection, onSectionChange, onInventoryClick, onBackToHome }: SalaPageProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [viewingTable, setViewingTable] = useState<number | null>(null)
  const [closingDay, setClosingDay] = useState(false)

  const loadTables = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading tables from database...")

      const response = await fetch("/api/restaurant-tables")
      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Received data:", data)

      if (data.success && data.tables) {
        console.log("✅ Tables loaded successfully:", data.tables.length)
        setTables(data.tables)
      } else {
        console.error("❌ API returned error:", data.error || "Unknown error")
        setError(data.error || "Errore nel caricamento dei tavoli")
      }
    } catch (err) {
      console.error("💥 Error loading tables:", err)
      setError(`Errore di connessione: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addNewTable = async () => {
    try {
      const maxTableNumber = Math.max(...tables.map((t) => t.tableNumber), 0)
      const newTableNumber = maxTableNumber + 1

      const response = await fetch("/api/restaurant-tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber: newTableNumber,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTables((prev) => [...prev, data.table].sort((a, b) => a.tableNumber - b.tableNumber))
      }
    } catch (err) {
      console.error("Error adding new table:", err)
    }
  }

  const handleTableClick = (tableNumber: number) => {
    setSelectedTable(tableNumber)
    setViewingTable(tableNumber)
    console.log(`🍽️ Opening table ${tableNumber} management`)
  }

  const handleBackToSala = () => {
    setViewingTable(null)
    setSelectedTable(null)
    // Ricarica i tavoli quando si torna alla sala
    loadTables()
  }

  const handleArchivioIncassi = () => {
    console.log("📊 Archivio Incassi clicked from sala page")
    // Propaga l'evento al componente padre
    window.dispatchEvent(new CustomEvent("openRevenueArchive"))
  }

  const handleChiusura = async () => {
    if (
      !confirm(
        "Sei sicuro di voler effettuare la chiusura giornaliera? Tutti i tavoli verranno liberati e gli ordini archiviati.",
      )
    ) {
      return
    }

    try {
      setClosingDay(true)
      console.log("🔒 Starting day closure...")

      const response = await fetch("/api/restaurant/close-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Day closure completed:", data.details)
        alert(
          `Chiusura completata!\n\nTavoli liberati: ${data.details.tablesFreed}\nOrdini archiviati: ${data.details.ordersArchived}\nData: ${data.details.date}`,
        )

        // Ricarica i tavoli per mostrare lo stato aggiornato
        await loadTables()
      } else {
        console.error("❌ Day closure failed:", data.error)
        alert(`Errore durante la chiusura: ${data.error}`)
      }
    } catch (error) {
      console.error("💥 Error during day closure:", error)
      alert(`Errore di connessione durante la chiusura: ${error.message}`)
    } finally {
      setClosingDay(false)
    }
  }

  useEffect(() => {
    loadTables()
  }, [])

  // Se stiamo visualizzando un tavolo specifico, mostra il TableManagement
  if (viewingTable) {
    return <TableManagement tableNumber={viewingTable} onBackToSala={handleBackToSala} />
  }

  const getTableColor = (table: RestaurantTable) => {
    if (selectedTable === table.tableNumber) {
      return "bg-blue-500 text-white border-blue-600 shadow-lg"
    }
    if (table.status === "occupato") {
      return "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
    }
    return "bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
  }

  const getTableInfo = (table: RestaurantTable) => {
    const parts = []

    if (table.status === "occupato") {
      if (table.orderItems.length > 0) {
        parts.push(`${table.orderItems.length}p`)
      }
    }

    return parts.join(" - ")
  }

  // Crea un array di 40 tavoli, usando i dati dal DB o placeholder
  const displayTables = []
  for (let i = 1; i <= 40; i++) {
    const dbTable = tables.find((t) => t.tableNumber === i)
    if (dbTable) {
      console.log(`📋 Using DB data for table ${i}:`, dbTable)
      displayTables.push(dbTable)
    } else {
      // Tavolo placeholder se non esiste nel DB
      const placeholder = {
        tableNumber: i,
        status: "libero" as const,
        orderItems: [],
        orderTotal: 0,
        assignedRoom: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      displayTables.push(placeholder)
    }
  }
  console.log("🎯 Final displayTables array:", displayTables.length)

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-200">
        <div className="w-48 bg-gray-300 border-r border-gray-400 flex flex-col">
          <div className="p-4 border-b border-gray-400">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reparto</label>
            <select
              value={activeSection}
              onChange={(e) => onSectionChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
            >
              <option value="camere">Camere</option>
              <option value="sala">Sala</option>
            </select>
          </div>
          <div className="p-4 border-b border-gray-400">
            <button
              onClick={onInventoryClick}
              className="w-full p-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 mb-2"
            >
              INVENTARIO
            </button>
          </div>
          <div className="flex-1"></div>
          <div className="p-4 border-b border-gray-400">
            <Button
              onClick={handleArchivioIncassi}
              variant="outline"
              className="w-full text-xs bg-white hover:bg-gray-50"
            >
              ARCHIVIO INCASSI
            </Button>
          </div>
          <div className="p-4 border-t border-gray-400">
            <button
              onClick={onBackToHome}
              className="w-full p-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              TORNA ALLA HOME
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Caricamento tavoli...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadTables}>Riprova</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-200">
      {/* Sidebar */}
      <div className="w-48 bg-gray-300 border-r border-gray-400 flex flex-col">
        {/* Header Reparto */}
        <div className="p-4 border-b border-gray-400">
          <label className="block text-sm font-medium text-gray-700 mb-2">Reparto</label>
          <select
            value={activeSection}
            onChange={(e) => onSectionChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
          >
            <option value="camere">Camere</option>
            <option value="sala">Sala</option>
          </select>
        </div>

        {/* Sezione Inventario */}
        <div className="p-4 border-b border-gray-400">
          <button
            onClick={onInventoryClick}
            className="w-full p-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 mb-2"
          >
            INVENTARIO
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Archivio Incassi */}
        <div className="p-4 border-b border-gray-400">
          <Button
            onClick={handleArchivioIncassi}
            variant="outline"
            className="w-full text-xs bg-white hover:bg-gray-50"
          >
            ARCHIVIO INCASSI
          </Button>
        </div>

        {/* Bottone Torna alla Home */}
        <div className="p-4 border-t border-gray-400">
          <button
            onClick={onBackToHome}
            className="w-full p-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            TORNA ALLA HOME
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header con orologio */}
        <div className="bg-white border-b border-gray-300 px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-medium text-gray-800">Gestione Sala</h1>
          <RealTimeClock />
        </div>

        {/* Debug Info - Remove in production */}
        <div className="bg-yellow-100 border-b border-yellow-300 px-6 py-2 text-sm">
          <strong>Debug:</strong> Tables in state: {tables.length} | Loading: {loading ? "Yes" : "No"} | Error:{" "}
          {error || "None"}
        </div>

        {/* Area Tavoli */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Griglia Tavoli */}
            <div className="grid grid-cols-9 gap-4 mb-8">
              {/* Prime 4 righe: 9 tavoli ciascuna (tavoli 1-36) */}
              {displayTables.slice(0, 36).map((table) => (
                <button
                  key={table.tableNumber}
                  onClick={() => handleTableClick(table.tableNumber)}
                  className={`
                    w-20 h-20 rounded-lg border-2 font-bold text-lg transition-all duration-200 flex flex-col items-center justify-center
                    ${getTableColor(table)}
                  `}
                  title={
                    table.status === "occupato"
                      ? `Tavolo ${table.tableNumber} - Occupato${table.orderItems.length > 0 ? ` (${table.orderItems.length} articoli)` : ""}${table.assignedRoom > 0 ? ` - Camera ${table.assignedRoom}` : ""}`
                      : `Tavolo ${table.tableNumber} - Libero`
                  }
                >
                  <div>{table.tableNumber}</div>
                  {table.assignedRoom > 0 && <div className="text-xs opacity-75">C{table.assignedRoom}</div>}
                  {getTableInfo(table) && <div className="text-xs opacity-75">{getTableInfo(table)}</div>}
                </button>
              ))}
            </div>

            {/* Ultima riga: tavoli 37-40 + bottone + */}
            <div className="grid grid-cols-9 gap-4">
              {displayTables.slice(36, 40).map((table) => (
                <button
                  key={table.tableNumber}
                  onClick={() => handleTableClick(table.tableNumber)}
                  className={`
                    w-20 h-20 rounded-lg border-2 font-bold text-lg transition-all duration-200 flex flex-col items-center justify-center
                    ${getTableColor(table)}
                  `}
                  title={
                    table.status === "occupato"
                      ? `Tavolo ${table.tableNumber} - Occupato${table.orderItems.length > 0 ? ` (${table.orderItems.length} articoli)` : ""}${table.assignedRoom > 0 ? ` - Camera ${table.assignedRoom}` : ""}`
                      : `Tavolo ${table.tableNumber} - Libero`
                  }
                >
                  <div>{table.tableNumber}</div>
                  {table.assignedRoom > 0 && <div className="text-xs opacity-75">C{table.assignedRoom}</div>}
                  {getTableInfo(table) && <div className="text-xs opacity-75">{getTableInfo(table)}</div>}
                </button>
              ))}

              {/* Bottone + per aggiungere tavolo */}
              <button
                onClick={addNewTable}
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
            disabled={closingDay}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {closingDay ? "CHIUSURA IN CORSO..." : "CHIUSURA"}
          </Button>
        </div>
      </div>
    </div>
  )
}
