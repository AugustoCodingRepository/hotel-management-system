"use client"
import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from "react"

interface RoomDetailsProps {
  roomNumber: number
}

interface RoomDetailsRef {
  handleCheckInToday: () => void
  handleCheckOutTomorrow: () => void
  handleAzzeraConto: () => void
  handlePrint: () => void
}

interface RoomData {
  customer: string
  adults: number
  children: number
  checkIn: string
  checkOut: string
  nights: number
  extras: number
  transfer: number
  advancePayment: number
  notes: string
  // Table data for services
  tableData: {
    [key: string]: { [date: string]: string }
  }
  // Minibar descriptions
  minibarDescriptions: { [date: string]: string }
  // Table dates
  tableDates: string[]
}

export const EditableRoomDetails = forwardRef<RoomDetailsRef, RoomDetailsProps>(({ roomNumber }, ref) => {
  const [roomData, setRoomData] = useState<RoomData>({
    customer: "Joe",
    adults: 2,
    children: 0,
    checkIn: "22/07/2025",
    checkOut: "25/07/2025",
    nights: 3,
    extras: 0.0,
    transfer: 0.0,
    advancePayment: 0.0,
    notes: "",
    tableData: {
      Camera: {
        "23/07/2025": "74.00",
        "24/07/2025": "74.00",
        "25/07/2025": "74.00",
      },
      Colazione: {},
      Pranzo: {},
      Cena: {},
      Minibar: {
        "24/07/2025": "15.00",
      },
      Transfer: {},
    },
    minibarDescriptions: {
      "24/07/2025": "Coca Cola, Acqua",
    },
    tableDates: ["22/07/2025", "23/07/2025", "24/07/2025", "25/07/2025", "26/07/2025", "27/07/2025", "28/07/2025"],
  })

  // Generate sequential dates from check-in
  const generateSequentialDates = (startDate: string, count = 7) => {
    const dates = []
    const [day, month, year] = startDate.split("/").map(Number)
    const start = new Date(year, month - 1, day)

    for (let i = 0; i < count; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)
      const formatted = `${currentDate.getDate().toString().padStart(2, "0")}/${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getFullYear()}`
      dates.push(formatted)
    }
    return dates
  }

  // Update table dates when check-in changes
  useEffect(() => {
    const newDates = generateSequentialDates(roomData.checkIn)
    setRoomData((prev) => ({
      ...prev,
      tableDates: newDates,
    }))
  }, [roomData.checkIn])

  // Calculate totals from table data
  const roomTotal = useMemo(() => {
    const cameraValues = Object.values(roomData.tableData.Camera || {})
    return cameraValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
  }, [roomData.tableData.Camera])

  const extrasFromTable = useMemo(() => {
    const servicesToSum = ["Colazione", "Pranzo", "Cena", "Minibar"]
    let total = 0

    servicesToSum.forEach((service) => {
      const serviceValues = Object.values(roomData.tableData[service] || {})
      total += serviceValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
    })

    return total + roomData.extras // Add extras field
  }, [roomData.tableData, roomData.extras])

  const transferFromTable = useMemo(() => {
    const transferValues = Object.values(roomData.tableData.Transfer || {})
    return transferValues.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0) + roomData.transfer
  }, [roomData.tableData.Transfer, roomData.transfer])

  const cityTax = roomData.adults * 2 * roomData.nights // 2€ per adult per night
  const subtotal = roomTotal + extrasFromTable + transferFromTable
  const finalTotal = subtotal - roomData.advancePayment

  const updateField = (field: keyof RoomData, value: string | number) => {
    setRoomData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateTableCell = (service: string, date: string, value: string) => {
    setRoomData((prev) => ({
      ...prev,
      tableData: {
        ...prev.tableData,
        [service]: {
          ...prev.tableData[service],
          [date]: value,
        },
      },
    }))
  }

  const updateMinibarDescription = (date: string, value: string) => {
    setRoomData((prev) => ({
      ...prev,
      minibarDescriptions: {
        ...prev.minibarDescriptions,
        [date]: value,
      },
    }))
  }

  const handleCheckInToday = () => {
    const today = new Date()
    const formatted = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`
    updateField("checkIn", formatted)
  }

  const handleCheckOutTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formatted = `${tomorrow.getDate().toString().padStart(2, "0")}/${(tomorrow.getMonth() + 1).toString().padStart(2, "0")}/${tomorrow.getFullYear()}`
    updateField("checkOut", formatted)
  }

  const handleAzzeraConto = () => {
    const conferma = window.confirm(
      "Sei sicuro di voler azzerare completamente il conto?\n\nQuesta azione cancellerà:\n- Tutti i servizi dalla tabella\n- Extras e Transfer\n- Advance payment\n- Descrizioni minibar\n\nQuesta operazione non può essere annullata.",
    )

    if (conferma) {
      setRoomData((prev) => ({
        ...prev,
        extras: 0,
        transfer: 0,
        advancePayment: 0,
        tableData: {
          Camera: {},
          Colazione: {},
          Pranzo: {},
          Cena: {},
          Minibar: {},
          Transfer: {},
        },
        minibarDescriptions: {},
      }))
    }
  }

  const handlePrint = async () => {
    const { PrintService } = await import("./print-service")
    const result = await PrintService.printRoomDetails(roomNumber, {
      printerName: "HP LaserJet Pro", // Configura qui la tua stampante
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

  const services = ["Camera", "Colazione", "Pranzo", "Cena", "Minibar", "Transfer"]

  return (
    <div className="flex-1 p-6 bg-gray-50">
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
                className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-blue-600">Adults:</span>
              <input
                type="number"
                value={roomData.adults}
                onChange={(e) => updateField("adults", Number.parseInt(e.target.value) || 0)}
                className="w-16 ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                min="0"
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-blue-600">Children:</span>
              <input
                type="number"
                value={roomData.children}
                onChange={(e) => updateField("children", Number.parseInt(e.target.value) || 0)}
                className="w-16 ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
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
                className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
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
                className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium">Nights:</span>
              <input
                type="number"
                value={roomData.nights}
                onChange={(e) => updateField("nights", Number.parseInt(e.target.value) || 0)}
                className="w-16 ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
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
                  <td className="border border-gray-300 p-2 text-xs font-medium bg-gray-50">{service}</td>
                  {roomData.tableDates.map((date) => (
                    <td key={date} className="border border-gray-300 p-1">
                      {service === "Minibar" ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={roomData.tableData[service]?.[date] || ""}
                            onChange={(e) => updateTableCell(service, date, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 bg-transparent"
                            placeholder="Prezzo"
                          />
                          <input
                            type="text"
                            value={roomData.minibarDescriptions[date] || ""}
                            onChange={(e) => updateMinibarDescription(date, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 bg-transparent text-gray-600"
                            placeholder="Descrizione..."
                            style={{ fontSize: "10px", height: "14px" }}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={roomData.tableData[service]?.[date] || ""}
                          onChange={(e) => updateTableCell(service, date, e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-transparent"
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
                  className="flex-1 p-2 border border-gray-300 rounded text-xs"
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
                  className="flex-1 p-2 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Camera (dalla tabella)</span>
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
                    className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
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
    </div>
  )
})

EditableRoomDetails.displayName = "EditableRoomDetails"
