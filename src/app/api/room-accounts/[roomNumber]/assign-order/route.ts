import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomNumber: string }> }) {
  try {
    const { roomNumber } = await params
    const roomNum = Number.parseInt(roomNumber)
    const body = await request.json()

    console.log(`🏠 Assigning order to room ${roomNum}:`, body)

    const { tableNumber, orderTotal, mealType, operationDate } = body
    let { covers } = body

    const { db } = await connectToDatabase()

    // Se covers non è presente o è undefined, assumiamo 0
    if (covers === undefined || covers === null) {
      covers = 0
      console.log(`👥 Covers not provided, assuming 0`)
    }

    // Trova l'account della camera
    const account = await db.collection("room_accounts").findOne({
      roomNumber: roomNum,
      status: "active",
    })

    if (!account) {
      console.log(`❌ No active account found for room ${roomNum}`)
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    console.log(`📊 Found account for room ${roomNum}:`, account.accountId)

    // Prepara i servizi aggiornati
    const updatedServices = { ...account.services }

    // Determina la sezione corretta basandosi sui coperti
    let serviceSection: string
    if (covers === 0) {
      serviceSection = "bar"
      console.log(`🍸 Assigning to BAR (covers = ${covers})`)
    } else {
      serviceSection = mealType === "dinner" ? "dinner" : "lunch"
      console.log(`🍽️ Assigning to ${serviceSection.toUpperCase()} (covers = ${covers})`)
    }

    if (!updatedServices[serviceSection]) {
      updatedServices[serviceSection] = {}
    }

    // Aggiungi SOLO IL VALORE alla data specifica, non l'oggetto completo
    const currentValue = updatedServices[serviceSection][operationDate] || 0
    const newValue = currentValue + orderTotal

    updatedServices[serviceSection][operationDate] = newValue

    console.log(`📝 Adding to ${serviceSection}[${operationDate}]: ${currentValue} + ${orderTotal} = ${newValue}`)

    // Ricalcola i totali
    let servicesTotal = 0
    Object.values(updatedServices).forEach((section: any) => {
      Object.values(section).forEach((value: any) => {
        if (typeof value === "number") {
          servicesTotal += value
        }
      })
    })

    const updatedCalculations = {
      ...account.calculations,
      servicesTotal,
      subtotal: (account.calculations?.roomTotal || 0) + servicesTotal,
      finalTotal: (account.calculations?.roomTotal || 0) + servicesTotal - (account.calculations?.advancePayment || 0),
    }

    // Aggiorna l'account nel database
    const result = await db.collection("room_accounts").updateOne(
      { roomNumber: roomNum, status: "active" },
      {
        $set: {
          services: updatedServices,
          calculations: updatedCalculations,
          updatedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      },
    )

    console.log(`📊 Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    // Aggiorna il tavolo per assegnarlo alla camera SENZA cancellare l'ordine
    await db.collection("restaurant_tables").updateOne(
      { tableNumber },
      {
        $set: {
          assignedRoom: roomNum,
          updatedAt: new Date(),
        },
      },
    )

    console.log(`✅ Successfully assigned order from table ${tableNumber} to room ${roomNum}`)
    console.log(`💰 Added €${orderTotal} to ${serviceSection} for date ${operationDate}`)

    return NextResponse.json({
      success: true,
      message: `Order assigned to room ${roomNum}`,
      serviceSection,
      operationDate,
      amount: orderTotal,
      newValue,
    })
  } catch (error) {
    console.error("❌ Error assigning order to room:", error)
    return NextResponse.json(
      {
        error: "Failed to assign order to room",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
