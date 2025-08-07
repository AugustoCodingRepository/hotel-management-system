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

  const testTcpConnection = async () => {
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

  const testRawPrint = async () => {
    setTesting(true)
    setResult(null)

    try {
      // Test con solo testo senza comandi ESC/POS
      const rawText = "TEST STAMPA SEMPLICE\nSenza comandi ESC/POS\nSolo testo normale\n\n\n"

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: rawText,
          tableNumber: 77,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Test testo semplice OK!' : 'Test testo fallito',
        details: data.error || 'Testo semplice inviato senza comandi ESC/POS'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore test testo',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const testEscPosPrint = async () => {
    setTesting(true)
    setResult(null)

    try {
      // Test con comandi ESC/POS minimi
      const escPosContent = "\x1B@TEST ESC/POS\n\nComandi stampante\n\n\n\x1DV\x00"

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: escPosContent,
          tableNumber: 66,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Test ESC/POS OK!' : 'Test ESC/POS fallito',
        details: data.error || 'Comandi ESC/POS inviati (reset + taglio)'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore test ESC/POS',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const testFullReceipt = async () => {
    setTesting(true)
    setResult(null)

    try {
      const fullReceipt = generateFullTestReceipt()

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: fullReceipt,
          tableNumber: 55,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Ricevuta completa OK!' : 'Ricevuta completa fallita',
        details: data.error || 'Ricevuta completa con tutti i comandi ESC/POS'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore ricevuta completa',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const generateFullTestReceipt = () => {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let content = ""
    
    // Reset
    content += ESC + "@"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += ESC + "!" + "\x18" // Grande
    content += "IL NIDO\n"
    content += ESC + "!" + "\x00" // Normale
    content += "Hotel Sorrento ***\n"
    content += "Via Nastro Verde 82\n"
    content += "Sorrento (80067)\n"
    content += "Tel: +39 081 878 2706\n"
    content += "\n"
    
    content += "================================\n"
    
    // Sinistra
    content += ESC + "a" + "\x00"
    content += ESC + "!" + "\x08" // Grassetto
    content += "TAVOLO: 55\n"
    content += ESC + "!" + "\x00"
    content += `DATA: ${new Date().toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date().toLocaleTimeString("it-IT")}\n`
    content += "\n"
    
    content += "--------------------------------\n"
    content += ESC + "!" + "\x08"
    content += "ORDINE:\n"
    content += ESC + "!" + "\x00"
    content += "--------------------------------\n"
    
    // Articoli
    content += "1x Risotto ai Funghi     EUR 14.00\n"
    content += "2x Caffe                 EUR  3.00\n"
    content += "1x Acqua                 EUR  2.50\n"
    
    content += "--------------------------------\n"
    
    // Totale a destra
    content += ESC + "a" + "\x02"
    content += ESC + "!" + "\x08"
    content += "TOTALE: EUR 19.50\n"
    content += ESC + "!" + "\x00"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += "================================\n"
    content += "\n"
    content += "Grazie per la visita!\n"
    content += "www.ilnido.it\n"
    content += "\n"
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
          <CardTitle>Debug Stampante KUBE2 - Test Progressivi</CardTitle>
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

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={testTcpConnection} 
              disabled={testing || !printerIp}
              className="w-full"
            >
              {testing ? 'Testing...' : '1. Test TCP'}
            </Button>
            <Button 
              onClick={testRawPrint} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Printing...' : '2. Test Testo'}
            </Button>
            <Button 
              onClick={testEscPosPrint} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Printing...' : '3. Test ESC/POS'}
            </Button>
            <Button 
              onClick={testFullReceipt} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Printing...' : '4. Ricevuta Completa'}
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
            <h4 className="font-medium text-blue-900 mb-2">🔍 Test progressivi:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Test TCP</strong>: Verifica solo la connessione socket</li>
              <li><strong>Test Testo</strong>: Invia testo semplice senza comandi</li>
              <li><strong>Test ESC/POS</strong>: Comandi minimi (reset + taglio)</li>
              <li><strong>Ricevuta Completa</strong>: Tutti i comandi di formattazione</li>
            </ol>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">🚨 Se anche il Test TCP fallisce:</h4>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li><strong>Problema di ambiente</strong>: Node.js potrebbe avere restrizioni di rete</li>
              <li><strong>Vercel/Deploy</strong>: I servizi cloud spesso bloccano connessioni raw</li>
              <li><strong>Firewall applicativo</strong>: Diverso dal firewall di sistema</li>
              <li><strong>Binding di rete</strong>: La stampante potrebbe accettare solo da certi IP</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Possibili soluzioni:</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Prova da localhost invece che da deploy remoto</li>
              <li>Usa un proxy/bridge locale che converte HTTP → TCP</li>
              <li>Configura la stampante per accettare da tutti gli IP</li>
              <li>Usa driver di stampa del sistema operativo invece di TCP raw</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
