import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const tablesCollection = db.collection("restaurant_tables")
    const revenueCollection = db.collection("daily_revenue")

    // 1. Libera tutti i tavoli occupati
    const occupiedTables = await tablesCollection.find({ status: "occupato" }).toArray()

    console.log(`Found ${occupiedTables.length} occupied tables to close`)

    // Per ogni tavolo occupato, archivia l'ordine se presente
    for (const table of occupiedTables) {
      if (table.orderItems && table.orderItems.length > 0) {
        const today = new Date()
        const dateStr = today.toLocaleDateString("it-IT").replace(/\//g, "_")

        // Raggruppa gli orderItems per prodotto per sommare le quantità
        const groupedItems = new Map()

        table.orderItems.forEach((item: any) => {
          const key = `${item.productId}_${item.productName}_${item.unitPrice}`

          if (groupedItems.has(key)) {
            const existing = groupedItems.get(key)
            existing.quantity += item.quantity
            existing.totalRevenue += item.totalPrice
          } else {
            groupedItems.set(key, {
              productId: item.productId,
              productName: item.productName,
              categoryName: item.categoryName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalRevenue: item.totalPrice,
              soldAt: new Date(),
              tableNumber: table.tableNumber,
            })
          }
        })

        const soldItems = Array.from(groupedItems.values())

        // Cerca se esiste già un documento per oggi
        const existingRevenue = await revenueCollection.findOne({ date: dateStr })

        if (existingRevenue) {
          // Aggiorna il documento esistente
          const existingSoldItems = existingRevenue.soldItems || []

          soldItems.forEach((newItem) => {
            const existingItemIndex = existingSoldItems.findIndex(
              (existing: any) => existing.productId === newItem.productId && existing.unitPrice === newItem.unitPrice,
            )

            if (existingItemIndex >= 0) {
              existingSoldItems[existingItemIndex].quantity += newItem.quantity
              existingSoldItems[existingItemIndex].totalRevenue += newItem.totalRevenue
            } else {
              existingSoldItems.push(newItem)
            }
          })

          const newTotalRevenue = existingRevenue.totalRevenue + table.orderTotal

          await revenueCollection.updateOne(
            { date: dateStr },
            {
              $set: {
                soldItems: existingSoldItems,
                totalRevenue: newTotalRevenue,
                updatedAt: new Date(),
              },
            },
          )
        } else {
          // Crea un nuovo documento per oggi
          const newRevenueDoc = {
            date: dateStr,
            collectionName: `Incassi_${dateStr}`,
            soldItems,
            totalRevenue: table.orderTotal,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          await revenueCollection.insertOne(newRevenueDoc)
        }
      }
    }

    // 2. Libera tutti i tavoli
    const result = await tablesCollection.updateMany(
      {},
      {
        $set: {
          status: "disponibile",
          orderItems: [],
          orderTotal: 0,
          assignedRoom: 0,
          updatedAt: new Date(),
        },
      },
    )

    // 3. Marca il revenue di oggi come chiuso
    const today = new Date()
    const dateStr = today.toLocaleDateString("it-IT").replace(/\//g, "_")

    await revenueCollection.updateOne(
      { date: dateStr },
      {
        $set: {
          closed: true,
          closedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log(`Day closure completed: ${result.modifiedCount} tables freed, revenue for ${dateStr} closed`)

    return NextResponse.json({
      success: true,
      message: "Chiusura giornaliera completata",
      details: {
        tablesFreed: result.modifiedCount,
        ordersArchived: occupiedTables.filter((t) => t.orderItems && t.orderItems.length > 0).length,
        date: dateStr,
        closedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error during day closure:", error)
    return NextResponse.json({ success: false, error: "Errore durante la chiusura giornaliera" }, { status: 500 })
  }
}
