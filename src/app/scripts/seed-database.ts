// Script to initialize the database with all rooms and default settings

import clientPromise from "@/lib/mongodb"

export async function seedDatabase() {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")

    console.log("🏨 Inizializzazione database hotel...")

    // 1. Create rooms collection with all rooms (101-129, excluding 113)
    const roomsCollection = db.collection("rooms")
    await roomsCollection.deleteMany({}) // Clear existing

    const rooms = []
    for (let i = 101; i <= 129; i++) {
      if (i === 113) continue // Skip room 113

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
        status: "available",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    await roomsCollection.insertMany(rooms)
    console.log(`✅ Inserite ${rooms.length} camere (101-129, esclusa 113)`)

    // 2. Create hotel settings
    const settingsCollection = db.collection("hotel_settings")
    await settingsCollection.deleteMany({})

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

    // 3. Create sample room accounts for testing
    const accountsCollection = db.collection("room_accounts")
    await accountsCollection.deleteMany({})

    const sampleAccounts = [
      {
        roomNumber: 107,
        accountId: "ACC_107_20250127_001",
        guest: {
          customer: "Joe Smith",
          adults: 2,
          children: 0,
          totalGuests: 2,
          nationality: "Italian",
          phone: "+39 123 456 7890",
          email: "joe.smith@email.com",
        },
        stay: {
          checkIn: "2025-07-22",
          checkOut: "2025-07-25",
          nights: 3,
          roomRate: 74.0,
          status: "checked_in",
        },
        services: {
          camera: {
            "2025-07-23": { amount: 74.0, description: "Camera standard" },
            "2025-07-24": { amount: 74.0, description: "Camera standard" },
            "2025-07-25": { amount: 74.0, description: "Camera standard" },
          },
          colazione: {},
          pranzo: {},
          cena: {},
          minibar: {
            "2025-07-24": {
              amount: 15.0,
              description: "Coca Cola, Acqua",
              items: [
                { item: "Coca Cola", quantity: 2, price: 3.5 },
                { item: "Acqua", quantity: 4, price: 2.0 },
              ],
            },
          },
          transfer: {},
        },
        calculations: {
          roomTotal: 222.0,
          servicesTotal: 15.0,
          extrasAmount: 0.0,
          transferAmount: 0.0,
          subtotal: 237.0,
          advancePayment: 0.0,
          finalTotal: 237.0,
          cityTax: {
            ratePerPersonPerNight: 2.0,
            totalAmount: 12.0,
            exemptions: [],
          },
        },
        payments: [],
        extras: {
          amount: 0.0,
          description: "",
          items: [],
        },
        transfer: {
          amount: 0.0,
          description: "",
          pickup: { location: "", time: "", date: "" },
          dropoff: { location: "", time: "", date: "" },
        },
        notes: "Cliente VIP - richiede camera silenziosa",
        printHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
        lastModifiedBy: "system",
      },
    ]

    await accountsCollection.insertMany(sampleAccounts)
    console.log("✅ Account di esempio inseriti")

    // 4. Create indexes for better performance
    await roomsCollection.createIndex({ number: 1 }, { unique: true })
    await roomsCollection.createIndex({ status: 1 })

    await accountsCollection.createIndex({ roomNumber: 1 })
    await accountsCollection.createIndex({ accountId: 1 }, { unique: true })
    await accountsCollection.createIndex({ "stay.checkIn": 1 })
    await accountsCollection.createIndex({ "stay.checkOut": 1 })
    await accountsCollection.createIndex({ "stay.status": 1 })

    console.log("✅ Indici creati per performance ottimali")

    // 5. Create default admin user
    const usersCollection = db.collection("users")
    await usersCollection.deleteMany({})

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
    await usersCollection.createIndex({ username: 1 }, { unique: true })
    await usersCollection.createIndex({ email: 1 }, { unique: true })

    console.log("✅ Utenti predefiniti creati")

    console.log("🎉 Database inizializzato con successo!")

    return {
      success: true,
      message: "Database inizializzato correttamente",
      stats: {
        rooms: rooms.length,
        accounts: sampleAccounts.length,
        users: defaultUsers.length,
      },
    }
  } catch (error) {
    console.error("❌ Errore durante l'inizializzazione:", error)
    return {
      success: false,
      message: `Errore: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      stats: null,
    }
  }
}

// Execute if run directly
if (require.main === module) {
  seedDatabase().then((result) => {
    console.log("Risultato:", result)
    process.exit(result.success ? 0 : 1)
  })
}
