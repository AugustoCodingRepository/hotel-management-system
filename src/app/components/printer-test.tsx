'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'

interface TestResult {
  success: boolean
  message: string
  error?: string
  details?: any
  suggestions?: string[]
}

interface SystemInfo {
  success: boolean
  systemInfo?: {
    platform: string
    release: string
    nodeVersion: string
    hostname: string
    hostingProvider: string
    environment: any
    capabilities: {
      canExecCommands: boolean
      availableCommands: string[]
      systemLimitations: string[]
    }
  }
  error?: string
}

export function PrinterTest() {
  const [printerIp, setPrinterIp] = useState('10.0.0.55')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(false)

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
        message: 'Errore di connessione',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const getSystemInfo = async () => {
    setLoadingSystemInfo(true)
    setSystemInfo(null)

    try {
      const response = await fetch('/api/print/system-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setSystemInfo(data)
    } catch (error) {
      setSystemInfo({
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setLoadingSystemInfo(false)
    }
  }

  const testPrint = async () => {
    if (!result?.success) {
      alert('Prima testa la connessione!')
      return
    }

    try {
      const testData = {
        tableNumber: 1,
        items: [
          { name: 'Test Item', quantity: 1, unitPrice: 10.00, totalPrice: 10.00 }
        ],
        total: 10.00,
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: generateTestReceipt(),
          tableNumber: 1
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Test di stampa inviato!')
      } else {
        alert(`Errore stampa: ${data.error}`)
      }
    } catch (error) {
      alert(`Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  const generateTestReceipt = () => {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let content = ""
    content += ESC + "@" // Reset
    content += ESC + "a" + "\x01" // Center align
    content += ESC + "!" + "\x18" // Large text
    content += "TEST STAMPA\n"
    content += ESC + "!" + "\x00" // Normal text
    content += "Hotel Management\n"
    content += new Date().toLocaleString('it-IT') + "\n"
    content += "================================\n"
    content += "Test di connessione riuscito!\n"
    content += "================================\n"
    content += "\n\n"
    content += GS + "V" + "\x00" // Cut paper
    
    return content
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>🖨️ Test Connessione Stampante</CardTitle>
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
            <Button 
              onClick={testConnection} 
              disabled={testing || !printerIp}
            >
              {testing ? 'Testando...' : 'Test Connessione'}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? '✅ Successo' : '❌ Fallito'}
                </Badge>
                <span className="font-medium">{result.message}</span>
              </div>
              
              {result.error && (
                <div className="text-sm text-red-800 mb-2">
                  <strong>Errore:</strong> {result.error}
                </div>
              )}

              {result.details && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Dettagli:</strong>
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}

              {result.suggestions && (
                <div className="text-sm">
                  <strong>Suggerimenti:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.success && (
                <div className="mt-4">
                  <Button onClick={testPrint} variant="outline" size="sm">
                    🖨️ Invia Test di Stampa
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>🖥️ Informazioni Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={getSystemInfo} 
            disabled={loadingSystemInfo}
            variant="outline"
          >
            {loadingSystemInfo ? 'Caricando...' : 'Ottieni Info Sistema'}
          </Button>

          {systemInfo && (
            <div className="space-y-4">
              {systemInfo.success && systemInfo.systemInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium">Platform</div>
                      <div className="text-sm text-gray-600">{systemInfo.systemInfo.platform}</div>
                    </div>
                    <div>
                      <div className="font-medium">Release</div>
                      <div className="text-sm text-gray-600">{systemInfo.systemInfo.release}</div>
                    </div>
                    <div>
                      <div className="font-medium">Node.js</div>
                      <div className="text-sm text-gray-600">{systemInfo.systemInfo.nodeVersion}</div>
                    </div>
                    <div>
                      <div className="font-medium">Hostname</div>
                      <div className="text-sm text-gray-600">{systemInfo.systemInfo.hostname}</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">Hosting Provider</div>
                    <Badge variant={systemInfo.systemInfo.hostingProvider === 'vercel' ? 'destructive' : 'default'}>
                      {systemInfo.systemInfo.hostingProvider}
                    </Badge>
                  </div>

                  {systemInfo.systemInfo.hostingProvider === 'vercel' && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">🚨 Limitazioni Vercel</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Vercel blocca le connessioni dirette a dispositivi locali per motivi di sicurezza.
                        Queste limitazioni <strong>NON possono essere rimosse</strong>.
                      </p>
                      <p className="text-sm text-red-800 font-medium">
                        ❌ La stampa diretta NON funzionerà su Vercel.
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="font-medium mb-2">Comandi Disponibili</div>
                    <div className="flex flex-wrap gap-2">
                      {systemInfo.systemInfo.capabilities.availableCommands.length > 0 ? (
                        systemInfo.systemInfo.capabilities.availableCommands.map(cmd => (
                          <Badge key={cmd} variant="outline">{cmd}</Badge>
                        ))
                      ) : (
                        <Badge variant="destructive">Nessun comando disponibile</Badge>
                      )}
                    </div>
                  </div>

                  {systemInfo.systemInfo.capabilities.systemLimitations.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Limitazioni Sistema</div>
                      <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                        {systemInfo.systemInfo.capabilities.systemLimitations.map((limitation, index) => (
                          <li key={index}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-800">
                    <strong>Errore:</strong> {systemInfo.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solutions */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Soluzioni Alternative</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🔧 Se sei su Vercel:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>VPS/Server dedicato</strong>: Sposta l'app su DigitalOcean, Linode, Hetzner</li>
                <li><strong>Railway/Render</strong>: Hosting con meno limitazioni di rete</li>
                <li><strong>Server locale</strong>: Esegui l'app su un PC nella stessa rete della stampante</li>
                <li><strong>Proxy server</strong>: Crea un bridge nella rete locale</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">✅ Soluzioni Immediate:</h4>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li><strong>Sviluppo locale</strong>: Esegui <code>npm run dev</code> sul tuo PC</li>
                <li><strong>Build locale</strong>: Esegui <code>npm run build && npm start</code></li>
                <li><strong>Docker locale</strong>: Containerizza l'app e eseguila localmente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
