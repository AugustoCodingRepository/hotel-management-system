"use client"

import type { RoomAccount, Services } from "./mongodb-schemas"

export class DatabaseService {
  private static baseUrl = "/api"

  // Carica il conto di una camera specifica
  static async loadRoomAccount(roomNumber: number): Promise<RoomAccount | null> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts?roomNumber=${roomNumber}&status=checked_in`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const accounts = await response.json()

      // Restituisce il conto attivo più recente per la camera
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      console.error("Errore nel caricamento del conto:", error)
      return null
    }
  }

  // Salva o aggiorna un conto
  static async saveRoomAccount(roomNumber: number, accountData: Partial<RoomAccount>): Promise<boolean> {
    try {
      // Prima controlla se esiste già un conto per questa camera
      const existingAccount = await this.loadRoomAccount(roomNumber)

      if (existingAccount) {
        // Aggiorna il conto esistente
        const response = await fetch(`${this.baseUrl}/accounts/${existingAccount.accountId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...accountData,
            roomNumber,
            updatedAt: new Date().toISOString(),
          }),
        })

        return response.ok
      } else {
        // Crea un nuovo conto
        const response = await fetch(`${this.baseUrl}/accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...accountData,
            roomNumber,
            stay: {
              ...accountData.stay,
              status: "checked_in",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })

        return response.ok
      }
    } catch (error) {
      console.error("Errore nel salvataggio del conto:", error)
      return false
    }
  }

  // Salva solo i servizi (per aggiornamenti parziali)
  static async saveServices(roomNumber: number, services: Services, calculations: any): Promise<boolean> {
    try {
      const existingAccount = await this.loadRoomAccount(roomNumber)

      if (!existingAccount) {
        console.error("Nessun conto trovato per la camera", roomNumber)
        return false
      }

      const response = await fetch(`${this.baseUrl}/accounts/${existingAccount.accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services,
          calculations,
          updatedAt: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Errore nel salvataggio dei servizi:", error)
      return false
    }
  }

  // Azzera un conto
  static async clearAccount(roomNumber: number): Promise<boolean> {
    try {
      const existingAccount = await this.loadRoomAccount(roomNumber)

      if (!existingAccount) {
        return false
      }

      const clearedServices: Services = {
        camera: {},
        colazione: {},
        pranzo: {},
        cena: {},
        minibar: {},
        transfer: {},
      }

      const clearedCalculations = {
        roomTotal: 0,
        servicesTotal: 0,
        extrasAmount: 0,
        transferAmount: 0,
        subtotal: 0,
        advancePayment: 0,
        finalTotal: 0,
        cityTax: {
          ratePerPersonPerNight: 2.0,
          totalAmount: 0,
          exemptions: [],
        },
      }

      const response = await fetch(`${this.baseUrl}/accounts/${existingAccount.accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services: clearedServices,
          calculations: clearedCalculations,
          extras: { amount: 0, description: "", items: [] },
          transfer: {
            amount: 0,
            description: "",
            pickup: { location: "", time: "", date: "" },
            dropoff: { location: "", time: "", date: "" },
          },
          updatedAt: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Errore nell'azzeramento del conto:", error)
      return false
    }
  }

  // Aggiungi una stampa al log
  static async addPrintRecord(
    roomNumber: number,
    printType: string,
    printer: string,
    copies: number,
  ): Promise<boolean> {
    try {
      const existingAccount = await this.loadRoomAccount(roomNumber)

      if (!existingAccount) {
        return false
      }

      const printRecord = {
        date: new Date().toISOString(),
        type: printType,
        copies,
        printer,
        user: "reception_user", // TODO: Get from auth
      }

      const updatedPrintHistory = [...(existingAccount.printHistory || []), printRecord]

      const response = await fetch(`${this.baseUrl}/accounts/${existingAccount.accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          printHistory: updatedPrintHistory,
          updatedAt: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Errore nel salvataggio del record di stampa:", error)
      return false
    }
  }

  // Ottieni tutte le camere con i loro status
  static async getRoomsStatus(): Promise<Array<{ number: number; hasAccount: boolean; status: string }>> {
    try {
      const [roomsResponse, accountsResponse] = await Promise.all([
        fetch(`${this.baseUrl}/rooms`),
        fetch(`${this.baseUrl}/accounts?status=checked_in`),
      ])

      const rooms = await roomsResponse.json()
      const accounts = await accountsResponse.json()

      const accountsByRoom = accounts.reduce((acc: any, account: RoomAccount) => {
        acc[account.roomNumber] = account
        return acc
      }, {})

      return rooms.map((room: any) => ({
        number: room.number,
        hasAccount: !!accountsByRoom[room.number],
        status: accountsByRoom[room.number]?.stay?.status || "available",
      }))
    } catch (error) {
      console.error("Errore nel caricamento dello status delle camere:", error)
      return []
    }
  }
}
