"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

export function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<{
    hasMongoUri: boolean
    canConnect: boolean
    error?: string
  }>({
    hasMongoUri: false,
    canConnect: false,
  })

  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/env-check")
      const data = await response.json()
      setEnvStatus(data)
    } catch (error) {
      setEnvStatus({
        hasMongoUri: false,
        canConnect: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto",
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔧</span>
          <span>Configurazione</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${envStatus.hasMongoUri ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm">MONGODB_URI: {envStatus.hasMongoUri ? "✅ Presente" : "❌ Mancante"}</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${envStatus.canConnect ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm">Connessione: {envStatus.canConnect ? "✅ OK" : "❌ Errore"}</span>
        </div>

        {envStatus.error && (
          <div className="bg-red-50 p-2 rounded text-xs text-red-800">
            <strong>Errore:</strong> {envStatus.error}
          </div>
        )}

        {!envStatus.hasMongoUri && (
          <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
            <strong>Azione richiesta:</strong>
            <br />
            1. Crea file <code>.env.local</code>
            <br />
            2. Aggiungi <code>MONGODB_URI=...</code>
            <br />
            3. Riavvia il server
          </div>
        )}
      </CardContent>
    </Card>
  )
}
