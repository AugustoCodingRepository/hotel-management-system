import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const categoryId = params.categoryId

    // Verifica se l'ID è valido
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: "ID categoria non valido" }, { status: 400 })
    }

    // Controlla se ci sono prodotti che usano questa categoria
    const productsCount = await db.collection("products").countDocuments({
      categoryId: new ObjectId(categoryId),
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: "Impossibile eliminare la categoria. Contiene ancora prodotti." },
        { status: 400 },
      )
    }

    // Elimina la categoria
    const result = await db.collection("categories").deleteOne({
      _id: new ObjectId(categoryId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore eliminazione categoria:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
