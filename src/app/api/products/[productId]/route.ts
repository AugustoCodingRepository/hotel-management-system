import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const { productId } = params

    const updateData: any = {}
    if (body.quantity !== undefined) {
      updateData.quantity = Number.parseInt(body.quantity)
    }
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.price !== undefined) {
      updateData.price = Number.parseFloat(body.price)
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit
    }
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    updateData.updatedAt = new Date()

    const result = await db.collection("products").updateOne({ _id: new ObjectId(productId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { productId } = params

    const result = await db.collection("products").deleteOne({
      _id: new ObjectId(productId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 })
  }
}
