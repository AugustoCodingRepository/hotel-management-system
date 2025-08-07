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
      // Test con ricevuta semplice
      const testReceipt = generateSimpleTestReceipt()

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: testReceipt,
          tableNumber: 99,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Test di stampa completato!' : 'Test di stampa fallito',
        details: data.error || 'Ricevuta di test inviata alla stampante KUBE2'
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

  const testRawPrint = async () => {
    setTesting(true)
    setResult(null)

    try {
      // Test con comandi raw minimi
      const rawContent = "\x1B@TEST KUBE II\n\nStampa funzionante!\n\n\n\x1DV\x00"

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: rawContent,
          tableNumber: 88,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Test raw completato!' : 'Test raw fallito',
        details: data.error || 'Comandi raw inviati alla stampante'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore test raw',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const generateSimpleTestReceipt = () => {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let content = ""
    
    // Reset
    content += ESC + "@"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += ESC + "!" + "\x18" // Grande
    content += "TEST KUBE II\n"
    content += ESC + "!" + "\x00" // Normale
    content += "Sistema Hotel\n"
    content += "\n"
    
    // Sinistra
    content += ESC + "a" + "\x00"
    content += "TAVOLO: 99\n"
    content += `DATA: ${new Date().toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date().toLocaleTimeString("it-IT")}\n`
    content += "\n"
    
    content += "--------------------------------\n"
    content += "1x Test Item             EUR 5.00\n"
    content += "1x Caffe                 EUR 1.50\n"
    content += "--------------------------------\n"
    
    // Totale a destra
    content += ESC + "a" + "\x02"
    content += ESC + "!" + "\x08"
    content += "TOTALE: EUR 6.50\n"
    content += ESC + "!" + "\x00"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += "================================\n"
    content += "\n"
    content += "Test completato!\n"
    content += "Grazie\n"
    content += "\n"
    content += "\n"
    
    // Taglia carta
    content += GS + "V" + "\x00"
    
    return content
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Stampante KUBE2 - Diagnosi Avanzata</CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={testConnection} 
              disabled={testing || !printerIp}
              className="w-full"
            >
              {testing ? 'Testing...' : '1. Test Connessione'}
            </Button>
            <Button 
              onClick={testRawPrint} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Printing...' : '2. Test Raw'}
            </Button>
            <Button 
              onClick={testActualPrint} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Printing...' : '3. Test Ricevuta'}
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
                  {result.details}
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔍 Sequenza di test:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Test Connessione</strong>: Verifica socket e comandi ESC/POS base</li>
              <li><strong>Test Raw</strong>: Invia comandi minimi per verificare la stampa</li>
              <li><strong>Test Ricevuta</strong>: Stampa una ricevuta completa di test</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Se il ping funziona ma i test falliscono:</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>La porta 9100 potrebbe essere bloccata da un firewall</li>
              <li>La stampante potrebbe non supportare connessioni TCP dirette</li>
              <li>Potrebbe essere necessario un driver specifico</li>
              <li>La stampante potrebbe essere in modalità sleep/standby</li>
              <li>Verifica se altri software riescono a stampare</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✅ Il tuo Python funziona perché:</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Usa la stessa sequenza di comandi che ho replicato</li>
              <li>Ha timeout e retry appropriati</li>
              <li>Gestisce correttamente i buffer e la codifica</li>
              <li>Questo test dovrebbe funzionare allo stesso modo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
