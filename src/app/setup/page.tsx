import { DatabaseStatus } from "@/app/components/database-status"
import { DatabaseInitializer } from "@/app/components/database-initializer"
import { InventorySeeder } from "@/app/components/inventory-seeder"
import { EnvChecker } from "@/app/components/env-checker"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Hotel Management System</h1>
          <p className="text-gray-600">Configura il database e inizializza i dati di base</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <EnvChecker />
          <DatabaseStatus />
          <DatabaseInitializer />
          <InventorySeeder />
        </div>
      </div>
    </div>
  )
}
