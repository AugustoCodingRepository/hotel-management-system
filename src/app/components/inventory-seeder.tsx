"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

export function InventorySeeder() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSeed = async () => {
    setIsSeeding(true)
    setResult(null)

    try {
      const response = await fetch("/api/inventory/seed", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Errore di connessione",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Inizializza Inventario</CardTitle>
        <CardDescription>Popola il database con categorie e prodotti di esempio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSeed} disabled={isSeeding} className="w-full">
          {isSeeding ? "Inizializzazione..." : "Inizializza Inventario"}
        </Button>

        {result && (
          <div
            className={`p-3 rounded-md text-sm ${
              result.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <p className="font-medium">{result.message}</p>
            {result.success && result.data && (
              <div className="mt-2 text-xs">
                <p>Categorie create: {result.data.categoriesInserted}</p>
                <p>Prodotti creati: {result.data.productsInserted}</p>
              </div>
            )}
            {!result.success && result.error && <p className="mt-1 text-xs">Errore: {result.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
