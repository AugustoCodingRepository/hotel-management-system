"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RoomAccountService, type RoomAccountData } from "@/lib/room-account-service"

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

export function useRoomAccountDebug(roomNumber: number) {
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
  const [accountId, setAccountId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const previousRoomRef = useRef<number>()

  // Carica i dati quando cambia la camera
  const loadRoomData = useCallback(async (roomNum: number) => {
    console.log(`🔄 Loading data for room ${roomNum}`)
    setDebugInfo(`Loading room ${roomNum}...`)
    setIsLoading(true)

    try {
      // Prima prova a caricare dal database
      const account = await RoomAccountService.loadAccount(roomNum)
      console.log(`📊 Account loaded for room ${roomNum}:`, account)

      if (account) {
        console.log(`✅ Found existing account for room ${roomNum}`)
        setAccountId(account.accountId)
        setDebugInfo(`Loaded account: ${account.accountId}`)

        setRoomData({
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
            Camera: account.services.camera,
            Colazione: account.services.colazione,
            Pranzo: account.services.pranzo,
            Cena: account.services.cena,
            Minibar: account.services.minibar,
            Transfer: account.services.transfer,
          },
          minibarDescriptions: account.minibarDescriptions,
          tableDates: account.tableDates,
        })
      } else {
        console.log(`ℹ️ No existing account for room ${roomNum}, creating empty`)
        setAccountId(null)
        setDebugInfo(`No account found - empty room`)

        const today = new Date().toLocaleDateString("it-IT")
        const tableDates = RoomAccountService.generateTableDates(today)

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
          tableDates,
        })
      }
    } catch (error) {
      console.error(`❌ Error loading room ${roomNum}:`, error)
      setDebugInfo(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Salva i dati IMMEDIATAMENTE ad ogni modifica
  const saveRoomData = useCallback(
    async (data: RoomData) => {
      console.log(`💾 Saving data for room ${roomNumber}:`, data)

      // Cancella il timeout precedente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Salva dopo 500ms
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true)
        setDebugInfo(`Saving room ${roomNumber}...`)

        try {
          const calculations = RoomAccountService.calculateTotals({
            adults: data.adults,
            nights: data.nights,
            services: {
              camera: data.tableData.Camera,
              colazione: data.tableData.Colazione,
              pranzo: data.tableData.Pranzo,
              cena: data.tableData.Cena,
              minibar: data.tableData.Minibar,
              transfer: data.tableData.Transfer,
            },
            extras: data.extras,
            transfer: data.transfer,
            advancePayment: data.advancePayment,
          })

          const accountData: Partial<RoomAccountData> = {
            roomNumber,
            customer: data.customer,
            adults: data.adults,
            children: data.children,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            nights: data.nights,
            services: {
              camera: data.tableData.Camera,
              colazione: data.tableData.Colazione,
              pranzo: data.tableData.Pranzo,
              cena: data.tableData.Cena,
              minibar: data.tableData.Minibar,
              transfer: data.tableData.Transfer,
            },
            minibarDescriptions: data.minibarDescriptions,
            extras: data.extras,
            transfer: data.transfer,
            advancePayment: data.advancePayment,
            notes: data.notes,
            tableDates: data.tableDates,
            calculations,
          }

          // Se esiste un account, aggiungi l'ID
          if (accountId) {
            accountData._id = accountId
          }

          console.log(`💾 Saving account data:`, accountData)
          const success = await RoomAccountService.saveAccount(accountData)

          if (success) {
            setLastSaved(new Date())
            setDebugInfo(`Saved at ${new Date().toLocaleTimeString()}`)

            // Se era un nuovo account, ora abbiamo un ID
            if (!accountId) {
              const newId = RoomAccountService.generateAccountId(roomNumber)
              setAccountId(newId)
              console.log(`🆔 Generated new account ID: ${newId}`)
            }
          } else {
            console.error("❌ Failed to save account")
            setDebugInfo("Save failed!")
          }
        } catch (error) {
          console.error("❌ Save error:", error)
          setDebugInfo(`Save error: ${error instanceof Error ? error.message : "Unknown"}`)
        } finally {
          setIsSaving(false)
        }
      }, 500)
    },
    [roomNumber, accountId],
  )

  // Effetto per caricare i dati quando cambia la camera
  useEffect(() => {
    console.log(`🏠 Room changed from ${previousRoomRef.current} to ${roomNumber}`)

    // Se c'è una camera precedente, salva immediatamente
    if (previousRoomRef.current && previousRoomRef.current !== roomNumber) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      console.log(`💾 Immediate save for previous room ${previousRoomRef.current}`)
      saveRoomData(roomData)
    }

    loadRoomData(roomNumber)
    previousRoomRef.current = roomNumber
  }, [roomNumber, loadRoomData])

  // Cleanup del timeout
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
      console.log(`📝 Updating room data:`, updates)

      setRoomData((prev) => {
        const newData = { ...prev, ...updates }

        // Rigenera le date se il check-in è cambiato
        if (updates.checkIn && updates.checkIn !== prev.checkIn) {
          newData.tableDates = RoomAccountService.generateTableDates(updates.checkIn)
          console.log(`📅 Regenerated table dates:`, newData.tableDates)
        }

        saveRoomData(newData) // Salvataggio automatico
        return newData
      })
    },
    [saveRoomData],
  )

  // Funzione per azzerare il conto
  const clearAccount = useCallback(async () => {
    console.log(`🗑️ Clearing account for room ${roomNumber}`)
    const success = await RoomAccountService.clearAccount(roomNumber)
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
    debugInfo, // Info di debug
  }
}
