import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: { roomNumber: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const roomNumber = Number.parseInt(params.roomNumber)

    // Azzera tutti i servizi e calcoli
    const clearedData = {
      services: {
        camera: {},
        colazione: {},
        pranzo: {},
        cena: {},
        minibar: {},
        transfer: {},
      },
      minibarDescriptions: {},
      extras: 0,
      transfer: 0,
      advancePayment: 0,
      calculations: {
        roomTotal: 0,
        servicesTotal: 0,
        extrasTotal: 0,
        transferTotal: 0,
        subtotal: 0,
        finalTotal: 0,
        cityTax: 0,
      },
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    const result = await db
      .collection("room_accounts")
      .updateOne({ roomNumber, status: "active" }, { $set: clearedData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing account:", error)
    return NextResponse.json({ error: "Failed to clear account" }, { status: 500 })
  }
}
