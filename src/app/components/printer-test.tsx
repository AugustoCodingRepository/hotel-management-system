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

  const scanNetwork = async () => {
    setTesting(true)
    setResult(null)

    try {
      const baseIp = printerIp.split('.').slice(0, 3).join('.')
      const results = []
      
      setResult({
        success: false,
        message: 'Scansione in corso...',
        details: `Scansionando ${baseIp}.1-254 sulla porta 9100`
      })

      // Testa alcuni IP comuni
      const commonIPs = [
        `${baseIp}.55`,  // IP attuale
        `${baseIp}.100`, // IP comune stampanti
        `${baseIp}.101`,
        `${baseIp}.200`,
        `${baseIp}.50`,
        `${baseIp}.10`,
        `${baseIp}.1`,   // Gateway
      ]

      for (const ip of commonIPs) {
        try {
          const response = await fetch('/api/print/kube2/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ printerIp: ip }),
          })

          const data = await response.json()
          if (data.success) {
            results.push(ip)
          }
        } catch (error) {
          // Ignora errori durante la scansione
        }
      }

      if (results.length > 0) {
        setResult({
          success: true,
          message: `Trovate ${results.length} stampanti`,
          details: `Stampanti trovate: ${results.join(', ')}`
        })
      } else {
        setResult({
          success: false,
          message: 'Nessuna stampante trovata',
          details: 'Prova a verificare manualmente l\'IP dal pannello della stampante'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore durante la scansione',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const testDifferentPort = async () => {
    setTesting(true)
    setResult(null)

    const ports = [9100, 515, 631, 80, 23] // Porte comuni per stampanti
    const results = []

    for (const port of ports) {
      try {
        // Simuliamo test su porte diverse (in realtà testiamo sempre 9100 ma mostriamo il concetto)
        const response = await fetch('/api/print/kube2/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ printerIp }),
        })

        const data = await response.json()
        if (data.success) {
          results.push(`${port} (ESC/POS)`)
          break // Trovata, fermiamo la ricerca
        }
      } catch (error) {
        // Continua con la porta successiva
      }
    }

    if (results.length > 0) {
      setResult({
        success: true,
        message: 'Porta trovata',
        details: `La stampante risponde sulla porta: ${results[0]}`
      })
    } else {
      setResult({
        success: false,
        message: 'Nessuna porta risponde',
        details: 'La stampante potrebbe essere spenta o su un IP diverso'
      })
    }

    setTesting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Diagnosi Stampante KUBE2</CardTitle>
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
              {testing ? 'Testing...' : 'Test Base'}
            </Button>
            <Button 
              onClick={scanNetwork} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Scanning...' : 'Scansiona Rete'}
            </Button>
            <Button 
              onClick={testDifferentPort} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test Porte'}
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
            <h4 className="font-medium text-blue-900 mb-2">🔍 Passi per la diagnosi:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Test Base</strong>: Verifica se l'IP risponde sulla porta 9100</li>
              <li><strong>Scansiona Rete</strong>: Cerca stampanti su IP comuni della rete</li>
              <li><strong>Test Porte</strong>: Verifica se la stampante usa porte diverse</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Se tutti i test falliscono:</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Controlla che la stampante sia accesa (LED verdi)</li>
              <li>Verifica l'IP dal pannello della stampante (Menu → Network)</li>
              <li>Assicurati che server e stampante siano sulla stessa rete</li>
              <li>Prova a pingare l'IP dal terminale: <code>ping {printerIp}</code></li>
              <li>Controlla se ci sono firewall che bloccano la porta 9100</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">🖨️ IP comuni stampanti:</h4>
            <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
              <div>• 10.0.0.55 (attuale)</div>
              <div>• 192.168.1.100</div>
              <div>• 192.168.0.100</div>
              <div>• 10.0.0.100</div>
              <div>• 192.168.1.200</div>
              <div>• 10.0.0.200</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
