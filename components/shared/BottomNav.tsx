'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bell, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { href: '/trips', icon: Home, label: 'Trips' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto mb-4 mx-4 bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-black/10 px-2 py-2 flex items-center gap-1 max-w-mobile w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href || (tab.href !== '/trips' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href} className="relative flex-1 flex flex-col items-center py-2 rounded-xl active:scale-95 transition-transform">
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {tab.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
