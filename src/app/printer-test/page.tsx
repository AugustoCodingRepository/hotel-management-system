import { NetworkDiagnostics } from '@/app/components/network-diagnostics'

export default function NetworkDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Diagnostica di Rete Avanzata</h1>
        <p className="text-gray-600">
          Analisi completa dell'ambiente di esecuzione e connettività di rete
        </p>
      </div>
      
      <NetworkDiagnostics />
    </div>
  )
}
