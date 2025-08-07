'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'

interface TestResult {
  success: boolean
  message: string
  details?: string
}

export function PrinterTest() {
  const [printerIp, setPrinterIp] = useState('10.0.0.55')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/print/kube2/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerIp }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore di rete',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const testActualPrint = async () => {
    setTesting(true)
    setResult(null)

    try {
      // Test con dati di stampa reali
      const testData = {
        tableNumber: 99,
        items: [
          { name: "Test Item", quantity: 1, unitPrice: 5.00, totalPrice: 5.00 }
        ],
        total: 5.00,
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: generateTestReceipt(testData),
          tableNumber: testData.tableNumber,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Test di stampa riuscito!' : 'Test di stampa fallito',
        details: data.error || 'Ricevuta di test inviata alla stampante'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore test stampa',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const generateTestReceipt = (data: any) => {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let content = ""
    content += ESC + "@" // Reset
    content += ESC + "a" + "\x01" // Centra
    content += "TEST STAMPA\n"
    content += "KUBE2 PRINTER\n"
    content += "\n"
    content += ESC + "a" + "\x00" // Allinea sinistra
    content += `TAVOLO: ${data.tableNumber}\n`
    content += `DATA: ${new Date().toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date().toLocaleTimeString("it-IT")}\n\n`
    content += "Test Item            1   5.00\n"
    content += "TOTALE: EUR 5.00\n\n"
    content += GS + "V" + "\x42" + "\x00" // Taglia carta
    
    return content
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Connessione Stampante KUBE2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="IP Stampante"
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={testing || !printerIp}
              className="flex-1"
            >
              {testing ? 'Testing...' : 'Test Connessione'}
            </Button>
            <Button 
              onClick={testActualPrint} 
              disabled={testing || !printerIp}
              variant="outline"
              className="flex-1"
            >
              {testing ? 'Printing...' : 'Test Stampa Reale'}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="font-medium mb-2">
                {result.success ? '✅ Successo' : '❌ Errore'}
              </div>
              <div className="mb-2">{result.message}</div>
              {result.details && (
                <div className="text-sm opacity-75">
                  Dettagli: {result.details}
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-medium">Se il test di connessione funziona ma la stampa no:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Prova il "Test Stampa Reale" per vedere se stampa davvero</li>
              <li>Controlla i log del server per errori specifici</li>
              <li>Verifica che la stampante accetti comandi ESC/POS</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
