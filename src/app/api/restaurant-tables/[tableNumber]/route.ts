import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ tableNumber: string }> }) {
  try {
    const { tableNumber: tableNumberStr } = await params
    const tableNumber = Number.parseInt(tableNumberStr)

    if (isNaN(tableNumber)) {
      return NextResponse.json({ success: false, error: "Numero tavolo non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("restaurant_tables")

    const table = await collection.findOne({ tableNumber })

    if (!table) {
      return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      table,
    })
  } catch (error) {
    console.error("Error fetching table:", error)
    return NextResponse.json({ success: false, error: "Errore nel caricamento del tavolo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ tableNumber: string }> }) {
  try {
    const { tableNumber: tableNumberStr } = await params
    const tableNumber = Number.parseInt(tableNumberStr)
    const body = await request.json()

    if (isNaN(tableNumber)) {
      return NextResponse.json({ success: false, error: "Numero tavolo non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("restaurant_tables")

    const { action, orderItem, assignedRoom } = body

    if (action === "add_item") {
      // Aggiungi prodotto all'ordine
      const { productId, productName, categoryName, quantity, unitPrice } = orderItem

      if (!productId || !productName || !quantity || !unitPrice) {
        return NextResponse.json({ success: false, error: "Dati prodotto incompleti" }, { status: 400 })
      }

      // Trova il tavolo
      const existingTable = await collection.findOne({ tableNumber })

      if (!existingTable) {
        // Crea nuovo tavolo se non esiste
        const newTable = {
          tableNumber,
          assignedRoom: 0,
          orderItems: [],
          status: "disponibile",
          orderTotal: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await collection.insertOne(newTable)
      }

      // Controlla se il prodotto esiste già nell'ordine
      const table = await collection.findOne({ tableNumber })
      const existingItemIndex = table.orderItems.findIndex((item: any) => item.productId === productId)

      if (existingItemIndex >= 0) {
        // Il prodotto esiste già, aggiorna la quantità
        const existingItem = table.orderItems[existingItemIndex]
        const newQuantity = existingItem.quantity + Number.parseInt(quantity)
        const newTotalPrice = newQuantity * Number.parseFloat(unitPrice)

        const result = await collection.updateOne(
          { tableNumber, "orderItems.productId": productId },
          {
            $set: {
              "orderItems.$.quantity": newQuantity,
              "orderItems.$.totalPrice": newTotalPrice,
              "orderItems.$.addedAt": new Date(),
              status: "occupato",
              updatedAt: new Date(),
            },
          },
        )

        if (result.matchedCount === 0) {
          return NextResponse.json({ success: false, error: "Errore nell'aggiornamento del prodotto" }, { status: 500 })
        }

        console.log(
          `✅ Updated existing product ${productName}: ${existingItem.quantity} + ${quantity} = ${newQuantity}`,
        )
      } else {
        // Il prodotto non esiste, aggiungilo come nuovo
        const newOrderItem = {
          productId,
          productName,
          categoryName,
          quantity: Number.parseInt(quantity),
          unitPrice: Number.parseFloat(unitPrice),
          totalPrice: Number.parseInt(quantity) * Number.parseFloat(unitPrice),
          addedAt: new Date(),
        }

        const result = await collection.updateOne(
          { tableNumber },
          {
            $push: { orderItems: newOrderItem },
            $set: {
              status: "occupato",
              updatedAt: new Date(),
            },
          },
        )

        if (result.matchedCount === 0) {
          return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
        }

        console.log(`✅ Added new product ${productName} with quantity ${quantity}`)
      }

      // Ricalcola il totale
      const updatedTable = await collection.findOne({ tableNumber })
      const newTotal = updatedTable?.orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0

      await collection.updateOne({ tableNumber }, { $set: { orderTotal: newTotal } })

      return NextResponse.json({
        success: true,
        message: existingItemIndex >= 0 ? "Quantità prodotto aggiornata" : "Prodotto aggiunto all'ordine",
        orderTotal: newTotal,
      })
    } else if (action === "update_quantity") {
      // Aggiorna quantità di un prodotto esistente
      const { productId, quantity } = orderItem

      if (!productId || quantity === undefined) {
        return NextResponse.json(
          { success: false, error: "Dati incompleti per aggiornamento quantità" },
          { status: 400 },
        )
      }

      const newQuantity = Number.parseInt(quantity)
      if (newQuantity < 0) {
        return NextResponse.json({ success: false, error: "La quantità non può essere negativa" }, { status: 400 })
      }

      // Trova il prodotto nell'ordine per ottenere il prezzo unitario
      const table = await collection.findOne({ tableNumber })
      if (!table) {
        return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
      }

      const existingItem = table.orderItems.find((item: any) => item.productId === productId)
      if (!existingItem) {
        return NextResponse.json({ success: false, error: "Prodotto non trovato nell'ordine" }, { status: 404 })
      }

      const newTotalPrice = newQuantity * existingItem.unitPrice

      const result = await collection.updateOne(
        { tableNumber, "orderItems.productId": productId },
        {
          $set: {
            "orderItems.$.quantity": newQuantity,
            "orderItems.$.totalPrice": newTotalPrice,
            "orderItems.$.addedAt": new Date(),
            updatedAt: new Date(),
          },
        },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: "Errore nell'aggiornamento della quantità" }, { status: 500 })
      }

      // Ricalcola il totale
      const updatedTable = await collection.findOne({ tableNumber })
      const newTotal = updatedTable?.orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0

      // Aggiorna lo stato del tavolo
      const newStatus = newTotal > 0 ? "occupato" : "disponibile"

      await collection.updateOne(
        { tableNumber },
        {
          $set: {
            orderTotal: newTotal,
            status: newStatus,
          },
        },
      )

      console.log(`✅ Updated quantity for product ${existingItem.productName} to ${newQuantity}`)

      return NextResponse.json({
        success: true,
        message: "Quantità aggiornata con successo",
        orderTotal: newTotal,
        status: newStatus,
      })
    } else if (action === "remove_item") {
      // Rimuovi prodotto dall'ordine
      const { productId } = orderItem

      const result = await collection.updateOne(
        { tableNumber },
        {
          $pull: { orderItems: { productId } },
          $set: { updatedAt: new Date() },
        },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
      }

      // Ricalcola il totale e lo stato
      const updatedTable = await collection.findOne({ tableNumber })
      const newTotal = updatedTable?.orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0

      const newStatus = newTotal > 0 ? "occupato" : "disponibile"

      await collection.updateOne(
        { tableNumber },
        {
          $set: {
            orderTotal: newTotal,
            status: newStatus,
          },
        },
      )

      return NextResponse.json({
        success: true,
        message: "Prodotto rimosso dall'ordine",
        orderTotal: newTotal,
        status: newStatus,
      })
    } else if (action === "assign_room") {
      // Assegna camera al tavolo
      const roomNumber = Number.parseInt(assignedRoom) || 0

      const result = await collection.updateOne(
        { tableNumber },
        {
          $set: {
            assignedRoom: roomNumber,
            updatedAt: new Date(),
          },
        },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: roomNumber > 0 ? `Camera ${roomNumber} assegnata al tavolo` : "Camera rimossa dal tavolo",
        assignedRoom: roomNumber,
      })
    } else {
      return NextResponse.json({ success: false, error: "Azione non valida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json({ success: false, error: "Errore nell'aggiornamento del tavolo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tableNumber: string }> }) {
  try {
    const { tableNumber: tableNumberStr } = await params
    const tableNumber = Number.parseInt(tableNumberStr)

    if (isNaN(tableNumber)) {
      return NextResponse.json({ success: false, error: "Numero tavolo non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("restaurant_tables")

    const result = await collection.deleteOne({ tableNumber })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Tavolo non trovato" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Tavolo ${tableNumber} eliminato`,
    })
  } catch (error) {
    console.error("Error deleting table:", error)
    return NextResponse.json({ success: false, error: "Errore nell'eliminazione del tavolo" }, { status: 500 })
  }
}
