import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { RoomAccountService } from "@/lib/room-account-service"

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const body = await request.json()

    console.log(`🆕 Creating new account for room ${body.roomNumber}`)
    console.log(`📊 Account data:`, {
      customer: body.customer,
      adults: body.adults,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    })

    // Genera ID account e date tabella usando i metodi statici
    const accountId = RoomAccountService.generateAccountId(body.roomNumber)
    const tableDates = RoomAccountService.generateTableDates(body.checkIn)
    const calculations = RoomAccountService.calculateTotals(body)

    console.log(`🆔 Generated account ID: ${accountId}`)

    const newAccount = {
      ...body,
      accountId,
      tableDates,
      calculations,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    console.log(`💾 Inserting account:`, newAccount)

    const result = await db.collection("room_accounts").insertOne(newAccount)

    console.log(`✅ Created account with MongoDB ID: ${result.insertedId}`)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      accountId,
    })
  } catch (error) {
    console.error("❌ Error creating account:", error)
    return NextResponse.json(
      {
        error: "Failed to create account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
