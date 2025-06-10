"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Building2,
  Users,
  FolderOpen,
  CheckSquare,
  UserPlus,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  ChevronDown,
  Plus,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useNavigation } from "@/hooks/use-navigation"
import { navigationConfig } from "@/lib/routes"

const iconMap = {
  Home,
  Users,
  FolderOpen,
  CheckSquare,
  UserPlus,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Plus,
}

interface SidebarProps {
  user: any
}

export function Sidebar({ user }: SidebarProps) {
  const { navigateTo, isActive, goToDashboard, goToSettings, routes } = useNavigation()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      navigateTo(routes.auth.signin, { replace: true })
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  const handleNavigation = (href: string, itemName?: string) => {
    navigateTo(href)

    // Auto-expand parent if navigating to sub-route
    if (itemName && !expandedItems.includes(itemName)) {
      const navItem = navigationConfig.find((item) => item.name === itemName)
      if (navItem?.subRoutes?.some((sub) => href.startsWith(sub.href))) {
        setExpandedItems((prev) => [...prev, itemName])
      }
    }
  }

  return (
    <div
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 transition-all duration-300 z-30",
        collapsed ? "md:w-16" : "md:w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <button onClick={goToDashboard} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Cliento</span>
          </button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationConfig.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap]
            const isItemActive = isActive(item.href)
            const hasSubRoutes = item.subRoutes && item.subRoutes.length > 0
            const isExpanded = expandedItems.includes(item.name)

            if (hasSubRoutes && !collapsed) {
              return (
                <Collapsible key={item.name} open={isExpanded} onOpenChange={() => toggleExpanded(item.name)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isItemActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-between px-3",
                        isItemActive && "bg-blue-50 text-blue-700 hover:bg-blue-50",
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-3" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    <Button
                      variant={isActive(item.href, true) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start pl-12 text-sm",
                        isActive(item.href, true) && "bg-blue-50 text-blue-700 hover:bg-blue-50",
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      All {item.name}
                    </Button>
                    {item.subRoutes?.slice(1).map((subRoute) => (
                      <Button
                        key={subRoute.href}
                        variant={isActive(subRoute.href, true) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start pl-12 text-sm",
                          isActive(subRoute.href, true) && "bg-blue-50 text-blue-700 hover:bg-blue-50",
                        )}
                        onClick={() => handleNavigation(subRoute.href)}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        {subRoute.name.replace(/^(Add|New|Create)\s+/, "")}
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Button
                key={item.name}
                variant={isItemActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed ? "px-2" : "px-3",
                  isItemActive && "bg-blue-50 text-blue-700 hover:bg-blue-50",
                )}
                onClick={() => handleNavigation(item.href, item.name)}
                title={collapsed ? item.description : undefined}
              >
                <Icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            )
          })}
        </nav>

        <Separator className="my-4" />

        {/* Settings */}
        <Button
          variant={isActive(routes.dashboard.settings) ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start",
            collapsed ? "px-2" : "px-3",
            isActive(routes.dashboard.settings) && "bg-blue-50 text-blue-700 hover:bg-blue-50",
          )}
          onClick={goToSettings}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
          {!collapsed && <span>Settings</span>}
        </Button>

        {/* Sign Out */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed ? "px-2" : "px-3",
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </ScrollArea>

      {/* User info */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
