"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { RealTimeClock } from "@/app/components/real-time-clock"

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

interface ModifyOrderProps {
  tableNumber: number
  onBack: () => void
  onOrderModified: () => void
}

export function ModifyOrder({ tableNumber, onBack, onOrderModified }: ModifyOrderProps) {
  const [table, setTable] = useState<RestaurantTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadTableData()
  }, [tableNumber])

  const loadTableData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading table data for modification...")

      const response = await fetch(`/api/restaurant-tables/${tableNumber}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setTable(data.table)
        console.log("✅ Table data loaded for modification")
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

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    try {
      setUpdating(productId)
      console.log(`🔄 Updating quantity for product ${productId} to ${newQuantity}`)

      if (newQuantity === 0) {
        // Rimuovi il prodotto
        const response = await fetch(`/api/restaurant-tables/${tableNumber}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "remove_item",
            orderItem: { productId },
          }),
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || "Errore nella rimozione del prodotto")
        }

        console.log("✅ Product removed successfully")
      } else {
        // Aggiorna la quantità
        const response = await fetch(`/api/restaurant-tables/${tableNumber}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update_quantity",
            orderItem: { productId, quantity: newQuantity },
          }),
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || "Errore nell'aggiornamento della quantità")
        }

        console.log("✅ Quantity updated successfully")
      }

      // Ricarica i dati del tavolo
      await loadTableData()
    } catch (error) {
      console.error("❌ Error updating quantity:", error)
      alert(`Errore nell'aggiornamento: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const handleSaveChanges = () => {
    console.log("✅ Changes saved, returning to table management")
    onOrderModified()
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Modifica Ordine - Tavolo {tableNumber}</h1>
          <RealTimeClock />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Caricamento ordine...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              ← Indietro
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Modifica Ordine - Tavolo {tableNumber}</h1>
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

  const orderItems = table?.orderItems || []
  const orderTotal = table?.orderTotal || 0

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Indietro
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Modifica Ordine - Tavolo {tableNumber}</h1>
        </div>
        <RealTimeClock />
      </header>

      {/* Debug info */}
      <div className="bg-blue-100 border-b border-blue-200 px-6 py-2">
        <div className="text-sm text-blue-800">
          Debug: {orderItems.length} articoli nell'ordine, Totale: €{orderTotal.toFixed(2)}
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Articoli nell'Ordine</h2>
            </div>

            <div className="p-4">
              {orderItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nessun articolo nell'ordine</p>
                  <Button onClick={onBack} variant="outline">
                    Torna al Menu
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {orderItems.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.categoryName}</div>
                          <div className="text-sm text-gray-600">€{item.unitPrice.toFixed(2)} per unità</div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Controlli quantità */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0"
                              disabled={updating === item.productId}
                            >
                              -
                            </Button>

                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = Number.parseInt(e.target.value) || 0
                                updateQuantity(item.productId, newQuantity)
                              }}
                              className="w-20 h-8 text-center"
                              min="0"
                              disabled={updating === item.productId}
                            />

                            <Button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0"
                              disabled={updating === item.productId}
                            >
                              +
                            </Button>
                          </div>

                          {/* Prezzo totale */}
                          <div className="text-right min-w-[80px]">
                            <div className="font-medium text-gray-900">€{item.totalPrice.toFixed(2)}</div>
                            {updating === item.productId && (
                              <div className="text-xs text-blue-600">Aggiornamento...</div>
                            )}
                          </div>

                          {/* Pulsante rimuovi */}
                          <Button
                            onClick={() => updateQuantity(item.productId, 0)}
                            variant="destructive"
                            size="sm"
                            disabled={updating === item.productId}
                          >
                            Rimuovi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totale e azioni */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-medium text-gray-900">Totale Ordine:</span>
                      <span className="text-2xl font-bold text-green-600">€{orderTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handleSaveChanges} className="flex-1">
                        Salva Modifiche
                      </Button>
                      <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
                        Annulla
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
