"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  FolderOpen, 
  Receipt, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  DollarSign,
  Target,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useClientStore, clientHelpers } from "@/stores/clientStore"
import { useProjectStore, projectHelpers } from "@/stores/projectStore"
import { useInvoiceStore, invoiceHelpers } from "@/stores/invoiceStore"
import { useAnalyticsStore } from "@/stores/analyticsStore"
import { useNotifications } from "@/stores/notificationStore"
import { useNavigation } from "@/hooks/use-navigation"
import { quickActionsConfig } from "@/lib/routes"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user, organization } = useAuthStore()
  const { clients, fetchClients } = useClientStore()
  const { projects, fetchProjects } = useProjectStore()
  const { invoices, fetchInvoices } = useInvoiceStore()
  const { analytics, fetchAnalytics } = useAnalyticsStore()
  const { notifications, unreadCount, fetchNotifications } = useNotifications()
  const { navigateTo } = useNavigation()
  
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await Promise.all([
          fetchClients(),
          fetchProjects(),
          fetchInvoices(),
          fetchAnalytics(),
          fetchNotifications(),
        ])
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [fetchClients, fetchProjects, fetchInvoices, fetchAnalytics, fetchNotifications])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const clientStats = clientHelpers.getClientStats()
  const projectStats = projectHelpers.getProjectStats()
  const invoiceStats = invoiceHelpers.getInvoiceStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.full_name || user?.email}!
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{unreadCount} new notifications</span>
          </Badge>
          <Button onClick={() => navigateTo("/dashboard/settings")}>
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActionsConfig.map((action) => (
              <Button
                key={action.name}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => navigateTo(action.href)}
              >
                <div className={cn(
                  "p-2 rounded-full",
                  action.color === "blue" && "bg-blue-100 text-blue-600",
                  action.color === "green" && "bg-green-100 text-green-600",
                  action.color === "orange" && "bg-orange-100 text-orange-600",
                  action.color === "emerald" && "bg-emerald-100 text-emerald-600",
                  action.color === "purple" && "bg-purple-100 text-purple-600",
                  action.color === "indigo" && "bg-indigo-100 text-indigo-600",
                )}>
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{action.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${invoiceStats.totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{invoiceStats.paidAmount.toLocaleString()} collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientStats.active}</div>
                <p className="text-xs text-muted-foreground">
                  +{clientStats.newClientsThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.active}</div>
                <p className="text-xs text-muted-foreground">
                  {projectStats.completed} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${invoiceStats.outstandingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoiceStats.sent + invoiceStats.viewed + invoiceStats.overdue} invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Monthly revenue trends and projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${invoiceStats.monthlyRevenue.toLocaleString()}</span>
                    <span>Target: $50,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>
                  Overall project completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-blue-600">
                      {projectStats.completed}/{projectStats.total}
                    </span>
                  </div>
                  <Progress 
                    value={projectStats.total > 0 ? (projectStats.completed / projectStats.total) * 100 : 0} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{projectStats.active} active</span>
                    <span>{projectStats.completed} completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Revenue Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${analytics.revenue.total_revenue.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        ${analytics.revenue.monthly_revenue.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">This Month</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.revenue.growth_rate.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Growth Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Client Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.clients.total_clients}
                      </div>
                      <p className="text-sm text-gray-600">Total Clients</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.clients.active_clients}
                      </div>
                      <p className="text-sm text-gray-600">Active Clients</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.clients.client_retention_rate.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Retention Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5" />
                    <span>Project Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {analytics.projects.total_projects}
                      </div>
                      <p className="text-sm text-gray-600">Total Projects</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.projects.active_projects}
                      </div>
                      <p className="text-sm text-gray-600">Active Projects</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.projects.average_project_duration.toFixed(1)} days
                      </div>
                      <p className="text-sm text-gray-600">Avg Duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">Loading analytics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>
                Latest client additions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientHelpers.getRecentClients(5).map((client) => (
                  <div key={client.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Latest project updates and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectHelpers.getRecentProjects(5).map((project) => (
                  <div key={project.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {analytics ? (
            <>
              {/* Team Productivity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Team Productivity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.performance.team_productivity.tasks_completed}
                      </div>
                      <p className="text-sm text-gray-600">Tasks Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.performance.team_productivity.tasks_overdue}
                      </div>
                      <p className="text-sm text-gray-600">Tasks Overdue</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.performance.team_productivity.average_task_duration.toFixed(1)} days
                      </div>
                      <p className="text-sm text-gray-600">Avg Task Duration</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.performance.team_productivity.productivity_score.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Productivity Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Time Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.performance.time_tracking.total_hours.toFixed(1)}h
                      </div>
                      <p className="text-sm text-gray-600">Total Hours</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.performance.time_tracking.billable_hours.toFixed(1)}h
                      </div>
                      <p className="text-sm text-gray-600">Billable Hours</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.performance.time_tracking.utilization_rate.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Utilization Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ${analytics.performance.time_tracking.average_hourly_rate.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600">Avg Hourly Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">Loading performance data...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
