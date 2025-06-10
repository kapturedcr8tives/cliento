"use client"

import { ChevronRight, Home } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { Button } from "@/components/ui/button"

export function Breadcrumbs() {
  const { pathname, navigateTo, routes } = useNavigation()

  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    // Always start with Dashboard
    breadcrumbs.push({
      label: "Dashboard",
      href: routes.dashboard.home,
      isActive: pathname === routes.dashboard.home,
    })

    if (segments.length > 1) {
      const section = segments[1]

      // Add section breadcrumb
      const sectionMap: Record<string, { label: string; href: string }> = {
        clients: { label: "Clients", href: routes.dashboard.clients.list },
        projects: { label: "Projects", href: routes.dashboard.projects.list },
        tasks: { label: "Tasks", href: routes.dashboard.tasks.list },
        leads: { label: "Leads", href: routes.dashboard.leads.list },
        proposals: { label: "Proposals", href: routes.dashboard.proposals.list },
        invoices: { label: "Invoices", href: routes.dashboard.invoices.list },
        reports: { label: "Reports", href: routes.dashboard.reports },
        settings: { label: "Settings", href: routes.dashboard.settings },
      }

      if (sectionMap[section]) {
        breadcrumbs.push({
          label: sectionMap[section].label,
          href: sectionMap[section].href,
          isActive: pathname === sectionMap[section].href,
        })

        // Add detail page breadcrumb if applicable
        if (segments.length > 2) {
          const action = segments[2]

          if (action === "new") {
            breadcrumbs.push({
              label: `New ${sectionMap[section].label.slice(0, -1)}`,
              href: pathname,
              isActive: true,
            })
          } else if (action !== "new") {
            // This is likely an ID, so it's a detail page
            breadcrumbs.push({
              label: `${sectionMap[section].label.slice(0, -1)} Details`,
              href: pathname,
              isActive: true,
            })
          }
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="flex items-center space-x-1 text-sm">
      <Button variant="ghost" size="sm" onClick={() => navigateTo(routes.dashboard.home)} className="p-1 h-auto">
        <Home className="h-4 w-4" />
      </Button>

      {breadcrumbs.slice(1).map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => !breadcrumb.isActive && navigateTo(breadcrumb.href)}
            className={`p-1 h-auto ${
              breadcrumb.isActive ? "text-gray-900 font-medium cursor-default" : "text-gray-600 hover:text-gray-900"
            }`}
            disabled={breadcrumb.isActive}
          >
            {breadcrumb.label}
          </Button>
        </div>
      ))}
    </nav>
  )
}
