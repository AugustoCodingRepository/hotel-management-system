import { PrinterTest } from '@/app/components/printer-test'

export default function PrinterTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Diagnosi Stampante - Problema di Rete</h1>
        <p className="text-gray-600">
          Il ping ICMP fallisce - problema di connettività di base
        </p>
      </div>
      
      <PrinterTest />
    </div>
  )
}
