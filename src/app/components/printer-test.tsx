'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'

interface TestResult {
  success: boolean
  message: string
  details?: string
}

interface SystemInfo {
  platform: string
  nodeVersion: string
  environment: string
  isVercel: boolean
  availableCommands: { [key: string]: boolean }
  defaultRoute: string
  networkInterfaces: string
}

export function PrinterTest() {
  const [printerIp, setPrinterIp] = useState('10.0.0.55')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(true)

  useEffect(() => {
    loadSystemInfo()
  }, [])

  const loadSystemInfo = async () => {
    try {
      const response = await fetch('/api/print/system-info')
      const data = await response.json()
      setSystemInfo(data)
    } catch (error) {
      console.error('Error loading system info:', error)
    } finally {
      setLoadingSystemInfo(false)
    }
  }

  const testSystemTools = async () => {
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

  const testSystemPrint = async () => {
    setTesting(true)
    setResult(null)

    try {
      const testContent = generateSystemTestReceipt()

      const response = await fetch('/api/print/kube2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIp,
          content: testContent,
          tableNumber: 99,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? 'Stampa sistema OK!' : 'Stampa sistema fallita',
        details: data.error || 'Usati comandi di sistema (nc/curl/lp)'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Errore stampa sistema',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
    } finally {
      setTesting(false)
    }
  }

  const generateSystemTestReceipt = () => {
    const ESC = "\x1B"
    const GS = "\x1D"
    
    let content = ""
    
    // Reset
    content += ESC + "@"
    
    // Centro
    content += ESC + "a" + "\x01"
    content += ESC + "!" + "\x18"
    content += "TEST SISTEMA\n"
    content += ESC + "!" + "\x00"
    content += "Stampa via comandi sistema\n"
    content += "\n"
    
    // Sinistra
    content += ESC + "a" + "\x00"
    content += `IP: ${printerIp}\n`
    content += `Data: ${new Date().toLocaleDateString("it-IT")}\n`
    content += `Ora: ${new Date().toLocaleTimeString("it-IT")}\n`
    content += "\n"
    
    if (systemInfo) {
      content += "SISTEMA:\n"
      content += `Platform: ${systemInfo.platform}\n`
      content += `Node: ${systemInfo.nodeVersion}\n`
      content += `Env: ${systemInfo.environment}\n`
      content += `Vercel: ${systemInfo.isVercel ? 'Si' : 'No'}\n`
      content += "\n"
      
      content += "COMANDI DISPONIBILI:\n"
      Object.entries(systemInfo.availableCommands).forEach(([cmd, available]) => {
        content += `${cmd}: ${available ? 'OK' : 'NO'}\n`
      })
      content += "\n"
    }
    
    content += "Test completato!\n"
    content += "\n"
    content += "\n"
    
    // Taglia carta
    content += GS + "V" + "\x00"
    
    return content
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Stampante - Diagnosi Avanzata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Situazione attuale:</h4>
            <p className="text-sm text-blue-800">
              Hai confermato che dal tuo PC riesci a pingare la stampante e che è sulla stessa rete.
              Ora testiamo se il server riesce a raggiungerla.
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button 
              onClick={testSystemTools} 
              disabled={testing || !printerIp}
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test Connettività Server'}
            </Button>
            <Button 
              onClick={testSystemPrint} 
              disabled={testing || !printerIp}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Printing...' : 'Test Stampa Sistema'}
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
                <div className="text-sm opacity-75 whitespace-pre-line">
                  {result.details}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informazioni Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Sistema Server</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSystemInfo ? (
            <div>Caricamento informazioni sistema...</div>
          ) : systemInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="font-medium">Platform</div>
                  <div className="text-sm text-gray-600">{systemInfo.platform}</div>
                </div>
                <div>
                  <div className="font-medium">Node.js</div>
                  <div className="text-sm text-gray-600">{systemInfo.nodeVersion}</div>
                </div>
                <div>
                  <div className="font-medium">Environment</div>
                  <div className="text-sm text-gray-600">{systemInfo.environment}</div>
                </div>
                <div>
                  <div className="font-medium">Vercel</div>
                  <div className="text-sm text-gray-600 font-bold">
                    {systemInfo.isVercel ? '🟡 SÌ - Questo può causare problemi!' : '🟢 No'}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">Comandi Disponibili</div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.entries(systemInfo.availableCommands).map(([cmd, available]) => (
                    <div key={cmd} className={`text-sm p-2 rounded ${
                      available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cmd}: {available ? '✅' : '❌'}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">Interfacce di Rete Server</div>
                <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
                  {systemInfo.networkInterfaces}
                </div>
              </div>

              {systemInfo.defaultRoute && (
                <div>
                  <div className="font-medium mb-2">Route di Default</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                    {systemInfo.defaultRoute}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">Errore caricamento informazioni sistema</div>
          )}
        </CardContent>
      </Card>

      {/* Diagnosi Differenza PC vs Server */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Perché il PC funziona ma il server no?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">🤔 Possibili cause:</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li><strong>Vercel/Cloud</strong>: Se su Vercel, le connessioni di rete sono limitate</li>
              <li><strong>Container/Docker</strong>: Il server è in un container con rete isolata</li>
              <li><strong>Firewall server</strong>: Il server ha un firewall diverso dal PC</li>
              <li><strong>NAT/Routing</strong>: Il server ha un percorso di rete diverso</li>
              <li><strong>Privilegi ICMP</strong>: Il server non ha privilegi per ping ICMP</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🧪 Test diagnostici:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Il test sopra mostrerà se il server riesce a raggiungere la stampante</li>
              <li>Verificheremo se è un problema di ping ICMP o di porta 9100</li>
              <li>Testeremo diversi metodi di connessione (nc, telnet, curl)</li>
              <li>Se la porta 9100 è raggiungibile, la stampa dovrebbe funzionare</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✅ Prossimi passi:</h4>
            <p className="text-sm text-green-800">
              Clicca "Test Connettività Server" per vedere se il server riesce a raggiungere la stampante.
              Se la porta 9100 è aperta, potremo procedere con la stampa anche se il ping ICMP fallisce.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
