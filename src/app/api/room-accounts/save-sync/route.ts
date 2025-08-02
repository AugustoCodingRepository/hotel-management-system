import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { RoomAccountService } from "@/lib/room-account-service"

// Endpoint per salvataggio sincrono (beacon)
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const body = await request.json()

    const { roomNumber, data, accountId } = body

    console.log(`🚨 Emergency save for room ${roomNumber}`)

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

    const updateData = {
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
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    if (accountId) {
      // Aggiorna account esistente
      await db.collection("room_accounts").updateOne({ roomNumber, status: "active" }, { $set: updateData })
    } else {
      // Crea nuovo account se ha dati significativi
      if (data.customer || Object.keys(data.tableData.Camera).length > 0) {
        const newAccountId = RoomAccountService.generateAccountId(roomNumber)
        await db.collection("room_accounts").insertOne({
          ...updateData,
          roomNumber,
          accountId: newAccountId,
          status: "active",
          createdAt: new Date().toISOString(),
        })
      }
    }

    console.log(`✅ Emergency save completed for room ${roomNumber}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Emergency save error:", error)
    return NextResponse.json({ error: "Emergency save failed" }, { status: 500 })
  }
}
