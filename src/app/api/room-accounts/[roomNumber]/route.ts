import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { RoomAccountService } from "@/lib/room-account-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomNumber: string }> }) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const { roomNumber: roomNumberStr } = await params
    const roomNumber = Number.parseInt(roomNumberStr)

    console.log(`🔍 Looking for room_account for room ${roomNumber}`)

    // Cerca nella collection CORRETTA: room_accounts
    const account = await db.collection("room_accounts").findOne({
      roomNumber,
      status: "active",
    })

    console.log(`📊 Found account for room ${roomNumber}:`, account ? "YES" : "NO")

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Assicurati che i dati siano nel formato corretto
    const formattedAccount = {
      _id: account._id,
      roomNumber: account.roomNumber,
      accountId: account.accountId,
      customer: account.customer || "",
      adults: account.adults || 2,
      children: account.children || 0,
      checkIn: account.checkIn,
      checkOut: account.checkOut,
      nights: account.nights || 1,
      services: account.services || {
        camera: {},
        colazione: {},
        pranzo: {},
        cena: {},
        minibar: {},
        transfer: {},
      },
      minibarDescriptions: account.minibarDescriptions || {},
      extras: account.extras || 0,
      transfer: account.transfer || 0,
      advancePayment: account.advancePayment || 0,
      notes: account.notes || "",
      calculations: account.calculations || {
        roomTotal: 0,
        servicesTotal: 0,
        extrasTotal: 0,
        transferTotal: 0,
        subtotal: 0,
        finalTotal: 0,
        cityTax: 0,
      },
      tableDates: account.tableDates || [],
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      lastModified: account.lastModified,
    }

    console.log(`✅ Returning formatted account for room ${roomNumber}`)
    return NextResponse.json(formattedAccount)
  } catch (error) {
    console.error("Error fetching room account:", error)
    return NextResponse.json({ error: "Failed to fetch room account" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ roomNumber: string }> }) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const { roomNumber: roomNumberStr } = await params
    const roomNumber = Number.parseInt(roomNumberStr)
    const body = await request.json()

    console.log(`💾 Updating room_account for room ${roomNumber}`)
    console.log(`📊 Update data:`, {
      customer: body.customer,
      adults: body.adults,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    })

    // Ricalcola i totali
    const calculations = RoomAccountService.calculateTotals(body)

    // Rigenera le date se il check-in è cambiato
    let tableDates = body.tableDates
    if (body.checkIn) {
      tableDates = RoomAccountService.generateTableDates(body.checkIn)
    }

    // IMPORTANTE: Rimuovi _id dai dati di aggiornamento per evitare l'errore MongoDB
    const { _id, ...updateDataWithoutId } = body

    const updateData = {
      ...updateDataWithoutId,
      calculations,
      tableDates,
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    console.log(`🔄 Executing update for room ${roomNumber}`)

    // Prima controlla se esiste un account attivo
    const existingAccount = await db.collection("room_accounts").findOne({
      roomNumber,
      status: "active",
    })

    if (existingAccount) {
      // Aggiorna account esistente
      console.log(`🔄 Updating existing account ${existingAccount.accountId}`)

      const result = await db
        .collection("room_accounts")
        .updateOne({ roomNumber, status: "active" }, { $set: updateData })

      console.log(`📊 Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`)

      if (result.matchedCount === 0) {
        console.log(`❌ No active account found for room ${roomNumber}`)
        return NextResponse.json({ error: "Account not found" }, { status: 404 })
      }
    } else {
      // Crea nuovo account se non esiste
      console.log(`🆕 No existing account, creating new one for room ${roomNumber}`)
      const accountId = RoomAccountService.generateAccountId(roomNumber)

      await db.collection("room_accounts").insertOne({
        ...updateData,
        roomNumber,
        accountId,
        status: "active",
        createdAt: new Date().toISOString(),
      })
    }

    console.log(`✅ Successfully updated room_account for room ${roomNumber}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error updating room account:", error)
    return NextResponse.json(
      {
        error: "Failed to update room account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
