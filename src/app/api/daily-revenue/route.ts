import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") // Formato: DD_MM_YYYY
    const limit = Number.parseInt(searchParams.get("limit") || "30")

    const { db } = await connectToDatabase()
    const collection = db.collection("daily_revenue")

    if (date) {
      // Ottieni incassi per una data specifica
      const revenue = await collection.findOne({ date })

      if (!revenue) {
        return NextResponse.json({
          success: true,
          revenue: null,
          message: "Nessun incasso trovato per questa data",
        })
      }

      return NextResponse.json({
        success: true,
        revenue,
      })
    } else {
      // Ottieni tutti gli incassi (ultimi N giorni)
      const revenues = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray()

      // Calcola statistiche
      const totalRevenue = revenues.reduce((sum, rev) => sum + rev.totalRevenue, 0)
      const totalDays = revenues.length
      const averageDaily = totalDays > 0 ? totalRevenue / totalDays : 0

      return NextResponse.json({
        success: true,
        revenues,
        statistics: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalDays,
          averageDaily: Math.round(averageDaily * 100) / 100,
        },
      })
    }
  } catch (error) {
    console.error("Error fetching daily revenue:", error)
    return NextResponse.json({ success: false, error: "Errore nel caricamento degli incassi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, soldItems } = body

    if (!date || !soldItems || !Array.isArray(soldItems)) {
      return NextResponse.json({ success: false, error: "Dati incompleti" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("daily_revenue")

    // Verifica se esiste già un record per questa data
    const existingRevenue = await collection.findOne({ date })

    if (existingRevenue) {
      return NextResponse.json({ success: false, error: "Incassi per questa data già esistenti" }, { status: 400 })
    }

    // Calcola il totale
    const totalRevenue = soldItems.reduce((sum: number, item: any) => sum + (item.totalRevenue || 0), 0)

    const newRevenue = {
      date,
      collectionName: `Incassi_${date}`,
      soldItems: soldItems.map((item: any) => ({
        ...item,
        soldAt: new Date(item.soldAt || new Date()),
      })),
      totalRevenue,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newRevenue)

    return NextResponse.json({
      success: true,
      message: "Record incassi creato",
      revenue: { ...newRevenue, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating daily revenue:", error)
    return NextResponse.json({ success: false, error: "Errore nella creazione del record incassi" }, { status: 500 })
  }
}
