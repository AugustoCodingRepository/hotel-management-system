"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { AddProductDialog } from "./add-product-dialog"
import { AddCategoryDialog } from "./add-category-dialog"
import { ArrowLeft, Plus, Trash2, Package } from "lucide-react"

interface Category {
  _id: string
  name: string
  createdAt: string
}

interface Product {
  _id: string
  name: string
  price: number
  categoryId: string
  categoryName: string
  createdAt: string
}

interface InventoryPageProps {
  onBack: () => void
}

export function InventoryPage({ onBack }: InventoryPageProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [categoriesRes, productsRes] = await Promise.all([fetch("/api/categories"), fetch("/api/products")])

      if (categoriesRes.ok && productsRes.ok) {
        const categoriesData = await categoriesRes.json()
        const productsData = await productsRes.json()
        setCategories(categoriesData.categories || [])
        setProducts(productsData.products || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setCategories([])
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il prodotto "${productName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter((p) => p._id !== productId))
      } else {
        const data = await response.json()
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert("Errore di connessione")
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const productsInCategory = Array.isArray(products) ? products.filter((p) => p.categoryId === categoryId) : []

    if (productsInCategory.length > 0) {
      alert(`Impossibile eliminare la categoria "${categoryName}". Contiene ${productsInCategory.length} prodotti.`)
      return
    }

    if (!confirm(`Sei sicuro di voler eliminare la categoria "${categoryName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCategories(categories.filter((c) => c._id !== categoryId))
        if (selectedCategory === categoryId) {
          setSelectedCategory("all")
        }
      } else {
        const data = await response.json()
        alert(`Errore: ${data.error}`)
      }
    } catch (error) {
      alert("Errore di connessione")
    }
  }

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
        return matchesCategory
      })
    : []

  const getProductCountForCategory = (categoryId: string) => {
    return Array.isArray(products) ? products.filter((p) => p.categoryId === categoryId).length : 0
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex">
      {/* Sidebar Categories */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Categorie</h2>
            <Button onClick={() => setShowAddCategory(true)} size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" />
              NUOVA
            </Button>
          </div>

          <Button onClick={() => setShowAddProduct(true)} className="w-full bg-blue-600 hover:bg-blue-700 mb-4">
            <Plus className="w-4 h-4 mr-2" />
            CREA PRODOTTO
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Tutte le categorie</span>
                <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">
                  {Array.isArray(products) ? products.length : 0}
                </span>
              </div>
            </button>

            {Array.isArray(categories) &&
              categories.map((category) => {
                const productCount = getProductCountForCategory(category._id)
                return (
                  <div key={category._id} className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(category._id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCategory === category._id
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">{productCount}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(category._id, category.name)}
                      className="w-full text-left px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      disabled={productCount > 0}
                      title={
                        productCount > 0 ? "Impossibile eliminare: categoria contiene prodotti" : "Elimina categoria"
                      }
                    >
                      {productCount > 0 ? "Contiene prodotti" : "Elimina"}
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="outline" className="flex items-center space-x-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                <span>Torna alla Sala</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-6 bg-gray-50">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nessun prodotto disponibile</h3>
              <p className="text-gray-500">
                {selectedCategory === "all"
                  ? "Inizia creando il tuo primo prodotto"
                  : "Questa categoria non contiene prodotti"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.categoryName}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Elimina prodotto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">€{product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddProductDialog
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={loadData}
        categories={categories}
      />

      <AddCategoryDialog
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onCategoryAdded={loadData}
      />
    </div>
  )
}
