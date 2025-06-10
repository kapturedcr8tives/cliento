"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FolderOpen, CheckSquare, DollarSign, TrendingUp, Clock, Plus, ArrowRight, FileText } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { quickActionsConfig } from "@/lib/routes"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    tasks: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  const navigation = useNavigation()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user)
    }

    const fetchStats = async () => {
      try {
        const [clientsResult, projectsResult, tasksResult] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }),
          supabase.from("projects").select("*", { count: "exact", head: true }),
          supabase.from("tasks").select("*", { count: "exact", head: true }),
        ])

        setStats({
          clients: clientsResult.count || 0,
          projects: projectsResult.count || 0,
          tasks: tasksResult.count || 0,
          revenue: 45230, // Mock data
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
    fetchStats()
  }, [])

  const dashboardStats = [
    {
      title: "Total Clients",
      value: stats.clients.toString(),
      change: "+2 this month",
      icon: Users,
      color: "text-blue-600",
      onClick: navigation.goToClients,
    },
    {
      title: "Active Projects",
      value: stats.projects.toString(),
      change: "+3 this week",
      icon: FolderOpen,
      color: "text-green-600",
      onClick: navigation.goToProjects,
    },
    {
      title: "Pending Tasks",
      value: stats.tasks.toString(),
      change: "-5 today",
      icon: CheckSquare,
      color: "text-orange-600",
      onClick: navigation.goToTasks,
    },
    {
      title: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      change: "+12% this month",
      icon: DollarSign,
      color: "text-emerald-600",
      onClick: navigation.goToReports,
    },
  ]

  const recentActivity = [
    {
      action: "New client added",
      client: "Acme Corporation",
      time: "2 hours ago",
      type: "client",
      onClick: () => navigation.goToClients(),
    },
    {
      action: "Project completed",
      client: "Tech Startup Inc",
      time: "4 hours ago",
      type: "project",
      onClick: () => navigation.goToProjects(),
    },
    {
      action: "Invoice sent",
      client: "Design Agency",
      time: "6 hours ago",
      type: "invoice",
      onClick: () => navigation.goToInvoices(),
    },
    {
      action: "Task completed",
      client: "E-commerce Store",
      time: "8 hours ago",
      type: "task",
      onClick: () => navigation.goToTasks(),
    },
  ]

  // Icon mapping object
  const iconMap = {
    Users: Users,
    FolderOpen: FolderOpen,
    CheckSquare: CheckSquare,
    DollarSign: DollarSign,
    Plus: Plus,
    FileText: FileText,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.full_name || "User"}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your business today.</p>
        </div>
        <Button onClick={navigation.goToReports}>
          <TrendingUp className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-all cursor-pointer group" onClick={stat.onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="flex items-center space-x-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={activity.onClick}
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.client}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <Badge variant="secondary">{activity.time}</Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActionsConfig.slice(0, 6).map((action) => {
                // Get the icon component from our mapping or default to Plus
                const IconComponent = iconMap[action.icon as keyof typeof iconMap] || Plus

                return (
                  <Button
                    key={action.name}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-all"
                    onClick={() => navigation.navigateTo(action.href)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium text-center">{action.name}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={navigation.goToLeads}>
          <CardHeader>
            <CardTitle className="text-lg">Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-600">Active Leads</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={navigation.goToProposals}>
          <CardHeader>
            <CardTitle className="text-lg">Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={navigation.goToInvoices}>
          <CardHeader>
            <CardTitle className="text-lg">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">$8,500</p>
                <p className="text-sm text-gray-600">Outstanding</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
