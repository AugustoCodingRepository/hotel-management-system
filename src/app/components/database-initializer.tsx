"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface InitResult {
  success: boolean
  message: string
  stats?: {
    collections: string[]
    rooms: number
    users: number
    sampleAccounts: number
  }
}

export function DatabaseInitializer() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<InitResult | null>(null)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setResult(null)

    try {
      console.log("🚀 Inizio inizializzazione database...")

      const response = await fetch("/api/database/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

      // Controlla se la risposta è JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Risposta non JSON ricevuta:", textResponse.substring(0, 500))
        throw new Error(`Server ha restituito ${contentType} invece di JSON. Controlla i log del server.`)
      }

      const data = await response.json()
      console.log("📊 Dati ricevuti:", data)

      setResult(data)
    } catch (error) {
      console.error("❌ Errore durante l'inizializzazione:", error)

      setResult({
        success: false,
        message: `Errore: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🏨</span>
          <span>Inizializzazione Database Hotel</span>
        </CardTitle>
        <CardDescription>
          Crea tutte le collection necessarie e inizializza il database con i dati di base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Cosa verrà creato:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              ✅ Collection <code>rooms</code> - 28 camere (101-129, esclusa 113)
            </li>
            <li>
              ✅ Collection <code>room_accounts</code> - Conti delle camere
            </li>
            <li>
              ✅ Collection <code>hotel_settings</code> - Configurazioni hotel
            </li>
            <li>
              ✅ Collection <code>users</code> - Utenti sistema (admin, reception)
            </li>
            <li>
              ✅ Collection <code>audit_log</code> - Log delle modifiche
            </li>
            <li>✅ Indici per performance ottimali</li>
          </ul>
        </div>

        <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full" size="lg">
          {isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Inizializzazione in corso...
            </>
          ) : (
            <>🚀 Inizializza Database</>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{result.success ? "✅" : "❌"}</span>
              <span className={`font-medium ${result.success ? "text-green-900" : "text-red-900"}`}>
                {result.success ? "Inizializzazione Completata!" : "Errore nell'Inizializzazione"}
              </span>
            </div>

            <p className={`text-sm mb-3 ${result.success ? "text-green-800" : "text-red-800"}`}>{result.message}</p>

            {result.stats && (
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">Statistiche:</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Collections:</span>
                    <span className="ml-2 font-medium">{result.stats.collections.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Camere:</span>
                    <span className="ml-2 font-medium">{result.stats.rooms}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Utenti:</span>
                    <span className="ml-2 font-medium">{result.stats.users}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account esempio:</span>
                    <span className="ml-2 font-medium">{result.stats.sampleAccounts}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-gray-600 text-xs">Collections create:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.stats.collections.map((collection) => (
                      <span key={collection} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {collection}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {result?.success && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">🎯 Prossimi Passi:</h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Il database è ora pronto per l'uso</li>
              <li>Puoi iniziare a usare l'applicazione hotel</li>
              <li>L'account di esempio (camera 107) può essere eliminato</li>
              <li>Tutti i dati verranno salvati automaticamente</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
