'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, Bell, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/notifications', icon: Bell, label: 'Notify' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto mb-5 bg-card/95 backdrop-blur-xl border border-border rounded-full shadow-xl shadow-black/10 p-1.5 flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href || (tab.href !== '/trips' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors active:scale-95"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <Icon className={`w-[18px] h-[18px] transition-colors ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  {tab.href === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[13px] font-semibold transition-colors ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
