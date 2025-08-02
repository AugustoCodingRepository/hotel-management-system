import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const rooms = await db.collection("rooms").find({}).toArray()

    return NextResponse.json(rooms)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const body = await request.json()

    const result = await db.collection("rooms").insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
