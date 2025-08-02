"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DatabaseService } from "@/lib/database-service"
import type { RoomAccount, Services } from "@/lib/mongodb-schemas"

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
  tableData: {
    [key: string]: { [date: string]: string }
  }
  minibarDescriptions: { [date: string]: string }
  tableDates: string[]
}

export function useRoomAccount(roomNumber: number) {
  const [roomData, setRoomData] = useState<RoomData>({
    customer: "",
    adults: 2,
    children: 0,
    checkIn: new Date().toISOString().split("T")[0].split("-").reverse().join("/"),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0].split("-").reverse().join("/"),
    nights: 3,
    extras: 0.0,
    transfer: 0.0,
    advancePayment: 0.0,
    notes: "",
    tableData: {
      Camera: {},
      Colazione: {},
      Pranzo: {},
      Cena: {},
      Minibar: {},
      Transfer: {},
    },
    minibarDescriptions: {},
    tableDates: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const previousRoomRef = useRef<number>()

  // Carica i dati quando cambia la camera
  const loadRoomData = useCallback(async (roomNum: number) => {
    setIsLoading(true)
    try {
      const account = await DatabaseService.loadRoomAccount(roomNum)

      if (account) {
        // Converti i dati dal database al formato del componente
        setRoomData({
          customer: account.guest.customer,
          adults: account.guest.adults,
          children: account.guest.children,
          checkIn: new Date(account.stay.checkIn).toLocaleDateString("it-IT"),
          checkOut: new Date(account.stay.checkOut).toLocaleDateString("it-IT"),
          nights: account.stay.nights,
          extras: account.extras.amount,
          transfer: account.transfer.amount,
          advancePayment: account.calculations.advancePayment,
          notes: account.notes,
          tableData: convertServicesToTableData(account.services),
          minibarDescriptions: extractMinibarDescriptions(account.services),
          tableDates: generateDatesFromCheckIn(new Date(account.stay.checkIn).toLocaleDateString("it-IT")),
        })
      } else {
        // Nessun conto esistente, usa dati vuoti
        const today = new Date().toLocaleDateString("it-IT")
        setRoomData({
          customer: "",
          adults: 2,
          children: 0,
          checkIn: today,
          checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("it-IT"),
          nights: 3,
          extras: 0.0,
          transfer: 0.0,
          advancePayment: 0.0,
          notes: "",
          tableData: {
            Camera: {},
            Colazione: {},
            Pranzo: {},
            Cena: {},
            Minibar: {},
            Transfer: {},
          },
          minibarDescriptions: {},
          tableDates: generateDatesFromCheckIn(today),
        })
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati della camera:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Salva i dati automaticamente (debounced)
  const saveRoomData = useCallback(
    async (data: RoomData, immediate = false) => {
      // Cancella il timeout precedente se non è immediato
      if (!immediate && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      const doSave = async () => {
        setIsSaving(true)
        try {
          const services = convertTableDataToServices(data.tableData, data.minibarDescriptions)
          const calculations = calculateTotals(data, services)

          const accountData: Partial<RoomAccount> = {
            guest: {
              customer: data.customer,
              adults: data.adults,
              children: data.children,
              totalGuests: data.adults + data.children,
            },
            stay: {
              checkIn: convertToISODate(data.checkIn),
              checkOut: convertToISODate(data.checkOut),
              nights: data.nights,
              roomRate: 74.0, // TODO: Get from settings
              status: "checked_in",
            },
            services,
            calculations,
            extras: {
              amount: data.extras,
              description: "",
              items: [],
            },
            transfer: {
              amount: data.transfer,
              description: "",
              pickup: { location: "", time: "", date: "" },
              dropoff: { location: "", time: "", date: "" },
            },
            notes: data.notes,
          }

          const success = await DatabaseService.saveRoomAccount(roomNumber, accountData)

          if (success) {
            setLastSaved(new Date())
          } else {
            console.error("Errore nel salvataggio del conto")
          }
        } catch (error) {
          console.error("Errore nel salvataggio:", error)
        } finally {
          setIsSaving(false)
        }
      }

      if (immediate) {
        await doSave()
      } else {
        // Salva dopo 1 secondo di inattività
        saveTimeoutRef.current = setTimeout(doSave, 1000)
      }
    },
    [roomNumber],
  )

  // Effetto per caricare i dati quando cambia la camera
  useEffect(() => {
    // Se c'è una camera precedente, salva i dati prima di cambiare
    if (previousRoomRef.current && previousRoomRef.current !== roomNumber) {
      saveRoomData(roomData, true) // Salvataggio immediato
    }

    loadRoomData(roomNumber)
    previousRoomRef.current = roomNumber
  }, [roomNumber, loadRoomData])

  // Cleanup del timeout quando il componente si smonta
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Funzione per aggiornare i dati e salvare automaticamente
  const updateRoomData = useCallback(
    (updates: Partial<RoomData>) => {
      setRoomData((prev) => {
        const newData = { ...prev, ...updates }
        saveRoomData(newData) // Salvataggio automatico debounced
        return newData
      })
    },
    [saveRoomData],
  )

  // Funzione per azzerare il conto
  const clearAccount = useCallback(async () => {
    const success = await DatabaseService.clearAccount(roomNumber)
    if (success) {
      await loadRoomData(roomNumber) // Ricarica i dati
    }
    return success
  }, [roomNumber, loadRoomData])

  return {
    roomData,
    setRoomData: updateRoomData,
    isLoading,
    isSaving,
    lastSaved,
    clearAccount,
    reloadData: () => loadRoomData(roomNumber),
  }
}

// Funzioni di utilità per convertire i dati
function convertServicesToTableData(services: Services): { [key: string]: { [date: string]: string } } {
  const tableData: { [key: string]: { [date: string]: string } } = {
    Camera: {},
    Colazione: {},
    Pranzo: {},
    Cena: {},
    Minibar: {},
    Transfer: {},
  }

  Object.entries(services).forEach(([serviceName, serviceData]) => {
    const capitalizedName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1)
    if (tableData[capitalizedName]) {
      Object.entries(serviceData).forEach(([date, entry]) => {
        tableData[capitalizedName][date] = entry.amount.toString()
      })
    }
  })

  return tableData
}

function extractMinibarDescriptions(services: Services): { [date: string]: string } {
  const descriptions: { [date: string]: string } = {}

  Object.entries(services.minibar || {}).forEach(([date, entry]) => {
    descriptions[date] = entry.description || ""
  })

  return descriptions
}

function convertTableDataToServices(
  tableData: { [key: string]: { [date: string]: string } },
  minibarDescriptions: { [date: string]: string },
): Services {
  const services: Services = {
    camera: {},
    colazione: {},
    pranzo: {},
    cena: {},
    minibar: {},
    transfer: {},
  }

  Object.entries(tableData).forEach(([serviceName, serviceData]) => {
    const lowerServiceName = serviceName.toLowerCase() as keyof Services

    Object.entries(serviceData).forEach(([date, amount]) => {
      if (amount && Number.parseFloat(amount) > 0) {
        services[lowerServiceName][date] = {
          amount: Number.parseFloat(amount),
          description: lowerServiceName === "minibar" ? minibarDescriptions[date] || "" : serviceName,
        }
      }
    })
  })

  return services
}

function calculateTotals(data: RoomData, services: Services) {
  const roomTotal = Object.values(services.camera).reduce((sum, entry) => sum + entry.amount, 0)
  const servicesTotal =
    ["colazione", "pranzo", "cena", "minibar"].reduce((sum, service) => {
      return (
        sum +
        Object.values(services[service as keyof Services]).reduce((serviceSum, entry) => serviceSum + entry.amount, 0)
      )
    }, 0) + data.extras

  const transferTotal = Object.values(services.transfer).reduce((sum, entry) => sum + entry.amount, 0) + data.transfer
  const subtotal = roomTotal + servicesTotal + transferTotal
  const finalTotal = subtotal - data.advancePayment
  const cityTax = data.adults * data.nights * 2.0

  return {
    roomTotal,
    servicesTotal,
    extrasAmount: data.extras,
    transferAmount: data.transfer,
    subtotal,
    advancePayment: data.advancePayment,
    finalTotal,
    cityTax: {
      ratePerPersonPerNight: 2.0,
      totalAmount: cityTax,
      exemptions: [],
    },
  }
}

function convertToISODate(italianDate: string): string {
  const [day, month, year] = italianDate.split("/")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function generateDatesFromCheckIn(checkIn: string, count = 7): string[] {
  const dates = []
  const [day, month, year] = checkIn.split("/").map(Number)
  const start = new Date(year, month - 1, day)

  for (let i = 0; i < count; i++) {
    const currentDate = new Date(start)
    currentDate.setDate(start.getDate() + i)
    const formatted = `${currentDate.getDate().toString().padStart(2, "0")}/${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getFullYear()}`
    dates.push(formatted)
  }
  return dates
}
