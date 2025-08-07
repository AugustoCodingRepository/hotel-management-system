'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'

interface DiagnosticsResult {
  environment: {
    platform: string
    release: string
    nodeVersion: string
    isVercel: boolean
    isDocker: boolean
    isContainer: boolean
    hostingProvider: string
    hostname: string
  }
  networkCapabilities: {
    canPing: boolean
    canTelnet: boolean
    canNetcat: boolean
    canCurl: boolean
    hasNetworkTools: boolean
    canExecCommands: boolean
  }
  connectivityTests: {
    icmpPing: { success: boolean; details: string }
    port9100: { success: boolean; details: string }
    port80: { success: boolean; details: string }
    port443: { success: boolean; details: string }
    socketTest: { success: boolean; details: string }
  }
  systemInfo: {
    uid: string
    gid: string
    hostname: string
    networkInterfaces: any
    processes: string
    memoryUsage: any
    environmentVariables: any
  }
}

export function NetworkDiagnostics() {
  const [printerIp, setPrinterIp] = useState('10.0.0.55')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<DiagnosticsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setTesting(true)
    setResult(null)
    setError(null)

    try {
      console.log('🔍 Starting network diagnostics...')
      
      const response = await fetch('/api/print/network-diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerIp }),
      })

      console.log('📡 Response status:', response.status)
      
      const data = await response.json()
      console.log('📊 Response data:', data)
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
      
      setResult(data)
    } catch (error) {
      console.error('❌ Error running diagnostics:', error)
      setError(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setTesting(false)
    }
  }

  const getEnvironmentBadge = (env: DiagnosticsResult['environment']) => {
    if (env.isVercel) return <Badge variant="destructive">Vercel - Rete Limitata</Badge>
    if (env.isDocker) return <Badge variant="secondary">Docker Container</Badge>
    if (env.isContainer) return <Badge variant="secondary">Container</Badge>
    if (env.hostingProvider !== 'unknown') return <Badge variant="outline">{env.hostingProvider}</Badge>
    return <Badge variant="default">Server Locale</Badge>
  }

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge variant="default" className="bg-green-100 text-green-800">✅ OK</Badge> : 
      <Badge variant="destructive">❌ FAIL</Badge>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnostica di Rete Avanzata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🚨 Problema Rilevato</h4>
            <p className="text-sm text-blue-800">
              Il comando <code className="bg-white px-1 rounded">ping</code> non è disponibile nel sistema.
              Questo indica che siamo in un ambiente molto limitato (probabilmente Vercel).
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="IP Stampante"
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={runDiagnostics} 
              disabled={testing || !printerIp}
            >
              {testing ? 'Analizzando...' : 'Avvia Diagnostica'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">❌ Errore</h4>
              <p className="text-sm text-red-800">{error}</p>
              <div className="text-xs text-red-600 mt-2">
                Controlla la console del browser per maggiori dettagli.
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Environment Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🖥️ Ambiente di Esecuzione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="font-medium">Platform</div>
                      <div className="text-sm text-gray-600">{result.environment.platform}</div>
                    </div>
                    <div>
                      <div className="font-medium">Release</div>
                      <div className="text-sm text-gray-600">{result.environment.release}</div>
                    </div>
                    <div>
                      <div className="font-medium">Node.js</div>
                      <div className="text-sm text-gray-600">{result.environment.nodeVersion}</div>
                    </div>
                    <div>
                      <div className="font-medium">Hostname</div>
                      <div className="text-sm text-gray-600">{result.environment.hostname}</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="font-medium mb-2">Tipo di Hosting</div>
                    {getEnvironmentBadge(result.environment)}
                  </div>

                  {result.environment.isVercel && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">🚨 Problema Confermato: Vercel</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Vercel ha severe limitazioni di rete. I comandi di sistema come <code>ping</code> non sono disponibili.
                        Le connessioni dirette a dispositivi locali (come stampanti) sono bloccate.
                      </p>
                      <p className="text-sm text-red-800 font-medium">
                        ❌ La stampa diretta NON funzionerà su Vercel.
                      </p>
                    </div>
                  )}

                  {!result.networkCapabilities.canExecCommands && !result.environment.isVercel && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">⚠️ Ambiente Serverless Rilevato</h4>
                      <p className="text-sm text-yellow-800">
                        Non è possibile eseguire comandi di sistema. Questo indica un ambiente serverless
                        con limitazioni di sicurezza.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Network Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🛠️ Capacità di Rete</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.networkCapabilities.canExecCommands)}
                      <span className="text-sm">Esecuzione Comandi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.networkCapabilities.canPing)}
                      <span className="text-sm">ping</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.networkCapabilities.canTelnet)}
                      <span className="text-sm">telnet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.networkCapabilities.canNetcat)}
                      <span className="text-sm">nc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.networkCapabilities.canCurl)}
                      <span className="text-sm">curl</span>
                    </div>
                  </div>

                  {!result.networkCapabilities.canExecCommands && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">❌ Nessun Comando di Sistema</h4>
                      <p className="text-sm text-red-800">
                        Il server non può eseguire comandi di sistema. Questo conferma che siamo
                        in un ambiente serverless molto limitato.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connectivity Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🌐 Test di Connettività</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Socket Test (Node.js puro)</div>
                        <div className="text-sm text-gray-600">{result.connectivityTests.socketTest.details}</div>
                      </div>
                      {getStatusBadge(result.connectivityTests.socketTest.success)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Ping ICMP</div>
                        <div className="text-sm text-gray-600">{result.connectivityTests.icmpPing.details}</div>
                      </div>
                      {getStatusBadge(result.connectivityTests.icmpPing.success)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Porta 9100 (Stampante)</div>
                        <div className="text-sm text-gray-600">{result.connectivityTests.port9100.details}</div>
                      </div>
                      {getStatusBadge(result.connectivityTests.port9100.success)}
                    </div>
                  </div>

                  {result.connectivityTests.socketTest.success && (
                    <div className="bg-green-50 p-4 rounded-lg mt-4">
                      <h4 className="font-medium text-green-900 mb-2">✅ Socket Test Riuscito!</h4>
                      <p className="text-sm text-green-800">
                        Il test socket Node.js è riuscito. Questo significa che la stampante è raggiungibile
                        anche senza comandi di sistema!
                      </p>
                    </div>
                  )}

                  {!result.connectivityTests.socketTest.success && (
                    <div className="bg-red-50 p-4 rounded-lg mt-4">
                      <h4 className="font-medium text-red-900 mb-2">❌ Connessione Fallita</h4>
                      <p className="text-sm text-red-800">
                        Anche il test socket Node.js è fallito. La stampante non è raggiungibile
                        da questo ambiente di hosting.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environment Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔧 Variabili d'Ambiente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(result.systemInfo.environmentVariables).map(([key, value]) => (
                      <div key={key}>
                        <div className="font-medium text-sm">{key}</div>
                        <div className="text-xs text-gray-600 font-mono bg-gray-100 p-1 rounded">
                          {value || 'undefined'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Solutions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Soluzioni</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.environment.isVercel ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">🔧 Soluzioni per Vercel:</h4>
                      <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                        <li><strong>VPS/Server dedicato</strong>: Sposta l'app su DigitalOcean, Linode, o Hetzner</li>
                        <li><strong>Railway/Render</strong>: Hosting con meno limitazioni di rete</li>
                        <li><strong>Server locale</strong>: Esegui l'app su un computer nella stessa rete della stampante</li>
                        <li><strong>Proxy server</strong>: Crea un server proxy nella rete locale</li>
                        <li><strong>Webhook</strong>: Invia i dati di stampa a un server locale via webhook</li>
                      </ul>
                    </div>
                  ) : result.connectivityTests.socketTest.success ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ Buone notizie!</h4>
                      <p className="text-sm text-green-800">
                        Il socket test è riuscito. La stampa dovrebbe funzionare usando solo Node.js
                        senza comandi di sistema.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">🔧 Possibili soluzioni:</h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Verifica che la stampante sia accesa e connessa</li>
                        <li>Controlla che server e stampante siano sulla stessa rete</li>
                        <li>Prova con un hosting diverso (non serverless)</li>
                        <li>Usa un server locale per la stampa</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
