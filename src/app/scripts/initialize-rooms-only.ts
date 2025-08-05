// Script per inizializzare solo le camere senza toccare prodotti/inventario

import clientPromise from "@/lib/mongodb"

export async function initializeRoomsOnly() {
  try {
    console.log("🏨 Inizializzazione solo camere...")
    console.log("🔗 MONGODB_URI presente:", !!process.env.MONGODB_URI)

    const client = await clientPromise
    console.log("✅ Client MongoDB connesso")

    const db = client.db("hotel_management")
    console.log("✅ Database 'hotel_management' selezionato")

    // Test di connessione
    await db.admin().ping()
    console.log("✅ Ping database riuscito")

    // 1. AGGIORNA COLLECTION ROOMS (se non esiste la crea)
    console.log("📋 Aggiornamento collection 'rooms'...")
    const roomsCollection = db.collection("rooms")

    // Controlla se esistono già camere
    const existingRoomsCount = await roomsCollection.countDocuments()
    console.log(`📊 Camere esistenti: ${existingRoomsCount}`)

    if (existingRoomsCount === 0) {
      // Crea tutte le camere se non esistono
      const rooms = []
      for (let i = 101; i <= 129; i++) {
        if (i === 113) continue // Salta camera 113

        const floor = Math.floor(i / 100)
        rooms.push({
          number: i,
          floor: floor,
          type: i <= 110 ? "standard" : i <= 120 ? "deluxe" : "suite",
          capacity: {
            adults: 2,
            children: 1,
            total: 3,
          },
          amenities: ["minibar", "tv", "wifi", "ac", "safe"],
          status: "available", // available, occupied, maintenance, cleaning
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      await roomsCollection.insertMany(rooms)
      console.log(`✅ Inserite ${rooms.length} camere (101-129, esclusa 113)`)
    } else {
      console.log("✅ Camere già esistenti, salto la creazione")
    }

    // 2. AGGIORNA COLLECTION ROOM_ACCOUNTS con nuova struttura
    console.log("📋 Aggiornamento collection 'room_accounts'...")
    const accountsCollection = db.collection("room_accounts")

    // Controlla se ci sono account esistenti
    const existingAccounts = await accountsCollection.find({}).toArray()
    console.log(`📊 Account esistenti: ${existingAccounts.length}`)

    // Aggiorna tutti gli account esistenti per aggiungere i nuovi campi se mancano
    for (const account of existingAccounts) {
      const updates: any = {}
      let needsUpdate = false

      // Aggiungi serviceLabels se manca
      if (!account.serviceLabels) {
        updates.serviceLabels = {
          camera: "Camera",
          colazione: "Colazione",
          pranzo: "Pranzo",
          cena: "Cena",
          minibar: "Minibar",
          transfer: "Transfer",
          custom1: "Servizio 1",
          custom2: "Servizio 2",
        }
        needsUpdate = true
      }

      // Aggiungi custom1 e custom2 ai services se mancano
      if (!account.services.custom1) {
        updates["services.custom1"] = {}
        needsUpdate = true
      }
      if (!account.services.custom2) {
        updates["services.custom2"] = {}
        needsUpdate = true
      }

      // Aggiorna updatedAt
      if (needsUpdate) {
        updates.updatedAt = new Date().toISOString()

        await accountsCollection.updateOne({ _id: account._id }, { $set: updates })
        console.log(`✅ Aggiornato account camera ${account.roomNumber}`)
      }
    }

    // Se non ci sono account, crea un account di esempio con la nuova struttura
    if (existingAccounts.length === 0) {
      const sampleAccount = {
        roomNumber: 107,
        accountId: "ACC_107_20250127_001",
        customer: "Mario Rossi",
        adults: 2,
        children: 0,
        checkIn: "27/01/2025",
        checkOut: "30/01/2025",
        nights: 3,
        services: {
          camera: {
            "28/01/2025": "74.00",
            "29/01/2025": "74.00",
            "30/01/2025": "74.00",
          },
          colazione: {},
          pranzo: {},
          cena: {},
          minibar: {
            "28/01/2025": "15.00",
          },
          transfer: {},
          custom1: {},
          custom2: {},
        },
        serviceLabels: {
          camera: "Camera",
          colazione: "Colazione",
          pranzo: "Pranzo",
          cena: "Cena",
          minibar: "Minibar",
          transfer: "Transfer",
          custom1: "Servizio 1",
          custom2: "Servizio 2",
        },
        minibarDescriptions: {
          "28/01/2025": "Coca Cola, Acqua",
        },
        extras: 0.0,
        transfer: 0.0,
        advancePayment: 0.0,
        notes: "Account di esempio - puoi eliminarlo",
        calculations: {
          roomTotal: 222.0,
          servicesTotal: 15.0,
          extrasTotal: 0.0,
          transferTotal: 0.0,
          subtotal: 237.0,
          finalTotal: 237.0,
          cityTax: 12.0,
        },
        tableDates: ["27/01/2025", "28/01/2025", "29/01/2025", "30/01/2025", "31/01/2025", "01/02/2025", "02/02/2025"],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      }

      await accountsCollection.insertOne(sampleAccount)
      console.log("✅ Account di esempio creato con nuova struttura")
    }

    // 3. CREA/AGGIORNA HOTEL_SETTINGS solo se non esistono
    console.log("📋 Controllo collection 'hotel_settings'...")
    const settingsCollection = db.collection("hotel_settings")

    const existingSettings = await settingsCollection.findOne({})
    if (!existingSettings) {
      const hotelSettings = {
        hotel: {
          name: "Il Nido",
          fullName: "Hotel Il Nido Restaurant",
          address: "Via Nastro Verde 82",
          city: "Sorrento",
          postalCode: "80067",
          country: "Italy",
          phone: "+39 081 878 2706",
          fax: "+39 081 807 3304",
          email: "info@ilnido.it",
          website: "ilnido.it",
          stars: 3,
          taxId: "IT12345678901",
        },
        rates: {
          cityTax: {
            adultRate: 2.0,
            childRate: 0.0,
            maxNights: 7,
            exemptAges: [0, 1, 2],
          },
          roomRates: {
            standard: 74.0,
            deluxe: 95.0,
            suite: 150.0,
          },
          serviceRates: {
            colazione: 12.0,
            pranzo: 25.0,
            cena: 35.0,
            custom1: 0.0,
            custom2: 0.0,
          },
        },
        printing: {
          defaultPrinter: "HP LaserJet Pro",
          defaultCopies: 2,
          paperSize: "A4",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await settingsCollection.insertOne(hotelSettings)
      console.log("✅ Configurazione hotel inserita")
    } else {
      // Aggiorna solo i serviceRates se mancano custom1/custom2
      if (!existingSettings.rates?.serviceRates?.custom1) {
        await settingsCollection.updateOne(
          {},
          {
            $set: {
              "rates.serviceRates.custom1": 0.0,
              "rates.serviceRates.custom2": 0.0,
              updatedAt: new Date(),
            },
          },
        )
        console.log("✅ Aggiunti custom1/custom2 alle tariffe servizi")
      } else {
        console.log("✅ Configurazione hotel già esistente")
      }
    }

    // 4. CREA INDICI PER PERFORMANCE (solo per camere)
    console.log("🔍 Creazione indici per performance...")

    // Indici per rooms
    await roomsCollection.createIndex({ number: 1 }, { unique: true })
    await roomsCollection.createIndex({ status: 1 })
    await roomsCollection.createIndex({ type: 1 })

    // Indici per room_accounts
    await accountsCollection.createIndex({ roomNumber: 1 })
    await accountsCollection.createIndex({ accountId: 1 }, { unique: true })
    await accountsCollection.createIndex({ status: 1 })
    await accountsCollection.createIndex({ checkIn: 1 })
    await accountsCollection.createIndex({ checkOut: 1 })

    console.log("✅ Indici creati per performance ottimali")

    // 5. VERIFICA FINALE
    console.log("🔍 Verifica finale...")
    const roomCount = await roomsCollection.countDocuments()
    const accountCount = await accountsCollection.countDocuments()

    console.log("🎉 SETUP CAMERE COMPLETATO CON SUCCESSO!")
    console.log("📊 Statistiche:")
    console.log(`   - Camere totali: ${roomCount}`)
    console.log(`   - Account camere: ${accountCount}`)
    console.log(`   - Servizi personalizzabili: custom1, custom2`)
    console.log(`   - Etichette servizi: configurabili`)

    return {
      success: true,
      message: "Setup camere completato correttamente",
      stats: {
        rooms: roomCount,
        accounts: accountCount,
        customServices: 2,
      },
    }
  } catch (error) {
    console.error("❌ ERRORE durante il setup camere:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "N/A")

    return {
      success: false,
      message: `Errore: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      stats: null,
      errorDetails: error instanceof Error ? error.stack : String(error),
    }
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  initializeRoomsOnly().then((result) => {
    console.log("\n" + "=".repeat(50))
    console.log("RISULTATO FINALE:", result.success ? "✅ SUCCESSO" : "❌ ERRORE")
    if (result.stats) {
      console.log("STATISTICHE:", result.stats)
    }
    console.log("=".repeat(50))
    process.exit(result.success ? 0 : 1)
  })
}
