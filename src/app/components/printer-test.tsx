'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'

interface TestResult {
  timestamp: string
  printerIp: string
  port: number
  tests: {
    socketConnection: { success: boolean; details: string; duration: number }
    pingTest: { success: boolean; details: string; duration: number }
    portScan: { success: boolean; details: string; duration: number }
    systemInfo: { success: boolean; details: string; duration: number }
  }
}

interface SystemInfo {
  platform: string
  release: string
  arch: string
  nodeVersion: string
  hostname: string
  uptime: number
  memory: {
    total: number
    free: number
    used: number
  }
  cpus: number
  networkInterfaces: any
  environment: {
    isVercel: boolean
    isDocker: boolean
    isContainer: boolean
    nodeEnv: string
    platform: string
  }
  capabilities: {
    canExec: boolean
    canPing: boolean
    canNetcat: boolean
    canTelnet: boolean
  }
}

export function PrinterTest() {
  const [printerIp, setPrinterIp] = useState('10.0.0.55')
  const [port, setPort] = useState(9100)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(false)

  const runTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/print/kube2/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerIp, port }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error testing printer:', error)
    } finally {
      setTesting(false)
    }
  }

  const getSystemInfo = async () => {
    setLoadingSystemInfo(true)
    setSystemInfo(null)

    try {
      const response = await fetch('/api/print/system-info')
      const data = await response.json()
      setSystemInfo(data)
    } catch (error) {
      console.error('Error getting system info:', error)
    } finally {
      setLoadingSystemInfo(false)
    }
  }

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge variant="default" className="bg-green-100 text-green-800">✅ OK</Badge> : 
      <Badge variant="destructive">❌ FAIL</Badge>
  }

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🖨️ Test Connessione Stampante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">IP Stampante</label>
              <Input
                type="text"
                placeholder="10.0.0.55"
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Porta</label>
              <Input
                type="number"
                placeholder="9100"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 9100)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runTest} 
              disabled={testing || !printerIp}
              className="flex-1"
            >
              {testing ? 'Testing...' : 'Test Connessione'}
            </Button>
            <Button 
              onClick={getSystemInfo} 
              disabled={loadingSystemInfo}
              variant="outline"
            >
              {loadingSystemInfo ? 'Loading...' : 'Info Sistema'}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Test eseguito il {new Date(result.timestamp).toLocaleString()}
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Socket Connection</div>
                    <div className="text-sm text-gray-600">{result.tests.socketConnection.details}</div>
                    <div className="text-xs text-gray-500">{result.tests.socketConnection.duration}ms</div>
                  </div>
                  {getStatusBadge(result.tests.socketConnection.success)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Ping Test</div>
                    <div className="text-sm text-gray-600">{result.tests.pingTest.details}</div>
                    <div className="text-xs text-gray-500">{result.tests.pingTest.duration}ms</div>
                  </div>
                  {getStatusBadge(result.tests.pingTest.success)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Port Scan</div>
                    <div className="text-sm text-gray-600">{result.tests.portScan.details}</div>
                    <div className="text-xs text-gray-500">{result.tests.portScan.duration}ms</div>
                  </div>
                  {getStatusBadge(result.tests.portScan.success)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">System Info</div>
                    <div className="text-sm text-gray-600">{result.tests.systemInfo.details}</div>
                    <div className="text-xs text-gray-500">{result.tests.systemInfo.duration}ms</div>
                  </div>
                  {getStatusBadge(result.tests.systemInfo.success)}
                </div>
              </div>

              {result.tests.socketConnection.success && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">✅ Connessione Riuscita!</h4>
                  <p className="text-sm text-green-800">
                    La stampante è raggiungibile sulla porta {port}. La stampa dovrebbe funzionare.
                  </p>
                </div>
              )}

              {!result.tests.socketConnection.success && result.tests.pingTest.success && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Ping OK, Porta Chiusa</h4>
                  <p className="text-sm text-yellow-800">
                    La stampante risponde al ping ma la porta {port} è chiusa. 
                    Verifica che il servizio di stampa sia attivo.
                  </p>
                </div>
              )}

              {!result.tests.pingTest.success && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">❌ Stampante Non Raggiungibile</h4>
                  <p className="text-sm text-red-800">
                    La stampante non risponde al ping. Verifica IP, connessione di rete e che sia accesa.
                  </p>
                </div>
              )}
            </div>
          )}

          {systemInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🖥️ Informazioni Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="font-medium">Platform</div>
                    <div className="text-sm text-gray-600">{systemInfo.platform}</div>
                  </div>
                  <div>
                    <div className="font-medium">Architecture</div>
                    <div className="text-sm text-gray-600">{systemInfo.arch}</div>
                  </div>
                  <div>
                    <div className="font-medium">Node.js</div>
                    <div className="text-sm text-gray-600">{systemInfo.nodeVersion}</div>
                  </div>
                  <div>
                    <div className="font-medium">Hostname</div>
                    <div className="text-sm text-gray-600">{systemInfo.hostname}</div>
                  </div>
                  <div>
                    <div className="font-medium">Uptime</div>
                    <div className="text-sm text-gray-600">{formatUptime(systemInfo.uptime)}</div>
                  </div>
                  <div>
                    <div className="font-medium">CPUs</div>
                    <div className="text-sm text-gray-600">{systemInfo.cpus}</div>
                  </div>
                  <div>
                    <div className="font-medium">Memory</div>
                    <div className="text-sm text-gray-600">
                      {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Environment</div>
                    <div className="text-sm text-gray-600">{systemInfo.environment.nodeEnv}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-medium mb-2">Environment Flags</div>
                  <div className="flex gap-2 flex-wrap">
                    {systemInfo.environment.isVercel && <Badge variant="destructive">Vercel</Badge>}
                    {systemInfo.environment.isDocker && <Badge variant="secondary">Docker</Badge>}
                    {systemInfo.environment.isContainer && <Badge variant="secondary">Container</Badge>}
                    {!systemInfo.environment.isVercel && !systemInfo.environment.isDocker && !systemInfo.environment.isContainer && (
                      <Badge variant="default">Local Server</Badge>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-medium mb-2">Network Capabilities</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(systemInfo.capabilities.canExec)}
                      <span className="text-sm">Execute Commands</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(systemInfo.capabilities.canPing)}
                      <span className="text-sm">Ping</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(systemInfo.capabilities.canNetcat)}
                      <span className="text-sm">Netcat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(systemInfo.capabilities.canTelnet)}
                      <span className="text-sm">Telnet</span>
                    </div>
                  </div>
                </div>

                {systemInfo.environment.isVercel && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">🚨 Vercel Detected</h4>
                    <p className="text-sm text-red-800">
                      Vercel has strict network limitations. Direct connections to local devices 
                      (like printers) are blocked for security reasons. Consider using a VPS or 
                      local server for printer functionality.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
