import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Connecting to MongoDB for categories...")
    const { db } = await connectToDatabase()

    const categories = await db.collection("categories").find({}).toArray()
    console.log("Categories found:", categories.length)

    // Convert ObjectId to string for frontend compatibility
    const formattedCategories = categories.map((category) => ({
      ...category,
      _id: category._id.toString(),
    }))

    return NextResponse.json({ success: true, categories: formattedCategories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const result = await db.collection("categories").insertOne({
      name: body.name,
      description: body.description || "",
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      category: {
        _id: result.insertedId.toString(),
        name: body.name,
        description: body.description || "",
      },
    })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 })
  }
}
