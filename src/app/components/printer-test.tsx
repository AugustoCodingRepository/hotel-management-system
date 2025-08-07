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
      // Test con dati di stampa reali - formato migliorato
      const testData = {
        tableNumber: 99,
        items: [
          { name: "Risotto ai Funghi", quantity: 1, unitPrice: 14.00, totalPrice: 14.00 },
          { name: "Caffè", quantity: 2, unitPrice: 1.50, totalPrice: 3.00 }
        ],
        total: 17.00,
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
    
    // Reset (sarà fatto anche dall'API)
    content += ESC + "@"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += ESC + "!" + "\x18" // Grande e grassetto
    content += "TEST STAMPA KUBE II\n"
    content += ESC + "!" + "\x00" // Reset
    content += "Sistema Hotel\n\n"
    
    // Sinistra
    content += ESC + "a" + "\x00"
    content += ESC + "!" + "\x08" // Grassetto
    content += `TAVOLO: ${data.tableNumber}\n`
    content += ESC + "!" + "\x00"
    content += `DATA: ${new Date().toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date().toLocaleTimeString("it-IT")}\n`
    content += `CAMERIERE: Test\n\n`
    
    content += "--------------------------------\n"
    content += ESC + "!" + "\x08"
    content += "ORDINE:\n"
    content += ESC + "!" + "\x00"
    content += "--------------------------------\n"
    
    // Articoli con formattazione corretta
    data.items.forEach((item: any) => {
      const line = `${item.quantity}x ${item.name}`
      const priceStr = `EUR ${item.totalPrice.toFixed(2)}`
      const maxWidth = 32
      const spacesNeeded = Math.max(1, maxWidth - line.length - priceStr.length)
      const formattedLine = line + " ".repeat(spacesNeeded) + priceStr
      content += formattedLine + "\n"
    })
    
    content += "--------------------------------\n"
    
    // Totale a destra
    content += ESC + "a" + "\x02"
    content += ESC + "!" + "\x08"
    content += `TOTALE: EUR ${data.total.toFixed(2)}\n`
    content += ESC + "!" + "\x00"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += "================================\n\n"
    content += "Test completato!\n"
    content += "Grazie\n\n"
    
    // Taglia carta
    content += GS + "V" + "\x00"
    
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
            <div className="font-medium">Miglioramenti implementati dal Python:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Timeout di 15 secondi invece di 3</li>
              <li>3 tentativi automatici con pausa di 3 secondi</li>
              <li>Comandi reset e status come nel codice funzionante</li>
              <li>Gestione robusta degli errori</li>
              <li>Feed finale prima della disconnessione</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
