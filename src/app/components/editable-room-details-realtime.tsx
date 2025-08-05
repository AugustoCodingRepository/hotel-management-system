"use client"

import { forwardRef, useImperativeHandle, useMemo } from "react"
import { useRoomAccountRealtime } from "@/app/api/hooks/use-room-account-realtime"
import { DebugPanel } from "./debug-panel"

interface RoomDetailsProps {
  roomNumber: number
}

interface RoomDetailsRef {
  handleCheckInToday: () => void
  handleCheckOutTomorrow: () => void
  handleAzzeraConto: () => void
  handlePrint: () => void
}

export const EditableRoomDetailsRealtime = forwardRef<RoomDetailsRef, RoomDetailsProps>(({ roomNumber }, ref) => {
  const { roomData, setRoomData, isLoading, isSaving, lastSaved, clearAccount } = useRoomAccountRealtime(roomNumber)

  // Calculate totals from table data
  const roomTotal = useMemo(() => {
    const cameraValues = Object.values(roomData.tableData.Room || {})
    return cameraValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
  }, [roomData.tableData.Room])

  const extrasFromTable = useMemo(() => {
    const servicesToSum = ["Lunch", "Dinner", "Minibar", "Bar", "Custom1", "Custom2"]
    let total = 0

    servicesToSum.forEach((service) => {
      const serviceValues = Object.values(roomData.tableData[service] || {})
      total += serviceValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
    })

    return total + roomData.extras
  }, [roomData.tableData, roomData.extras])

  const transferFromTable = useMemo(() => {
    const transferValues = Object.values(roomData.tableData.Transfer || {})
    return transferValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0) + roomData.transfer
  }, [roomData.tableData.Transfer, roomData.transfer])

  const cityTax = roomData.adults * 2 * roomData.nights
  const subtotal = roomTotal + extrasFromTable + transferFromTable
  const finalTotal = subtotal - roomData.advancePayment

  const updateField = (field: string, value: string | number) => {
    console.log(`📝 Field ${field} changed to:`, value)
    setRoomData({ [field]: value })
  }

  const updateTableCell = (service: string, date: string, value: string) => {
    console.log(`📝 Table cell ${service}[${date}] changed to:`, value)
    setRoomData({
      tableData: {
        ...roomData.tableData,
        [service]: {
          ...roomData.tableData[service],
          [date]: value,
        },
      },
    })
  }

  const updateServiceLabel = (oldLabel: string, newLabel: string) => {
    console.log(`📝 Service label changed from ${oldLabel} to ${newLabel}`)
    setRoomData({
      serviceLabels: {
        ...roomData.serviceLabels,
        [oldLabel]: newLabel,
      },
    })
  }

  const updateMinibarDescription = (date: string, value: string) => {
    setRoomData({
      minibarDescriptions: {
        ...roomData.minibarDescriptions,
        [date]: value,
      },
    })
  }

  const handleCheckInToday = () => {
    const today = new Date()
    const formatted = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`
    console.log(`📅 Setting check-in to today: ${formatted}`)
    updateField("checkIn", formatted)
  }

  const handleCheckOutTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formatted = `${tomorrow.getDate().toString().padStart(2, "0")}/${(tomorrow.getMonth() + 1).toString().padStart(2, "0")}/${tomorrow.getFullYear()}`
    console.log(`📅 Setting check-out to tomorrow: ${formatted}`)
    updateField("checkOut", formatted)
  }

  const handleAzzeraConto = async () => {
    const conferma = window.confirm(
      "Sei sicuro di voler azzerare completamente il conto?\n\nQuesta azione cancellerà:\n- Tutti i servizi dalla tabella\n- Extras e Transfer\n- Advance payment\n- Descrizioni minibar\n\nQuesta operazione non può essere annullata.",
    )

    if (conferma) {
      console.log(`🗑️ Clearing account for room ${roomNumber}`)
      const success = await clearAccount()
      if (success) {
        alert("✅ Conto azzerato con successo!")
      } else {
        alert("❌ Errore nell'azzeramento del conto")
      }
    }
  }

  const handlePrint = async () => {
    console.log(`🖨️ Printing account for room ${roomNumber}`)
    const { PrintService } = await import("./print-service")
    const result = await PrintService.printRoomDetails(roomNumber, {
      printerName: "HP LaserJet Pro",
      copies: 2,
      paperSize: "A4",
      orientation: "portrait",
    })

    if (result.success) {
      alert(`✅ ${result.message}`)
    } else {
      alert(`❌ ${result.message}`)
    }
  }

  useImperativeHandle(ref, () => ({
    handleCheckInToday,
    handleCheckOutTomorrow,
    handleAzzeraConto,
    handlePrint,
  }))

  const services = ["Room", "Lunch", "Dinner", "Minibar", "Bar", "Custom1", "Custom2"]

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Caricamento conto camera {roomNumber}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 relative">
      {/* Indicatore di salvataggio SEMPRE VISIBILE e PIÙ PROMINENTE */}
      <div className="absolute top-4 right-4 z-10">
        {isSaving ? (
          <div className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Salvataggio...</span>
          </div>
        ) : lastSaved ? (
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            ✅ Salvato {lastSaved.toLocaleTimeString("it-IT")}
          </div>
        ) : (
          <div className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm shadow-lg">💾 Pronto</div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-print-content>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-light text-gray-600">ROOM {roomNumber}</h2>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold italic">Il Nido</h1>
            <p className="text-sm text-gray-600">Hotel Sorrento ★★★</p>
          </div>
        </div>

        {/* Editable Guest Information */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-blue-600">Customer:</span>
              <input
                type="text"
                value={roomData.customer}
                onChange={(e) => updateField("customer", e.target.value)}
                className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome cliente..."
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-blue-600">Adults:</span>
              <input
                type="number"
                value={roomData.adults}
                onChange={(e) => updateField("adults", Number.parseInt(e.target.value) || 0)}
                className="w-16 ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-blue-600">Children:</span>
              <input
                type="number"
                value={roomData.children}
                onChange={(e) => updateField("children", Number.parseInt(e.target.value) || 0)}
                className="w-16 ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium">Check-in:</span>
              <input
                type="date"
                value={roomData.checkIn.split("/").reverse().join("-")}
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  const formatted = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                  updateField("checkIn", formatted)
                }}
                className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium">Check-out:</span>
              <input
                type="date"
                value={roomData.checkOut.split("/").reverse().join("-")}
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  const formatted = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                  updateField("checkOut", formatted)
                }}
                className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium">Nights:</span>
              <input
                type="number"
                value={roomData.nights}
                onChange={(e) => updateField("nights", Number.parseInt(e.target.value) || 0)}
                className="w-16 ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Fully Editable Services Table */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-xs font-medium w-24">SERVIZI</th>
                {roomData.tableDates.map((date) => (
                  <th key={date} className="border border-gray-300 p-2 text-xs font-medium">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service}>
                  <td className="border border-gray-300 p-1 bg-gray-50">
                    {service === "Custom1" || service === "Custom2" ? (
                      <input
                        type="text"
                        value={roomData.serviceLabels?.[service] || service}
                        onChange={(e) => updateServiceLabel(service, e.target.value)}
                        className="w-full px-1 py-0.5 text-xs border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium"
                        placeholder={`Servizio ${service === "Custom1" ? "1" : "2"}`}
                      />
                    ) : (
                      <span className="text-xs font-medium">{service}</span>
                    )}
                  </td>
                  {roomData.tableDates.map((date) => (
                    <td key={date} className="border border-gray-300 p-1">
                      {service === "Minibar" ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={roomData.tableData[service]?.[date] || ""}
                            onChange={(e) => updateTableCell(service, date, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500"
                            placeholder="Prezzo"
                          />
                          <input
                            type="text"
                            value={roomData.minibarDescriptions[date] || ""}
                            onChange={(e) => updateMinibarDescription(date, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 bg-transparent text-gray-600 focus:bg-white focus:ring-1 focus:ring-blue-500"
                            placeholder="Descrizione..."
                            style={{ fontSize: "10px", height: "14px" }}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={roomData.tableData[service]?.[date] || ""}
                          onChange={(e) => updateTableCell(service, date, e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500"
                          placeholder=""
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section with Calculations */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Extras</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={roomData.extras}
                  onChange={(e) => updateField("extras", Number.parseFloat(e.target.value) || 0)}
                  className="flex-1 p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Transfer (aggiuntivo)</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={roomData.transfer}
                  onChange={(e) => updateField("transfer", Number.parseFloat(e.target.value) || 0)}
                  className="flex-1 p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Room (dalla tabella)</span>
                <span>€{roomTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Extras (servizi + extras)</span>
                <span>€{extrasFromTable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Transfer</span>
                <span>€{transferFromTable.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center">
                <span>Subtotale</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Advance payment</span>
                <div className="flex items-center space-x-1">
                  <span>-€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={roomData.advancePayment}
                    onChange={(e) => updateField("advancePayment", Number.parseFloat(e.target.value) || 0)}
                    className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center font-medium text-base border-t pt-2">
                <span>TOTAL</span>
                <span>€{finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  City tax ({roomData.adults} adulti × {roomData.nights} notti × €2)
                </span>
                <span>€{cityTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-600">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-medium">Hotel "Il Nido" Restaurant</p>
              <p>Via Nastro Verde 82 | Sorrento (80067)</p>
              <p className="font-medium">Website: ilnido.it</p>
            </div>
            <div>
              <p>
                <span className="font-medium">Fax:</span> +39 081 807 3304
              </p>
              <p>
                <span className="font-medium">Email:</span> info@ilnido.it
              </p>
              <p>
                <span className="font-medium">Phone:</span> +39 081 878 2706
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel roomNumber={roomNumber} />
    </div>
  )
})

EditableRoomDetailsRealtime.displayName = "EditableRoomDetailsRealtime"
