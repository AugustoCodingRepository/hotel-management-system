// Script completo per inizializzare il database hotel da zero

import clientPromise from "@/lib/mongodb"

export async function initializeDatabase() {
  try {
    console.log("🏨 Inizializzazione database hotel...")
    console.log("🔗 MONGODB_URI presente:", !!process.env.MONGODB_URI)

    const client = await clientPromise
    console.log("✅ Client MongoDB connesso")

    const db = client.db("hotel_management")
    console.log("✅ Database 'hotel_management' selezionato")

    // Test di connessione
    await db.admin().ping()
    console.log("✅ Ping database riuscito")

    // 1. CREA COLLECTION ROOMS con tutte le camere (101-129, esclusa 113)
    console.log("📋 Creazione collection 'rooms'...")
    const roomsCollection = db.collection("rooms")

    // Elimina collection esistente se presente
    try {
      await roomsCollection.drop()
      console.log("🗑️ Collection rooms esistente eliminata")
    } catch (error) {
      // Collection non esisteva, va bene
    }

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

    // 2. CREA COLLECTION ROOM_ACCOUNTS (vuota, si popolerà con l'uso)
    console.log("📋 Creazione collection 'room_accounts'...")
    const accountsCollection = db.collection("room_accounts")

    try {
      await accountsCollection.drop()
      console.log("🗑️ Collection room_accounts esistente eliminata")
    } catch (error) {
      // Collection non esisteva, va bene
    }

    // Crea collection vuota con un documento di esempio (poi lo rimuoviamo)
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
    console.log("✅ Collection room_accounts creata con account di esempio")

    // 3. CREA COLLECTION HOTEL_SETTINGS
    console.log("📋 Creazione collection 'hotel_settings'...")
    const settingsCollection = db.collection("hotel_settings")

    try {
      await settingsCollection.drop()
      console.log("🗑️ Collection hotel_settings esistente eliminata")
    } catch (error) {
      // Collection non esisteva, va bene
    }

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

    // 4. CREA COLLECTION USERS
    console.log("📋 Creazione collection 'users'...")
    const usersCollection = db.collection("users")

    try {
      await usersCollection.drop()
      console.log("🗑️ Collection users esistente eliminata")
    } catch (error) {
      // Collection non esisteva, va bene
    }

    const defaultUsers = [
      {
        username: "admin",
        email: "admin@ilnido.it",
        role: "admin",
        permissions: [
          "view_rooms",
          "edit_accounts",
          "print_documents",
          "manage_checkin",
          "manage_checkout",
          "manage_users",
          "view_reports",
          "manage_settings",
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "reception1",
        email: "reception@ilnido.it",
        role: "reception",
        permissions: ["view_rooms", "edit_accounts", "print_documents", "manage_checkin", "manage_checkout"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    await usersCollection.insertMany(defaultUsers)
    console.log("✅ Utenti predefiniti creati")

    // 5. CREA COLLECTION AUDIT_LOG (vuota)
    console.log("📋 Creazione collection 'audit_log'...")
    const auditCollection = db.collection("audit_log")

    try {
      await auditCollection.drop()
      console.log("🗑️ Collection audit_log esistente eliminata")
    } catch (error) {
      // Collection non esisteva, va bene
    }

    // Inserisci un log di esempio
    const sampleLog = {
      action: "database_initialized",
      entityType: "system",
      entityId: "init_001",
      userId: "system",
      username: "system",
      changes: {
        field: "database",
        oldValue: "empty",
        newValue: "initialized",
      },
      timestamp: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "Database Init Script",
    }

    await auditCollection.insertOne(sampleLog)
    console.log("✅ Collection audit_log creata")

    // 6. CREA INDICI PER PERFORMANCE
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

    // Indici per users
    await usersCollection.createIndex({ username: 1 }, { unique: true })
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ role: 1 })

    // Indici per audit_log
    await auditCollection.createIndex({ timestamp: -1 })
    await auditCollection.createIndex({ entityType: 1, entityId: 1 })
    await auditCollection.createIndex({ userId: 1 })

    console.log("✅ Indici creati per performance ottimali")

    // 7. VERIFICA FINALE
    console.log("🔍 Verifica finale...")
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    const roomCount = await roomsCollection.countDocuments()
    const userCount = await usersCollection.countDocuments()

    console.log("🎉 DATABASE INIZIALIZZATO CON SUCCESSO!")
    console.log("📊 Statistiche:")
    console.log(`   - Collections create: ${collectionNames.join(", ")}`)
    console.log(`   - Camere inserite: ${roomCount}`)
    console.log(`   - Utenti creati: ${userCount}`)
    console.log(`   - Account di esempio: 1 (camera 107)`)

    return {
      success: true,
      message: "Database inizializzato correttamente",
      stats: {
        collections: collectionNames,
        rooms: roomCount,
        users: userCount,
        sampleAccounts: 1,
      },
    }
  } catch (error) {
    console.error("❌ ERRORE durante l'inizializzazione:", error)
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
  initializeDatabase().then((result) => {
    console.log("\n" + "=".repeat(50))
    console.log("RISULTATO FINALE:", result.success ? "✅ SUCCESSO" : "❌ ERRORE")
    if (result.stats) {
      console.log("STATISTICHE:", result.stats)
    }
    console.log("=".repeat(50))
    process.exit(result.success ? 0 : 1)
  })
}
