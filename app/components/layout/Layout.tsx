import type React from 'react'
import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

const Layout = ({ children, showSidebar = true }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setIsSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0F1A1F]">
      <Header onMenuClick={handleMenuClick} />
      <div className="flex flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
        {showSidebar && (
          <>
            <div className="hidden lg:block">
              <Sidebar isOpen={true} onClose={() => {}} />
            </div>
            <div className="lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
            </div>
          </>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export default Layout
