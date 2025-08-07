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
  }
  connectivityTests: {
    icmpPing: { success: boolean; details: string }
    port9100: { success: boolean; details: string }
    port80: { success: boolean; details: string }
    port443: { success: boolean; details: string }
  }
  systemInfo: {
    uid: string
    gid: string
    hostname: string
    networkInterfaces: any
    processes: string
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
      const response = await fetch('/api/print/network-diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerIp }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore nella diagnostica')
      }
      
      setResult(data)
    } catch (error) {
      console.error('Error running diagnostics:', error)
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
                      <h4 className="font-medium text-red-900 mb-2">🚨 Problema Identificato: Vercel</h4>
                      <p className="text-sm text-red-800">
                        Vercel ha severe limitazioni di rete. Le connessioni dirette a dispositivi locali 
                        (come stampanti) sono bloccate per motivi di sicurezza.
                      </p>
                    </div>
                  )}

                  {(result.environment.isDocker || result.environment.isContainer) && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">⚠️ Container Rilevato</h4>
                      <p className="text-sm text-yellow-800">
                        Il server è in un container. Questo può limitare l'accesso alla rete locale.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Network Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🛠️ Strumenti di Rete Disponibili</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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

                  {!result.networkCapabilities.hasNetworkTools && (
                    <div className="bg-red-50 p-4 rounded-lg mt-4">
                      <h4 className="font-medium text-red-900 mb-2">❌ Nessuno Strumento di Rete</h4>
                      <p className="text-sm text-red-800">
                        Il server non ha accesso agli strumenti di rete di base. Questo conferma che 
                        siamo in un ambiente molto limitato (probabilmente Vercel).
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
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Porta 80 (HTTP)</div>
                        <div className="text-sm text-gray-600">{result.connectivityTests.port80.details}</div>
                      </div>
                      {getStatusBadge(result.connectivityTests.port80.success)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Porta 443 (HTTPS)</div>
                        <div className="text-sm text-gray-600">{result.connectivityTests.port443.details}</div>
                      </div>
                      {getStatusBadge(result.connectivityTests.port443.success)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ℹ️ Informazioni Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="font-medium">User ID</div>
                      <div className="text-sm text-gray-600">{result.systemInfo.uid}</div>
                    </div>
                    <div>
                      <div className="font-medium">Group ID</div>
                      <div className="text-sm text-gray-600">{result.systemInfo.gid}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="font-medium mb-2">Interfacce di Rete</div>
                    <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                      {JSON.stringify(result.systemInfo.networkInterfaces, null, 2)}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">Processi (primi 10)</div>
                    <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                      {result.systemInfo.processes}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Solutions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Soluzioni Possibili</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.environment.isVercel ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">🔧 Soluzioni per Vercel:</h4>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li><strong>VPS/Server dedicato</strong>: Sposta l'app su un VPS (DigitalOcean, Linode)</li>
                        <li><strong>Vercel + Proxy</strong>: Usa un server proxy nella rete locale</li>
                        <li><strong>Webhook</strong>: Invia i dati a un server locale via webhook</li>
                        <li><strong>Cloud Print</strong>: Usa servizi di stampa cloud</li>
                      </ul>
                    </div>
                  ) : result.connectivityTests.port9100.success ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ Buone notizie!</h4>
                      <p className="text-sm text-green-800">
                        La porta 9100 è raggiungibile. La stampa dovrebbe funzionare anche se il ping ICMP fallisce.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">🔧 Possibili soluzioni:</h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Verifica che la stampante sia accesa e connessa</li>
                        <li>Controlla il firewall del server</li>
                        <li>Verifica la configurazione di rete del container</li>
                        <li>Prova con un server locale invece del cloud</li>
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
