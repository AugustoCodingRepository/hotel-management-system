"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RoomAccountService } from "@/lib/room-account-service"

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
  serviceLabels: { [key: string]: string }
  tableDates: string[]
}
 
export function useRoomAccountRealtime(roomNumber: number) {
  const [roomData, setRoomData] = useState<RoomData>({
    customer: "",
    adults: 2,
    children: 0,
    checkIn: new Date().toLocaleDateString("it-IT"),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("it-IT"),
    nights: 3,
    extras: 0.0,
    transfer: 0.0,
    advancePayment: 0.0,
    notes: "",
    tableData: {
      Room: {},
      Lunch: {},
      Dinner: {},
      Minibar: {},
      Bar: {},
      Custom1: {},
      Custom2: {},
      Transfer: {},
    },
    minibarDescriptions: {},
    serviceLabels: {
      Custom1: "Servizio 1",
      Custom2: "Servizio 2",
    },
    tableDates: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const previousRoomRef = useRef<number>()
  const isLoadingRef = useRef(false)
  const lastSaveDataRef = useRef<string>("")

  // Funzione per notificare i cambiamenti
  const notifyRoomDataChanged = useCallback((data: RoomData, currentRoomNumber: number) => {
    if (typeof window !== "undefined") {
      const hasData = !!(data.customer || Object.values(data.tableData.Room).some((v) => v))

      console.log(`📢 Notifying room ${currentRoomNumber} data changed:`, {
        customer: data.customer,
        checkOut: data.checkOut,
        hasData,
      })

      window.dispatchEvent(
        new CustomEvent("roomDataChanged", {
          detail: {
            roomNumber: currentRoomNumber,
            checkOut: data.checkOut,
            hasData,
            customer: data.customer,
          },
        }),
      )
    }
  }, [])

  // Carica i dati quando cambia la camera
  const loadRoomData = useCallback(
    async (roomNum: number) => {
      if (isLoadingRef.current) return

      isLoadingRef.current = true
      setIsLoading(true)

      try {
        console.log(`🔄 Loading data for room ${roomNum}`)
        const account = await RoomAccountService.loadAccount(roomNum)

        if (account) {
          console.log(`✅ Found existing account for room ${roomNum}: ${account.customer}`)
          setAccountId(account.accountId)

          const newRoomData = {
            customer: account.customer,
            adults: account.adults,
            children: account.children,
            checkIn: account.checkIn,
            checkOut: account.checkOut,
            nights: account.nights,
            extras: account.extras,
            transfer: account.transfer,
            advancePayment: account.advancePayment,
            notes: account.notes,
            tableData: {
              Room: account.services.camera || {},
              Lunch: account.services.lunch || account.services.pranzo || {},
              Dinner: account.services.dinner || account.services.cena || {},
              Minibar: account.services.minibar || {},
              Bar: account.services.bar || {},
              Custom1: account.services.custom1 || {},
              Custom2: account.services.custom2 || {},
              Transfer: account.services.transfer || {},
            },
            minibarDescriptions: account.minibarDescriptions,
            serviceLabels: account.serviceLabels || {
              Custom1: "Servizio 1",
              Custom2: "Servizio 2",
            },
            tableDates: account.tableDates,
          }

          setRoomData(newRoomData)
          lastSaveDataRef.current = JSON.stringify(newRoomData)

          // Notifica immediatamente dopo il caricamento
          notifyRoomDataChanged(newRoomData, roomNum)
        } else {
          console.log(`ℹ️ No existing account for room ${roomNum}, creating empty`)
          setAccountId(null)
          const today = new Date().toLocaleDateString("it-IT")
          const tableDates = RoomAccountService.generateTableDates(today)

          const emptyRoomData = {
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
              Room: {},
              Lunch: {},
              Dinner: {},
              Minibar: {},
              Bar: {},
              Custom1: {},
              Custom2: {},
              Transfer: {},
            },
            minibarDescriptions: {},
            serviceLabels: {
              Custom1: "Servizio 1",
              Custom2: "Servizio 2",
            },
            tableDates,
          }

          setRoomData(emptyRoomData)
          lastSaveDataRef.current = JSON.stringify(emptyRoomData)

          // Notifica anche per camere vuote
          notifyRoomDataChanged(emptyRoomData, roomNum)
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati della camera:", error)
      } finally {
        setIsLoading(false)
        isLoadingRef.current = false
      }
    },
    [notifyRoomDataChanged],
  )

  // Salva i dati IMMEDIATAMENTE
  const saveRoomDataInternal = useCallback(
    async (data: RoomData, currentRoomNumber: number, currentAccountId: string | null, force = false) => {
      // Controlla se i dati sono cambiati davvero
      const currentDataString = JSON.stringify(data)
      if (!force && currentDataString === lastSaveDataRef.current) {
        console.log(`⏭️ No changes detected for room ${currentRoomNumber}, skipping save`)
        return true
      }

      setIsSaving(true)

      try {
        console.log(`💾 Saving data for room ${currentRoomNumber}`, {
          customer: data.customer,
          adults: data.adults,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
        })

        const calculations = RoomAccountService.calculateTotals({
          adults: data.adults,
          nights: data.nights,
          services: {
            camera: data.tableData.Room,
            lunch: data.tableData.Lunch,
            dinner: data.tableData.Dinner,
            minibar: data.tableData.Minibar,
            bar: data.tableData.Bar,
            custom1: data.tableData.Custom1,
            custom2: data.tableData.Custom2,
            transfer: data.tableData.Transfer,
          },
          extras: data.extras,
          transfer: data.transfer,
          advancePayment: data.advancePayment,
        })

        // IMPORTANTE: Non includere _id nei dati di aggiornamento
        const accountData = {
          roomNumber: currentRoomNumber,
          customer: data.customer,
          adults: data.adults,
          children: data.children,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          nights: data.nights,
          services: {
            camera: data.tableData.Room,
            lunch: data.tableData.Lunch,
            dinner: data.tableData.Dinner,
            minibar: data.tableData.Minibar,
            bar: data.tableData.Bar,
            custom1: data.tableData.Custom1,
            custom2: data.tableData.Custom2,
            transfer: data.tableData.Transfer,
          },
          minibarDescriptions: data.minibarDescriptions,
          serviceLabels: data.serviceLabels,
          extras: data.extras,
          transfer: data.transfer,
          advancePayment: data.advancePayment,
          notes: data.notes,
          tableDates: data.tableDates,
          calculations,
        }

        let success = false

        if (currentAccountId) {
          // Aggiorna account esistente
          console.log(`🔄 Updating existing account ${currentAccountId}`)
          const response = await fetch(`/api/room-accounts/${currentRoomNumber}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(accountData),
          })
          success = response.ok
          if (!success) {
            const error = await response.text()
            console.error(`❌ Update failed:`, error)
          }
        } else {
          // Crea nuovo account
          console.log(`🆕 Creating new account for room ${currentRoomNumber}`)
          const response = await fetch("/api/room-accounts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(accountData),
          })

          if (response.ok) {
            const result = await response.json()
            setAccountId(result.accountId)
            console.log(`🆔 New account created with ID: ${result.accountId}`)
            success = true
          } else {
            const error = await response.text()
            console.error(`❌ Create failed:`, error)
          }
        }

        if (success) {
          setLastSaved(new Date())
          lastSaveDataRef.current = currentDataString
          console.log(`✅ Save successful for room ${currentRoomNumber}`)

          // Notifica il cambiamento DOPO il salvataggio riuscito
          notifyRoomDataChanged(data, currentRoomNumber)

          return true
        } else {
          console.error("❌ Failed to save account")
          return false
        }
      } catch (error) {
        console.error("❌ Save error:", error)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [notifyRoomDataChanged],
  )

  // Salva IMMEDIATAMENTE senza debounce eccessivo
  const saveRoomData = useCallback(
    (data: RoomData) => {
      // Cancella qualsiasi timeout precedente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Salva immediatamente dopo 50ms (molto più veloce)
      saveTimeoutRef.current = setTimeout(() => {
        saveRoomDataInternal(data, roomNumber, accountId)
      }, 50)
    },
    [roomNumber, accountId, saveRoomDataInternal],
  )

  // Effetto per caricare i dati quando cambia la camera
  useEffect(() => {
    // Se c'è una camera precedente, salva IMMEDIATAMENTE prima di cambiare
    if (previousRoomRef.current && previousRoomRef.current !== roomNumber) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      console.log(`🔄 Switching from room ${previousRoomRef.current} to ${roomNumber}, saving immediately`)
      saveRoomDataInternal(roomData, previousRoomRef.current, accountId, true)
    }

    loadRoomData(roomNumber)
    previousRoomRef.current = roomNumber
  }, [roomNumber])

  // Salva prima di chiudere la finestra
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Salvataggio sincrono prima di chiudere
      navigator.sendBeacon(
        "/api/room-accounts/save-sync",
        JSON.stringify({
          roomNumber,
          data: roomData,
          accountId,
        }),
      )
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [roomNumber, roomData, accountId])

  // Cleanup del timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Funzione per aggiornare i dati e salvare IMMEDIATAMENTE
  const updateRoomData = useCallback(
    (updates: Partial<RoomData>) => {
      console.log(`📝 Updating room data:`, updates)

      setRoomData((prev) => {
        const newData = { ...prev, ...updates }

        // Rigenera le date se il check-in è cambiato
        if (updates.checkIn && updates.checkIn !== prev.checkIn) {
          newData.tableDates = RoomAccountService.generateTableDates(updates.checkIn)
          console.log(`📅 Regenerated table dates:`, newData.tableDates)
        }

        // Salva SEMPRE immediatamente
        console.log(`💾 Triggering immediate save for room ${roomNumber}`)
        saveRoomData(newData)

        return newData
      })
    },
    [saveRoomData, roomNumber],
  )

  // Funzione per azzerare il conto
  const clearAccount = useCallback(async () => {
    const success = await RoomAccountService.clearAccount(roomNumber)
    if (success) {
      await loadRoomData(roomNumber)
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
