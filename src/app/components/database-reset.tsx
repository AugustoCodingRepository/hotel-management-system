"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { AlertTriangle, RotateCcw, CheckCircle, XCircle } from "lucide-react"

export function DatabaseReset() {
  const [isResetting, setIsResetting] = useState(false)
  const [resetResult, setResetResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsResetting(true)
    setResetResult(null)

    try {
      const response = await fetch("/api/database/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResetResult(data)
      setShowConfirm(false)
    } catch (error) {
      setResetResult({
        success: false,
        message: "Errore di connessione durante il reset",
        details: error instanceof Error ? error.message : "Errore sconosciuto",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">Reset Database</CardTitle>
            <CardDescription className="text-red-600">
              ⚠️ ATTENZIONE: Questa operazione cancellerà tutti i dati del sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Cosa verrà eliminato:</h3>
              <ul className="text-red-700 space-y-1">
                <li>• Tutti gli account delle camere</li>
                <li>• Tutti gli ordini dei tavoli (tavoli resettati)</li>
                <li>• Tutto l'archivio incassi</li>
                <li>• Tutti i prodotti dell'inventario</li>
                <li>• Tutte le categorie dell'inventario</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Cosa NON verrà eliminato:</h3>
              <ul className="text-blue-700 space-y-1">
                <li>• Struttura database (collezioni vuote)</li>
              </ul>
            </div>

            {!showConfirm ? (
              <Button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {isResetting ? "Reset in corso..." : "Resetta Database"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold text-center">
                    Sei sicuro di voler procedere?
                    <br />
                    Questa operazione NON può essere annullata!
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isResetting ? "Resettando..." : "SÌ, RESETTA TUTTO"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isResetting}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            {resetResult && (
              <div
                className={`rounded-lg p-4 ${
                  resetResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {resetResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${resetResult.success ? "text-green-800" : "text-red-800"}`}>
                    {resetResult.success ? "Reset Completato!" : "Errore nel Reset"}
                  </span>
                </div>
                <p className={resetResult.success ? "text-green-700" : "text-red-700"}>{resetResult.message}</p>
                {resetResult.details && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(resetResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
