'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'

interface PrintServiceProps {
  tableNumber: number
  orderItems: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  total: number
}

export function PrintServiceWebhook({ tableNumber, orderItems, total }: PrintServiceProps) {
  const [localServerUrl, setLocalServerUrl] = useState('http://192.168.1.100:3001')
  const [printerIp, setPrinterIp] = useState('10.0.0.55')
  const [printing, setPrinting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; error?: string } | null>(null)

  const generateReceipt = () => {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let content = ""
    
    // Reset stampante
    content += ESC + "@"
    
    // Header centrato
    content += ESC + "a" + "\x01" // Centro
    content += ESC + "!" + "\x18" // Testo grande
    content += "HOTEL RESTAURANT\n"
    content += ESC + "!" + "\x00" // Testo normale
    content += "Via Roma 123, Milano\n"
    content += "Tel: 02-1234567\n"
    content += "\n"
    
    // Informazioni ordine
    content += ESC + "a" + "\x00" // Sinistra
    content += "================================\n"
    content += `TAVOLO: ${tableNumber}\n`
    content += `DATA: ${new Date().toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date().toLocaleTimeString("it-IT")}\n`
    content += "================================\n"
    
    // Articoli
    orderItems.forEach(item => {
      content += `${item.name}\n`
      content += `  ${item.quantity} x €${item.unitPrice.toFixed(2)} = €${item.totalPrice.toFixed(2)}\n`
    })
    
    content += "--------------------------------\n"
    content += `TOTALE: €${total.toFixed(2)}\n`
    content += "================================\n"
    content += "\n"
    content += ESC + "a" + "\x01" // Centro
    content += "Grazie per la visita!\n"
    content += "\n\n"
    
    // Taglia carta
    content += GS + "V" + "\x00"
    
    return content
  }

  const printReceipt = async () => {
    setPrinting(true)
    setResult(null)

    try {
      const content = generateReceipt()
      
      const response = await fetch('/api/print/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localServerUrl,
          printerIp,
          content,
          tableNumber
        }),
      })

      const data = await response.json()
      setResult(data)
      
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore di connessione',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setPrinting(false)
    }
  }

  const testConnection = async () => {
    try {
      const response = await fetch(`${localServerUrl}/status`)
      const data = await response.json()
      
      if (data.status === 'online') {
        alert('✅ Server locale online!')
      } else {
        alert('❌ Server locale non risponde correttamente')
      }
    } catch (error) {
      alert('❌ Impossibile raggiungere il server locale')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🖨️ Stampa via Server Locale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">URL Server Locale</label>
          <Input
            type="text"
            placeholder="http://192.168.1.100:3001"
            value={localServerUrl}
            onChange={(e) => setLocalServerUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">IP Stampante</label>
          <Input
            type="text"
            placeholder="10.0.0.55"
            value={printerIp}
            onChange={(e) => setPrinterIp(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testConnection}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Test Server
          </Button>
          <Button 
            onClick={printReceipt}
            disabled={printing || !localServerUrl || !printerIp}
            className="flex-1"
          >
            {printing ? 'Stampando...' : 'Stampa'}
          </Button>
        </div>

        {result && (
          <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? '✅' : '❌'}
              </Badge>
              <span className="text-sm font-medium">{result.message}</span>
            </div>
            {result.error && (
              <div className="text-xs text-red-600 mt-1">
                {result.error}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">📋 Setup:</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Scarica il server locale dal progetto</li>
            <li>Esegui <code>npm install && npm start</code></li>
            <li>Configura l'IP del tuo PC sopra</li>
            <li>Testa la connessione</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
