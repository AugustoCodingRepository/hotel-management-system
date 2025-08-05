"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface InitResult {
  success: boolean
  message: string
  stats?: {
    rooms: number
    accounts: number
    customServices: number
  }
}

export function RoomsInitializer() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<InitResult | null>(null)

  const initializeRooms = async () => {
    setIsInitializing(true)
    setResult(null)

    try {
      console.log("🚀 Inizio inizializzazione solo camere...")

      const response = await fetch("/api/rooms/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      console.log("📡 Response status:", response.status)

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
      console.error("❌ Errore durante l'inizializzazione camere:", error)

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
          <span>🛏️</span>
          <span>Setup Solo Camere</span>
        </CardTitle>
        <CardDescription>
          Inizializza solo le camere e i conti senza toccare prodotti/inventario della sala
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Cosa verrà fatto:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Crea/aggiorna camere (101-129, esclusa 113)</li>
            <li>✅ Aggiorna struttura conti camere con servizi personalizzabili</li>
            <li>
              ✅ Aggiunge <code>custom1</code> e <code>custom2</code> ai servizi
            </li>
            <li>
              ✅ Aggiunge <code>serviceLabels</code> per etichette modificabili
            </li>
            <li>✅ Mantiene tutti i prodotti/inventario esistenti</li>
            <li>✅ Crea indici per performance ottimali</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">✅ Vantaggi:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Non tocca prodotti/categorie già inseriti</li>
            <li>• Non tocca tavoli del ristorante</li>
            <li>• Aggiorna solo la struttura delle camere</li>
            <li>• Mantiene tutti i dati esistenti</li>
          </ul>
        </div>

        <Button onClick={initializeRooms} disabled={isInitializing} className="w-full" size="lg">
          {isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Setup in corso...
            </>
          ) : (
            <>🛏️ Setup Solo Camere</>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{result.success ? "✅" : "❌"}</span>
              <span className={`font-medium ${result.success ? "text-green-900" : "text-red-900"}`}>
                {result.success ? "Setup Camere Completato!" : "Errore nel Setup"}
              </span>
            </div>

            <p className={`text-sm mb-3 ${result.success ? "text-green-800" : "text-red-800"}`}>{result.message}</p>

            {result.stats && (
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">Statistiche:</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Camere:</span>
                    <span className="ml-2 font-medium">{result.stats.rooms}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account:</span>
                    <span className="ml-2 font-medium">{result.stats.accounts}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Servizi custom:</span>
                    <span className="ml-2 font-medium">{result.stats.customServices}</span>
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
              <li>Le camere sono ora pronte con i servizi personalizzabili</li>
              <li>Vai su "CAMERE" per testare le nuove righe Custom1/Custom2</li>
              <li>Le etichette dei servizi sono modificabili</li>
              <li>Tutti i prodotti della sala sono rimasti intatti</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
