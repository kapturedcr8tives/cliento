"use client"

import { Home, Users, FolderOpen, CheckSquare, MoreHorizontal } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const primaryNavigation = [
  { name: "Dashboard", icon: Home, action: "goToDashboard" },
  { name: "Clients", icon: Users, action: "goToClients" },
  { name: "Projects", icon: FolderOpen, action: "goToProjects" },
  { name: "Tasks", icon: CheckSquare, action: "goToTasks" },
]

const secondaryNavigation = [
  { name: "Leads", action: "goToLeads" },
  { name: "Proposals", action: "goToProposals" },
  { name: "Invoices", action: "goToInvoices" },
  { name: "Reports", action: "goToReports" },
  { name: "Settings", action: "goToSettings" },
]

export function MobileNav() {
  const navigation = useNavigation()

  const handleNavigation = (action: string) => {
    const navFunction = navigation[action as keyof typeof navigation] as () => void
    if (typeof navFunction === "function") {
      navFunction()
    }
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="grid grid-cols-5 py-2">
        {primaryNavigation.map((item) => {
          const isActive = navigation.isActive(
            item.action === "goToDashboard"
              ? navigation.routes.dashboard.home
              : (navigation.routes.dashboard[
                  item.name.toLowerCase() as keyof typeof navigation.routes.dashboard
                ] as string),
          )

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.action)}
              className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="truncate">{item.name}</span>
            </button>
          )
        })}

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-gray-900 transition-colors">
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="truncate">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {secondaryNavigation.map((item) => (
              <DropdownMenuItem
                key={item.name}
                onClick={() => handleNavigation(item.action)}
                className="cursor-pointer"
              >
                {item.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
