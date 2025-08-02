"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { RealTimeClock } from "@/app/components/real-time-clock"

interface Product {
  _id: string
  name: string
  price: number
  categoryId: string
  categoryName?: string
}

interface Category {
  _id: string
  name: string
}

interface OrderItem {
  productId: string
  productName: string
  categoryName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface AddOrderItemsProps {
  tableNumber: number
  onBack: () => void
  onOrderConfirmed: () => void
}

export function AddOrderItems({ tableNumber, onBack, onOrderConfirmed }: AddOrderItemsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading products and categories...")

      // Carica categorie
      const categoriesResponse = await fetch("/api/categories")
      console.log("Categories response status:", categoriesResponse.status)
      const categoriesData = await categoriesResponse.json()
      console.log("Categories raw data:", categoriesData)

      // Carica prodotti
      const productsResponse = await fetch("/api/products")
      console.log("Products response status:", productsResponse.status)
      const productsData = await productsResponse.json()
      console.log("Products raw data:", productsData)

      // Accedi ai dati corretti dalla risposta API
      const categoriesList = categoriesData.categories || []
      const productsList = productsData.products || []

      console.log("Final categories:", categoriesList)
      console.log("Final products:", productsList)

      if (categoriesList.length > 0) {
        const categoriesMap = new Map(categoriesList.map((cat: Category) => [cat._id, cat.name]))

        const productsWithCategories = productsList.map((product: Product) => ({
          ...product,
          categoryName: categoriesMap.get(product.categoryId) || "Senza categoria",
        }))

        setCategories(categoriesList)
        setProducts(productsWithCategories)
      } else {
        setProducts(productsList)
      }

      console.log("✅ Data loaded successfully")
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addToOrder = (product: Product) => {
    const existingItem = orderItems.find((item) => item.productId === product._id)

    if (existingItem) {
      // Incrementa quantità se già presente
      setOrderItems((prev) =>
        prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item,
        ),
      )
    } else {
      // Aggiungi nuovo prodotto
      const newItem: OrderItem = {
        productId: product._id,
        productName: product.name,
        categoryName: product.categoryName || "Senza categoria",
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
      }
      setOrderItems((prev) => [...prev, newItem])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Rimuovi se quantità è 0 o negativa
      setOrderItems((prev) => prev.filter((item) => item.productId !== productId))
    } else {
      // Aggiorna quantità
      setOrderItems((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
            : item,
        ),
      )
    }
  }

  const submitOrder = async () => {
    if (orderItems.length === 0) {
      alert("Aggiungi almeno un prodotto all'ordine")
      return
    }

    try {
      setSubmitting(true)
      console.log("📤 Submitting order for table", tableNumber, "with items:", orderItems)

      // Invia ogni prodotto al tavolo
      for (const item of orderItems) {
        const response = await fetch(`/api/restaurant-tables/${tableNumber}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add_item",
            orderItem: {
              productId: item.productId,
              productName: item.productName,
              categoryName: item.categoryName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          }),
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || "Errore nell'aggiunta del prodotto")
        }
      }

      console.log("✅ Order submitted successfully")
      onOrderConfirmed()
    } catch (error) {
      console.error("❌ Error submitting order:", error)
      alert(`Errore nell'invio dell'ordine: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getTotalOrder = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  // Filtra prodotti per categoria
  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((product) => product.categoryId === selectedCategory)

  // Raggruppa prodotti per categoria per la visualizzazione
  const productsByCategory = categories.reduce(
    (acc, category) => {
      const categoryProducts = products.filter((product) => product.categoryId === category._id)
      if (categoryProducts.length > 0) {
        acc[category._id] = {
          category,
          products: categoryProducts,
        }
      }
      return acc
    },
    {} as Record<string, { category: Category; products: Product[] }>,
  )

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Aggiungi Ordine - Tavolo {tableNumber}</h1>
          <RealTimeClock />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Caricamento prodotti...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              ← Indietro
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Aggiungi Ordine - Tavolo {tableNumber}</h1>
          </div>
          <RealTimeClock />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">Errore nel caricamento: {error}</div>
            <Button onClick={loadData}>Riprova</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Indietro
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Aggiungi Ordine - Tavolo {tableNumber}</h1>
        </div>
        <RealTimeClock />
      </header>

      {/* Filtri categorie */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            onClick={() => setSelectedCategory("all")}
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
          >
            Tutte ({products.length})
          </Button>
          {categories.map((category) => {
            const categoryProductCount = products.filter((p) => p.categoryId === category._id).length
            return (
              <Button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                variant={selectedCategory === category._id ? "default" : "outline"}
                size="sm"
              >
                {category.name} ({categoryProductCount})
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Lista prodotti */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg border border-gray-200 h-full">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">
                {selectedCategory === "all"
                  ? `Tutti i Prodotti (${filteredProducts.length})`
                  : `${categories.find((c) => c._id === selectedCategory)?.name || "Categoria"} (${filteredProducts.length})`}
              </h2>
            </div>

            <div className="p-4 overflow-y-auto" style={{ height: "calc(100% - 80px)" }}>
              {filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">
                      {selectedCategory === "all"
                        ? "Nessun prodotto disponibile"
                        : "Nessun prodotto in questa categoria"}
                    </p>
                    <Button onClick={loadData} variant="outline">
                      Ricarica
                    </Button>
                  </div>
                </div>
              ) : selectedCategory === "all" ? (
                // Visualizzazione raggruppata per categoria quando "Tutte" è selezionato
                <div className="space-y-6">
                  {Object.values(productsByCategory).map(({ category, products: categoryProducts }) => (
                    <div key={category._id}>
                      <h3 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                        {category.name}
                      </h3>
                      <div className="space-y-2">
                        {categoryProducts.map((product) => {
                          const orderItem = orderItems.find((item) => item.productId === product._id)
                          const quantity = orderItem?.quantity || 0

                          return (
                            <div
                              key={product._id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm font-medium text-green-600">€{product.price.toFixed(2)}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <>
                                    <Button
                                      onClick={() => updateQuantity(product._id, quantity - 1)}
                                      variant="outline"
                                      size="sm"
                                      className="w-8 h-8 p-0"
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      value={quantity}
                                      onChange={(e) =>
                                        updateQuantity(product._id, Number.parseInt(e.target.value) || 0)
                                      }
                                      className="w-16 h-8 text-center"
                                      min="0"
                                    />
                                  </>
                                )}

                                <Button
                                  onClick={() => addToOrder(product)}
                                  variant="outline"
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Visualizzazione semplice quando una categoria specifica è selezionata
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const orderItem = orderItems.find((item) => item.productId === product._id)
                    const quantity = orderItem?.quantity || 0

                    return (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm font-medium text-green-600">€{product.price.toFixed(2)}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {quantity > 0 && (
                            <>
                              <Button
                                onClick={() => updateQuantity(product._id, quantity - 1)}
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => updateQuantity(product._id, Number.parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-center"
                                min="0"
                              />
                            </>
                          )}

                          <Button
                            onClick={() => addToOrder(product)}
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Riepilogo ordine */}
        <div className="w-80 p-6">
          <div className="bg-white rounded-lg border border-gray-200 h-full">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Ordine Corrente</h2>
            </div>

            <div className="p-4 flex flex-col h-full">
              {orderItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500 text-center">Nessun prodotto selezionato</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto mb-4">
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.productId} className="p-2 border border-gray-100 rounded">
                          <div className="font-medium text-sm">{item.productName}</div>
                          <div className="text-xs text-gray-500">{item.categoryName}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm">x{item.quantity}</span>
                            <span className="text-sm font-medium">€{item.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Totale:</span>
                      <span className="text-lg font-bold text-green-600">€{getTotalOrder().toFixed(2)}</span>
                    </div>

                    <Button onClick={submitOrder} disabled={submitting} className="w-full">
                      {submitting ? "Invio..." : "Invia Ordine"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
