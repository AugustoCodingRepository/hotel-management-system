import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ tableNumber: string }> }) {
  try {
    const { tableNumber: tableNumberStr } = await params
    const tableNumber = Number.parseInt(tableNumberStr)

    if (isNaN(tableNumber)) {
      return NextResponse.json({ success: false, error: "Numero tavolo non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const tablesCollection = db.collection("restaurant_tables")
    const revenueCollection = db.collection("daily_revenue")

    // Trova il tavolo con l'ordine attivo
    const table = await tablesCollection.findOne({ tableNumber })

    if (!table) {
      return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
    }

    if (table.status !== "occupato" || table.orderItems.length === 0) {
      return NextResponse.json({ success: false, error: "Nessun ordine attivo su questo tavolo" }, { status: 400 })
    }

    // Prepara i dati per l'archivio incassi
    const today = new Date()
    const dateStr = today.toLocaleDateString("it-IT").replace(/\//g, "_")
    const collectionName = `Incassi_${dateStr}`

    // Cerca se esiste già un documento per oggi
    const existingRevenue = await revenueCollection.findOne({ date: dateStr })

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
          tableNumber: tableNumber,
        })
      }
    })

    const soldItems = Array.from(groupedItems.values())

    if (existingRevenue) {
      // Se esiste già un documento per oggi, aggiorna i prodotti esistenti o aggiungine di nuovi
      const existingSoldItems = existingRevenue.soldItems || []

      soldItems.forEach((newItem) => {
        const existingItemIndex = existingSoldItems.findIndex(
          (existing: any) => existing.productId === newItem.productId && existing.unitPrice === newItem.unitPrice,
        )

        if (existingItemIndex >= 0) {
          // Somma le quantità se il prodotto esiste già
          existingSoldItems[existingItemIndex].quantity += newItem.quantity
          existingSoldItems[existingItemIndex].totalRevenue += newItem.totalRevenue
        } else {
          // Aggiungi nuovo prodotto
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
        collectionName,
        soldItems,
        totalRevenue: table.orderTotal,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await revenueCollection.insertOne(newRevenueDoc)
    }

    // Pulisci il tavolo (torna disponibile)
    await tablesCollection.updateOne(
      { tableNumber },
      {
        $set: {
          orderItems: [],
          status: "disponibile",
          orderTotal: 0,
          assignedRoom: 0,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: `Ordine del tavolo ${tableNumber} chiuso e archiviato`,
      details: {
        itemsSold: soldItems.length,
        totalAmount: table.orderTotal,
        archivedTo: collectionName,
        date: dateStr,
      },
    })
  } catch (error) {
    console.error("Error closing order:", error)
    return NextResponse.json({ success: false, error: "Errore nella chiusura dell'ordine" }, { status: 500 })
  }
}
