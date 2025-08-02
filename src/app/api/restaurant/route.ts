import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const tables = await db.collection("restaurant_tables").find({}).toArray()

    return NextResponse.json(tables)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch restaurant data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")
    const body = await request.json()

    const result = await db.collection("restaurant_tables").insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create restaurant entry" }, { status: 500 })
  }
}
