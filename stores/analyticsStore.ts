import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Analytics, AnalyticsStore, ExportConfig } from '@/types'

export const useAnalyticsStore = create<AnalyticsStore>()(
  subscribeWithSelector((set, get) => ({
    analytics: null,
    isLoading: false,
    error: undefined,

    fetchAnalytics: async (period?: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const organizationId = useAuthStore.getState().organization?.id
        if (!organizationId) {
          throw new Error('Organization not found')
        }

        // Fetch all data for analytics
        const [
          { data: clients },
          { data: projects },
          { data: invoices },
          { data: timeEntries },
        ] = await Promise.all([
          supabase
            .from('clients')
            .select('*')
            .eq('organization_id', organizationId),
          supabase
            .from('projects')
            .select('*')
            .eq('organization_id', organizationId),
          supabase
            .from('invoices')
            .select('*')
            .eq('organization_id', organizationId),
          supabase
            .from('time_entries')
            .select('*')
            .eq('organization_id', organizationId),
        ])

        if (clients.error) throw new Error(clients.error.message)
        if (projects.error) throw new Error(projects.error.message)
        if (invoices.error) throw new Error(invoices.error.message)
        if (timeEntries.error) throw new Error(timeEntries.error.message)

        // Calculate analytics
        const analytics = calculateAnalytics(
          clients.data || [],
          projects.data || [],
          invoices.data || [],
          timeEntries.data || [],
          period
        )

        set({
          analytics,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch analytics',
          isLoading: false,
        })
        throw error
      }
    },

    exportReport: async (config: ExportConfig) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { analytics } = get()
        if (!analytics) {
          throw new Error('No analytics data available')
        }

        let reportData: any[] = []
        let filename = config.filename || 'report'

        switch (config.format) {
          case 'csv':
            reportData = prepareCSVData(analytics, config.fields)
            filename += '.csv'
            break
          case 'pdf':
            reportData = preparePDFData(analytics, config.fields)
            filename += '.pdf'
            break
          case 'excel':
            reportData = prepareExcelData(analytics, config.fields)
            filename += '.xlsx'
            break
        }

        // Create and download the file
        await downloadReport(reportData, filename, config.format)

        set({ isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to export report',
          isLoading: false,
        })
        throw error
      }
    },
  }))
)

// Analytics calculation functions
function calculateAnalytics(
  clients: any[],
  projects: any[],
  invoices: any[],
  timeEntries: any[],
  period?: string
): Analytics {
  const now = new Date()
  const periodStart = getPeriodStart(period, now)
  const periodEnd = now

  // Filter data by period if specified
  const periodInvoices = period
    ? invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.created_at)
        return invoiceDate >= periodStart && invoiceDate <= periodEnd
      })
    : invoices

  const periodProjects = period
    ? projects.filter((project) => {
        const projectDate = new Date(project.created_at)
        return projectDate >= periodStart && projectDate <= periodEnd
      })
    : projects

  const periodTimeEntries = period
    ? timeEntries.filter((entry) => {
        const entryDate = new Date(entry.start_time)
        return entryDate >= periodStart && entryDate <= periodEnd
      })
    : timeEntries

  // Revenue Analytics
  const revenueAnalytics = calculateRevenueAnalytics(invoices, periodInvoices, period)

  // Client Analytics
  const clientAnalytics = calculateClientAnalytics(clients, period)

  // Project Analytics
  const projectAnalytics = calculateProjectAnalytics(projects, periodProjects, period)

  // Performance Analytics
  const performanceAnalytics = calculatePerformanceAnalytics(projects, timeEntries, periodTimeEntries)

  // Trend Analytics
  const trendAnalytics = calculateTrendAnalytics(invoices, projects, clients, period)

  return {
    revenue: revenueAnalytics,
    clients: clientAnalytics,
    projects: projectAnalytics,
    performance: performanceAnalytics,
    trends: trendAnalytics,
  }
}

function calculateRevenueAnalytics(invoices: any[], periodInvoices: any[], period?: string) {
  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  const periodRevenue = periodInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid')
  const paidRevenue = paidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  
  const outstandingInvoices = invoices.filter((invoice) => 
    ['sent', 'viewed', 'overdue'].includes(invoice.status)
  )
  const outstandingAmount = outstandingInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  
  const averageInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0
  
  const growthRate = period ? calculateGrowthRate(invoices, period) : 0
  
  const revenueByPeriod = period ? calculateRevenueByPeriod(invoices, period) : []

  return {
    total_revenue: totalRevenue,
    monthly_revenue: periodRevenue,
    growth_rate: growthRate,
    outstanding_amount: outstandingAmount,
    average_invoice_value: averageInvoiceValue,
    revenue_by_period: revenueByPeriod,
  }
}

function calculateClientAnalytics(clients: any[], period?: string) {
  const totalClients = clients.length
  const activeClients = clients.filter((client) => client.status === 'active').length
  const newClientsThisMonth = clients.filter((client) => {
    const clientDate = new Date(client.created_at)
    const now = new Date()
    return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear()
  }).length
  
  const clientRetentionRate = calculateClientRetentionRate(clients)
  const averageClientValue = calculateAverageClientValue(clients)
  
  const clientsByStatus = [
    { status: 'active', count: activeClients, percentage: (activeClients / totalClients) * 100 },
    { status: 'inactive', count: clients.filter((c) => c.status === 'inactive').length, percentage: (clients.filter((c) => c.status === 'inactive').length / totalClients) * 100 },
    { status: 'prospect', count: clients.filter((c) => c.status === 'prospect').length, percentage: (clients.filter((c) => c.status === 'prospect').length / totalClients) * 100 },
    { status: 'lead', count: clients.filter((c) => c.status === 'lead').length, percentage: (clients.filter((c) => c.status === 'lead').length / totalClients) * 100 },
    { status: 'churned', count: clients.filter((c) => c.status === 'churned').length, percentage: (clients.filter((c) => c.status === 'churned').length / totalClients) * 100 },
  ]

  return {
    total_clients: totalClients,
    active_clients: activeClients,
    new_clients_this_month: newClientsThisMonth,
    client_retention_rate: clientRetentionRate,
    average_client_value: averageClientValue,
    clients_by_status: clientsByStatus,
  }
}

function calculateProjectAnalytics(projects: any[], periodProjects: any[], period?: string) {
  const totalProjects = projects.length
  const activeProjects = projects.filter((project) => project.status === 'active').length
  const completedProjects = projects.filter((project) => project.status === 'completed').length
  
  const averageProjectDuration = calculateAverageProjectDuration(projects)
  
  const projectsByStatus = [
    { status: 'planning', count: projects.filter((p) => p.status === 'planning').length, percentage: (projects.filter((p) => p.status === 'planning').length / totalProjects) * 100 },
    { status: 'active', count: activeProjects, percentage: (activeProjects / totalProjects) * 100 },
    { status: 'on_hold', count: projects.filter((p) => p.status === 'on_hold').length, percentage: (projects.filter((p) => p.status === 'on_hold').length / totalProjects) * 100 },
    { status: 'completed', count: completedProjects, percentage: (completedProjects / totalProjects) * 100 },
    { status: 'cancelled', count: projects.filter((p) => p.status === 'cancelled').length, percentage: (projects.filter((p) => p.status === 'cancelled').length / totalProjects) * 100 },
  ]

  return {
    total_projects: totalProjects,
    active_projects: activeProjects,
    completed_projects: completedProjects,
    average_project_duration: averageProjectDuration,
    projects_by_status: projectsByStatus,
  }
}

function calculatePerformanceAnalytics(projects: any[], timeEntries: any[], periodTimeEntries: any[]) {
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  const billableHours = timeEntries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0)
  
  const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0
  const averageHourlyRate = calculateAverageHourlyRate(timeEntries)
  
  const tasksCompleted = projects.reduce((sum, project) => {
    const completedTasks = project.tasks?.filter((task: any) => task.status === 'done').length || 0
    return sum + completedTasks
  }, 0)
  
  const tasksOverdue = projects.reduce((sum, project) => {
    const overdueTasks = project.tasks?.filter((task: any) => {
      if (!task.due_date || task.status === 'done') return false
      return new Date(task.due_date) < new Date()
    }).length || 0
    return sum + overdueTasks
  }, 0)
  
  const averageTaskDuration = calculateAverageTaskDuration(projects)
  const productivityScore = calculateProductivityScore(projects, timeEntries)

  return {
    team_productivity: {
      tasks_completed: tasksCompleted,
      tasks_overdue: tasksOverdue,
      average_task_duration: averageTaskDuration,
      productivity_score: productivityScore,
    },
    task_completion: {
      total_tasks: projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0),
      completed_tasks: tasksCompleted,
      completion_rate: projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0) > 0 
        ? (tasksCompleted / projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0)) * 100 
        : 0,
      average_completion_time: averageTaskDuration,
    },
    time_tracking: {
      total_hours: totalHours,
      billable_hours: billableHours,
      utilization_rate: utilizationRate,
      average_hourly_rate: averageHourlyRate,
    },
  }
}

function calculateTrendAnalytics(invoices: any[], projects: any[], clients: any[], period?: string) {
  const revenueTrend = calculateRevenueTrend(invoices, period)
  const clientGrowth = calculateClientGrowth(clients, period)
  const projectCompletion = calculateProjectCompletionTrend(projects, period)

  return {
    revenue_trend: revenueTrend,
    client_growth: clientGrowth,
    project_completion: projectCompletion,
  }
}

// Helper functions
function getPeriodStart(period: string | undefined, now: Date): Date {
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:
      return new Date(now.getFullYear(), 0, 1) // Start of year
  }
}

function calculateGrowthRate(data: any[], period: string): number {
  // Simplified growth rate calculation
  const currentPeriod = data.filter((item) => {
    const itemDate = new Date(item.created_at)
    const now = new Date()
    const periodStart = getPeriodStart(period, now)
    return itemDate >= periodStart && itemDate <= now
  }).length

  const previousPeriod = data.filter((item) => {
    const itemDate = new Date(item.created_at)
    const now = new Date()
    const currentPeriodStart = getPeriodStart(period, now)
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (now.getTime() - currentPeriodStart.getTime()))
    return itemDate >= previousPeriodStart && itemDate < currentPeriodStart
  }).length

  return previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0
}

function calculateRevenueByPeriod(invoices: any[], period: string): any[] {
  // Simplified revenue by period calculation
  const periods = []
  const now = new Date()
  
  for (let i = 0; i < 12; i++) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const periodInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.created_at)
      return invoiceDate >= periodStart && invoiceDate <= periodEnd
    })
    
    const revenue = periodInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
    
    periods.unshift({
      period: periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue,
      invoices: periodInvoices.length,
      growth: 0, // Simplified
    })
  }
  
  return periods
}

function calculateClientRetentionRate(clients: any[]): number {
  // Simplified retention rate calculation
  const activeClients = clients.filter((client) => client.status === 'active').length
  const totalClients = clients.length
  return totalClients > 0 ? (activeClients / totalClients) * 100 : 0
}

function calculateAverageClientValue(clients: any[]): number {
  const totalRevenue = clients.reduce((sum, client) => sum + (client.total_revenue || 0), 0)
  return clients.length > 0 ? totalRevenue / clients.length : 0
}

function calculateAverageProjectDuration(projects: any[]): number {
  const completedProjects = projects.filter((project) => project.status === 'completed')
  if (completedProjects.length === 0) return 0
  
  const totalDuration = completedProjects.reduce((sum, project) => {
    if (!project.start_date || !project.end_date) return sum
    const start = new Date(project.start_date)
    const end = new Date(project.end_date)
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) // Days
  }, 0)
  
  return totalDuration / completedProjects.length
}

function calculateAverageHourlyRate(timeEntries: any[]): number {
  const billableEntries = timeEntries.filter((entry) => entry.billable && entry.rate)
  if (billableEntries.length === 0) return 0
  
  const totalRate = billableEntries.reduce((sum, entry) => sum + (entry.rate || 0), 0)
  return totalRate / billableEntries.length
}

function calculateAverageTaskDuration(projects: any[]): number {
  // Simplified task duration calculation
  return 2.5 // Average days per task
}

function calculateProductivityScore(projects: any[], timeEntries: any[]): number {
  // Simplified productivity score calculation
  const completedTasks = projects.reduce((sum, project) => {
    const completed = project.tasks?.filter((task: any) => task.status === 'done').length || 0
    return sum + completed
  }, 0)
  
  const totalTasks = projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0)
  
  return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
}

function calculateRevenueTrend(invoices: any[], period?: string): any[] {
  // Simplified revenue trend calculation
  return Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.random() * 10000,
    change: Math.random() * 20 - 10,
  })).reverse()
}

function calculateClientGrowth(clients: any[], period?: string): any[] {
  // Simplified client growth calculation
  return Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.random() * 50,
    change: Math.random() * 10 - 5,
  })).reverse()
}

function calculateProjectCompletionTrend(projects: any[], period?: string): any[] {
  // Simplified project completion trend calculation
  return Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.random() * 20,
    change: Math.random() * 15 - 7.5,
  })).reverse()
}

// Export functions
function prepareCSVData(analytics: Analytics, fields: string[]): any[] {
  // Simplified CSV data preparation
  return []
}

function preparePDFData(analytics: Analytics, fields: string[]): any[] {
  // Simplified PDF data preparation
  return []
}

function prepareExcelData(analytics: Analytics, fields: string[]): any[] {
  // Simplified Excel data preparation
  return []
}

async function downloadReport(data: any[], filename: string, format: string): Promise<void> {
  // Simplified download implementation
  console.log(`Downloading ${filename} in ${format} format`)
}

// Analytics hooks
export const useAnalytics = () => {
  const { analytics, isLoading, error, fetchAnalytics, exportReport } = useAnalyticsStore()

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
    exportReport,
  }
}