'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Bot,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  Palette,
  Plus,
  ChevronLeft,
  Sparkles,
  Workflow,
  Store
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { t } = useLanguage()

  const navigation = [
    { name: t('dashboard', 'navigation'), href: '/', icon: LayoutDashboard },
    { name: t('myAgents', 'navigation'), href: '/agents', icon: Bot },
    { name: t('pipelineBuilder', 'navigation'), href: '/builder', icon: Workflow },
    { name: t('providerMarketplace', 'navigation'), href: '/providers', icon: Store },
    { name: t('analytics', 'navigation'), href: '/analytics', icon: BarChart3 },
    { name: t('templates', 'navigation'), href: '/templates', icon: Palette },
    { name: t('whiteLabel', 'navigation'), href: '/white-label', icon: Users, badge: 'Pro' },
    { name: t('settings', 'navigation'), href: '/settings', icon: Settings },
  ]

  return (
    <div className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.webp"
              alt="Agenty Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-sidebar-foreground">Agenty</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Create Agent Button */}
      <div className="p-4">
        <Button
          className={cn(
            "w-full bg-primary text-primary-foreground hover:bg-primary/90",
            collapsed && "px-2"
          )}
          asChild
        >
          <Link href="/agents/new">
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="ml-2">{t('createAgent', 'navigation')}</span>}
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && (
                <>
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Build with Agenty */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-sidebar-foreground">
                {t('title', 'buildWithAgenty')}
              </span>
            </div>
            <p className="text-xs text-sidebar-foreground/70 mb-3">
              {t('description', 'buildWithAgenty')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
              asChild
            >
              <Link href="/build">
                {t('tryAIBuilder', 'buildWithAgenty')}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}