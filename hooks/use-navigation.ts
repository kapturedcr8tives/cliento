"use client"

import { useRouter, usePathname } from "next/navigation"
import { routes } from "@/lib/routes"

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
  }

  const goBack = () => {
    router.back()
  }

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  const isCurrentRoute = (path: string) => pathname === path

  // Helper functions for common navigation patterns
  const goToClients = () => navigateTo(routes.dashboard.clients.list)
  const goToClient = (id: string) => navigateTo(routes.dashboard.clients.detail(id))
  const goToNewClient = () => navigateTo(routes.dashboard.clients.new)

  const goToProjects = () => navigateTo(routes.dashboard.projects.list)
  const goToProject = (id: string) => navigateTo(routes.dashboard.projects.detail(id))
  const goToNewProject = () => navigateTo(routes.dashboard.projects.new)

  const goToTasks = () => navigateTo(routes.dashboard.tasks.list)
  const goToTask = (id: string) => navigateTo(routes.dashboard.tasks.detail(id))
  const goToNewTask = () => navigateTo(routes.dashboard.tasks.new)

  const goToLeads = () => navigateTo(routes.dashboard.leads.list)
  const goToLead = (id: string) => navigateTo(routes.dashboard.leads.detail(id))
  const goToNewLead = () => navigateTo(routes.dashboard.leads.new)

  const goToProposals = () => navigateTo(routes.dashboard.proposals.list)
  const goToProposal = (id: string) => navigateTo(routes.dashboard.proposals.detail(id))
  const goToNewProposal = () => navigateTo(routes.dashboard.proposals.new)

  const goToInvoices = () => navigateTo(routes.dashboard.invoices.list)
  const goToInvoice = (id: string) => navigateTo(routes.dashboard.invoices.detail(id))
  const goToNewInvoice = () => navigateTo(routes.dashboard.invoices.new)

  const goToReports = () => navigateTo(routes.dashboard.reports)
  const goToSettings = () => navigateTo(routes.dashboard.settings)
  const goToDashboard = () => navigateTo(routes.dashboard.home)

  return {
    // Core navigation
    navigateTo,
    goBack,
    isActive,
    isCurrentRoute,
    pathname,

    // Specific navigation helpers
    goToClients,
    goToClient,
    goToNewClient,
    goToProjects,
    goToProject,
    goToNewProject,
    goToTasks,
    goToTask,
    goToNewTask,
    goToLeads,
    goToLead,
    goToNewLead,
    goToProposals,
    goToProposal,
    goToNewProposal,
    goToInvoices,
    goToInvoice,
    goToNewInvoice,
    goToReports,
    goToSettings,
    goToDashboard,

    // Routes object for direct access
    routes,
  }
}
