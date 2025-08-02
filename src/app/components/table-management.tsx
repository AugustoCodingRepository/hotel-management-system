"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { RealTimeClock } from "@/app/components/real-time-clock"
import { AddOrderItems } from "@/app/components/add-order-items"
import { ModifyOrder } from "@/app/components/modify-order"
import { AssignToRoomDialog } from "@/app/components/assign-to-room-dialog"
import { Kube2Printer, type PrintData } from "@/lib/kube2-printer"

interface OrderItem {
  productId: string
  productName: string
  categoryName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  addedAt: string
}

interface RestaurantTable {
  _id?: string
  tableNumber: number
  assignedRoom: number
  orderItems: OrderItem[]
  status: "occupato" | "disponibile"
  orderTotal: number
  createdAt: string
  updatedAt: string
}

interface TableManagementProps {
  tableNumber: number
  onBackToSala: () => void
}

export function TableManagement({ tableNumber, onBackToSala }: TableManagementProps) {
  const [table, setTable] = useState<RestaurantTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddItems, setShowAddItems] = useState(false)
  const [showModifyOrder, setShowModifyOrder] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    loadTableData()
  }, [tableNumber])

  const loadTableData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading table data for table", tableNumber)

      const response = await fetch(`/api/restaurant-tables/${tableNumber}`)
      console.log("Table response status:", response.status)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Table data received:", data)

      if (data.success) {
        setTable(data.table)
        console.log("✅ Table data loaded successfully")
      } else {
        throw new Error(data.error || "Failed to load table data")
      }
    } catch (error) {
      console.error("❌ Error loading table data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderConfirmed = () => {
    setShowAddItems(false)
    loadTableData() // Ricarica i dati del tavolo
  }

  const handleOrderModified = () => {
    setShowModifyOrder(false)
    loadTableData() // Ricarica i dati del tavolo
  }

  const handleOrderAssigned = () => {
    setShowAssignDialog(false)
    loadTableData() // Ricarica i dati del tavolo per mostrare l'assegnazione
  }

  const handlePrintReceipt = async () => {
    if (!table || !table.orderItems || table.orderItems.length === 0) {
      alert("Nessun ordine da stampare")
      return
    }

    setPrinting(true)

    try {
      // Prepara i dati per la stampa
      const printData: PrintData = {
        tableNumber: table.tableNumber,
        items: table.orderItems.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        total: table.orderTotal,
        assignedRoom: table.assignedRoom > 0 ? table.assignedRoom : undefined,
        timestamp: new Date().toISOString(),
      }

      console.log("🖨️ Printing receipt for table", tableNumber)
      const result = await Kube2Printer.printReceipt(printData)

      if (result.success) {
        alert("✅ " + result.message)
      } else {
        alert("❌ " + result.message)
      }
    } catch (error) {
      console.error("❌ Print error:", error)
      alert("Errore durante la stampa del conto")
    } finally {
      setPrinting(false)
    }
  }

  const handleCloseTable = async () => {
    try {
      const response = await fetch(`/api/restaurant-tables/${tableNumber}/close-order`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Table closed successfully:", data.message)
        // Torna alla sala dopo aver chiuso il tavolo
        onBackToSala()
      } else {
        console.error("❌ Error closing table:", data.error)
        alert(`Errore nella chiusura del tavolo: ${data.error}`)
      }
    } catch (error) {
      console.error("❌ Error closing table:", error)
      alert("Errore di connessione durante la chiusura del tavolo")
    }
  }

  // Calcola il numero di coperti dall'ordine
  const getCoversFromOrder = () => {
    if (!table?.orderItems) return 0

    // Cerca un prodotto che contenga "coperti" nel nome (case insensitive)
    const copertiItem = table.orderItems.find(
      (item) =>
        item.productName.toLowerCase().includes("coperti") || item.productName.toLowerCase().includes("coperto"),
    )

    console.log(
      "🍽️ Looking for covers in order items:",
      table.orderItems.map((item) => item.productName),
    )
    console.log("🍽️ Found covers item:", copertiItem)

    return copertiItem ? copertiItem.quantity : 0
  }

  if (showAddItems) {
    return (
      <AddOrderItems
        tableNumber={tableNumber}
        onBack={() => setShowAddItems(false)}
        onOrderConfirmed={handleOrderConfirmed}
      />
    )
  }

  if (showModifyOrder) {
    return (
      <ModifyOrder
        tableNumber={tableNumber}
        onBack={() => setShowModifyOrder(false)}
        onOrderModified={handleOrderModified}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Tavolo {tableNumber}</h1>
          <RealTimeClock />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Caricamento...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button onClick={onBackToSala} variant="outline" size="sm">
              ← Torna alla Sala
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Tavolo {tableNumber}</h1>
          </div>
          <RealTimeClock />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">Errore: {error}</div>
            <Button onClick={loadTableData}>Riprova</Button>
          </div>
        </div>
      </div>
    )
  }

  const covers = getCoversFromOrder()

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button onClick={onBackToSala} variant="outline" size="sm">
            ← Torna alla Sala
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            Tavolo {tableNumber}
            {table?.assignedRoom && table.assignedRoom > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">(Camera {table.assignedRoom})</span>
            )}
          </h1>
        </div>
        <RealTimeClock />
      </header>

      {/* Debug info */}
      <div className="bg-blue-100 border-b border-blue-200 px-6 py-2">
        <div className="text-sm text-blue-800">
          Debug: Stato = {table?.status || "N/A"}, Articoli = {table?.orderItems?.length || 0}, Totale = €
          {table?.orderTotal?.toFixed(2) || "0.00"}, Coperti = {covers}
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Ordine Attuale */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Ordine Attuale</h2>
              <Button onClick={() => setShowAddItems(true)} size="sm">
                Aggiungi qualcosa all'ordine
              </Button>
            </div>

            <div className="p-4">
              {!table?.orderItems || table.orderItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nessun ordine presente</p>
                  <Button onClick={() => setShowAddItems(true)} variant="outline">
                    Inizia un ordine
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-96 overflow-y-auto">
                    {table.orderItems.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.categoryName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">x{item.quantity}</div>
                          <div className="font-medium text-gray-900">€{item.totalPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Totale:</span>
                      <span className="text-xl font-bold text-green-600">€{table.orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Azioni */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Azioni</h2>
            </div>

            <div className="p-4 space-y-3">
              <Button
                onClick={() => setShowModifyOrder(true)}
                className="w-full"
                variant="outline"
                disabled={!table?.orderItems || table.orderItems.length === 0}
              >
                Modifica l'ordine
              </Button>
              <Button
                onClick={handlePrintReceipt}
                className="w-full bg-transparent"
                variant="outline"
                disabled={!table?.orderItems || table.orderItems.length === 0 || printing}
              >
                {printing ? "Stampando..." : "Stampa Conto"}
              </Button>
              <Button
                onClick={() => setShowAssignDialog(true)}
                className="w-full"
                variant="outline"
                disabled={!table?.orderItems || table.orderItems.length === 0 || table.orderTotal === 0}
              >
                Assegna Camera
              </Button>
              <Button
                onClick={handleCloseTable}
                className="w-full"
                variant="destructive"
                disabled={!table?.orderItems || table.orderItems.length === 0}
              >
                Chiudi Tavolo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog per assegnazione camera */}
      <AssignToRoomDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        tableNumber={tableNumber}
        orderTotal={table?.orderTotal || 0}
        covers={covers}
        onAssigned={handleOrderAssigned}
      />
    </div>
  )
}
