import Sidebar from '@/components/layout/Sidebar'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b0b13' }}>
      <Sidebar />
      <main className="md:pl-60 min-h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111119', color: '#fff', border: '1px solid rgba(201,168,76,0.2)' },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#000' } },
        }}
      />
    </div>
  )
}
