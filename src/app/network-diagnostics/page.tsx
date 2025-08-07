import { NetworkDiagnostics } from '@/app/components/network-diagnostics'

export default function NetworkDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Diagnostica di Rete Completa</h1>
        <p className="text-gray-600">
          Analisi approfondita dell'ambiente di hosting e delle capacità di rete
        </p>
      </div>
      
      <NetworkDiagnostics />
    </div>
  )
}
