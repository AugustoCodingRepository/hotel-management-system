"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface TestResult {
  success: boolean
  message: string
  details?: string
}

export function PrinterTest() {
  const [printerIp, setPrinterIp] = useState("10.0.0.55")
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      console.log("🧪 Testing printer connection to", printerIp)
      
      const response = await fetch("/api/print/kube2/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ printerIp }),
      })

      const data = await response.json()
      console.log("🖨️ Test result:", data)
      
      setResult(data)
    } catch (error) {
      console.error("❌ Test error:", error)
      setResult({
        success: false,
        message: `Errore di connessione: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🖨️</span>
          <span>Test Stampante KUBE2</span>
        </CardTitle>
        <CardDescription>
          Testa la connessione alla stampante per risolvere problemi di timeout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="printer-ip">IP Stampante</Label>
          <Input
            id="printer-ip"
            value={printerIp}
            onChange={(e) => setPrinterIp(e.target.value)}
            placeholder="10.0.0.55"
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={testing}
          className="w-full"
          size="lg"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Testing connessione...
            </>
          ) : (
            <>🔍 Testa Connessione</>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{result.success ? "✅" : "❌"}</span>
              <span className={`font-medium ${result.success ? "text-green-900" : "text-red-900"}`}>
                {result.success ? "Connessione OK" : "Connessione Fallita"}
              </span>
            </div>
            <p className={`text-sm ${result.success ? "text-green-800" : "text-red-800"}`}>{result.message}</p>
            {result.details && (
              <pre className={`text-xs mt-2 p-2 rounded bg-gray-100 ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.details}
              </pre>
            )}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🔧 Risoluzione problemi:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Verifica che la stampante sia accesa</li>
            <li>• Controlla che l'IP sia corretto nella rete locale</li>
            <li>• Assicurati che la stampante sia sulla stessa rete del server</li>
            <li>• Prova a pingare l'IP dal terminale: <code>ping {printerIp}</code></li>
            <li>• Controlla le impostazioni firewall</li>
            <li>• Verifica che la porta 9100 sia aperta sulla stampante</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ IP comuni stampanti:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Router standard: 192.168.1.x o 192.168.0.x</p>
            <p>• Rete aziendale: 10.0.0.x</p>
            <p>• Controlla l'IP dal pannello della stampante</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
