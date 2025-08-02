// Rimuovo "use client" perché questo service deve funzionare sia client che server

// Interfaccia che rispecchia esattamente i campi del conto camera
export interface RoomAccountData {
  _id?: string
  roomNumber: number
  accountId: string

  // Guest info
  customer: string
  adults: number
  children: number

  // Stay details
  checkIn: string // DD/MM/YYYY format
  checkOut: string
  nights: number

  // Services table data - esattamente come nel componente
  services: {
    camera: { [date: string]: string }
    colazione: { [date: string]: string }
    pranzo: { [date: string]: string }
    cena: { [date: string]: string }
    minibar: { [date: string]: string }
    transfer: { [date: string]: string }
  }

  // Minibar descriptions
  minibarDescriptions: { [date: string]: string }

  // Extras & payments
  extras: number
  transfer: number
  advancePayment: number

  // Notes
  notes: string

  // Calculated totals
  calculations: {
    roomTotal: number
    servicesTotal: number
    extrasTotal: number
    transferTotal: number
    subtotal: number
    finalTotal: number
    cityTax: number
  }

  // Table dates
  tableDates: string[]

  // Metadata
  status: "active" | "checked_out" | "cancelled"
  createdAt: string
  updatedAt: string
  lastModified: string
}

export class RoomAccountService {
  private static baseUrl = "/api/room-accounts"

  // Carica il conto di una camera (SOLO CLIENT-SIDE)
  static async loadAccount(roomNumber: number): Promise<RoomAccountData | null> {
    // Controlla se siamo sul client
    if (typeof window === "undefined") {
      throw new Error("loadAccount can only be called on the client side")
    }

    try {
      console.log(`🔍 Loading account for room ${roomNumber}`)
      const response = await fetch(`/api/room-accounts/${roomNumber}`)

      if (response.status === 404) {
        console.log(`ℹ️ No account found for room ${roomNumber}`)
        return null // Nessun conto esistente
      }

      if (!response.ok) {
        console.error(`❌ HTTP error ${response.status} for room ${roomNumber}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const account = await response.json()
      console.log(`✅ Loaded account for room ${roomNumber}:`, account.customer || "Empty customer")

      return account
    } catch (error) {
      console.error("Errore nel caricamento del conto:", error)
      return null
    }
  }

  // Salva il conto (SOLO CLIENT-SIDE)
  static async saveAccount(accountData: Partial<RoomAccountData>): Promise<boolean> {
    // Controlla se siamo sul client
    if (typeof window === "undefined") {
      throw new Error("saveAccount can only be called on the client side")
    }

    try {
      const method = accountData._id ? "PUT" : "POST"
      const url = accountData._id ? `${this.baseUrl}/${accountData.roomNumber}` : this.baseUrl

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...accountData,
          lastModified: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Errore nel salvataggio del conto:", error)
      return false
    }
  }

  // Azzera il conto (SOLO CLIENT-SIDE)
  static async clearAccount(roomNumber: number): Promise<boolean> {
    // Controlla se siamo sul client
    if (typeof window === "undefined") {
      throw new Error("clearAccount can only be called on the client side")
    }

    try {
      const response = await fetch(`${this.baseUrl}/${roomNumber}/clear`, {
        method: "POST",
      })

      return response.ok
    } catch (error) {
      console.error("Errore nell'azzeramento del conto:", error)
      return false
    }
  }

  // Genera un nuovo account ID (FUNZIONA SIA CLIENT CHE SERVER)
  static generateAccountId(roomNumber: number): string {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    const timeStr = Date.now().toString().slice(-3)
    return `ACC_${roomNumber}_${dateStr}_${timeStr}`
  }

  // Genera le date della tabella dal check-in (FUNZIONA SIA CLIENT CHE SERVER)
  static generateTableDates(checkIn: string, count = 7): string[] {
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

  // Calcola i totali (FUNZIONA SIA CLIENT CHE SERVER)
  static calculateTotals(accountData: Partial<RoomAccountData>) {
    const services = accountData.services || {
      camera: {},
      colazione: {},
      pranzo: {},
      cena: {},
      minibar: {},
      transfer: {},
    }

    // Totale camera
    const roomTotal = Object.values(services.camera || {}).reduce(
      (sum, value) => sum + (Number.parseFloat(value) || 0),
      0,
    )

    // Totale servizi (colazione, pranzo, cena, minibar)
    const servicesTotal = ["colazione", "pranzo", "cena", "minibar"].reduce((total, service) => {
      const serviceData = services[service as keyof typeof services] || {}
      return total + Object.values(serviceData).reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
    }, 0)

    // Totale transfer dalla tabella
    const transferFromTable = Object.values(services.transfer || {}).reduce(
      (sum, value) => sum + (Number.parseFloat(value) || 0),
      0,
    )

    const extrasTotal = accountData.extras || 0
    const transferTotal = transferFromTable + (accountData.transfer || 0)
    const subtotal = roomTotal + servicesTotal + extrasTotal + transferTotal
    const finalTotal = subtotal - (accountData.advancePayment || 0)
    const cityTax = (accountData.adults || 0) * (accountData.nights || 0) * 2.0

    return {
      roomTotal,
      servicesTotal,
      extrasTotal,
      transferTotal,
      subtotal,
      finalTotal,
      cityTax,
    }
  }
}
