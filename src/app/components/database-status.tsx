"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"

interface DatabaseStatus {
  connected: boolean
  collections: string[]
  lastChecked: Date | null
  error?: string
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    collections: [],
    lastChecked: null,
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/database/status")
      const result = await response.json()

      setStatus({
        connected: result.success,
        collections: result.collections || [],
        lastChecked: new Date(),
        error: result.success ? undefined : result.message,
      })
    } catch (error) {
      setStatus({
        connected: false,
        collections: [],
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Errore di connessione",
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Stato Database</h3>
        <Button onClick={checkConnection} disabled={isChecking} size="sm">
          {isChecking ? "Controllo..." : "Ricontrolla"}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${status.connected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm font-medium">{status.connected ? "Connesso" : "Disconnesso"}</span>
        </div>

        {status.lastChecked && (
          <p className="text-xs text-gray-500">Ultimo controllo: {status.lastChecked.toLocaleTimeString("it-IT")}</p>
        )}

        {status.error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">Errore: {status.error}</p>}

        {status.collections.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Collections trovate:</p>
            <div className="flex flex-wrap gap-1">
              {status.collections.map((collection) => (
                <span key={collection} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {collection}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
