import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { accountId: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")

    const account = await db.collection("room_accounts").findOne({ accountId: params.accountId })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error fetching account:", error)
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { accountId: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const body = await request.json()

    const updateData = {
      ...body,
      updatedAt: new Date(),
      lastModifiedBy: "system", // TODO: Get from auth
    }

    const result = await db.collection("room_accounts").updateOne({ accountId: params.accountId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Log the action
    await db.collection("audit_log").insertOne({
      action: "account_updated",
      entityType: "room_account",
      entityId: params.accountId,
      roomNumber: body.roomNumber,
      userId: "system",
      username: "system",
      changes: body.changes || {},
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating account:", error)
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { accountId: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")

    const result = await db.collection("room_accounts").deleteOne({ accountId: params.accountId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Log the action
    await db.collection("audit_log").insertOne({
      action: "account_deleted",
      entityType: "room_account",
      entityId: params.accountId,
      userId: "system",
      username: "system",
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
