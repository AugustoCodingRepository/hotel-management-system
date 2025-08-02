import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    console.log("Connecting to MongoDB for products...")
    const { db } = await connectToDatabase()

    const products = await db.collection("products").find({}).toArray()
    console.log("Products found:", products.length)

    // Convert ObjectId to string and ensure required fields
    const formattedProducts = products.map((product) => ({
      ...product,
      _id: product._id.toString(),
      categoryId: product.categoryId?.toString() || "",
      quantity: product.quantity || 0,
      unit: product.unit || "pz",
    }))

    return NextResponse.json({ success: true, products: formattedProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const result = await db.collection("products").insertOne({
      name: body.name,
      categoryId: new ObjectId(body.categoryId),
      price: Number.parseFloat(body.price),
      quantity: Number.parseInt(body.quantity) || 0,
      unit: body.unit || "pz",
      description: body.description || "",
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      product: {
        _id: result.insertedId.toString(),
        name: body.name,
        categoryId: body.categoryId,
        price: Number.parseFloat(body.price),
        quantity: Number.parseInt(body.quantity) || 0,
        unit: body.unit || "pz",
        description: body.description || "",
      },
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}
