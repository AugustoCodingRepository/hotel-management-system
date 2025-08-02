import { NextResponse } from "next/server"
import { seedInventory } from "@/app/scripts/seed-inventory"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "hotel_management"

export async function POST() {
  try {
    await seedInventory()
    return NextResponse.json({
      success: true,
      message: "Inventory seeded successfully",
    })
  } catch (error) {
    console.error("Error seeding inventory:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed inventory",
      },
      { status: 500 },
    )
  }
}
