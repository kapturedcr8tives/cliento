"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Activity,
  Download,
  Share2,
  Plus,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Table,
  Eye,
  Edit,
  Trash2,
  Settings
} from "lucide-react"
import { salesPipelineService } from "@/lib/sales-pipeline"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Report {
  id: string
  name: string
  description?: string
  report_type: string
  configuration: any
  is_public: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

interface ReportData {
  salesData: any[]
  leadData: any[]
  conversionData: any[]
  forecastData: any[]
  kpis: {
    totalRevenue: number
    totalLeads: number
    conversionRate: number
    averageDealSize: number
    salesCycle: number
    winRate: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    end: new Date()
  })
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar')

  useEffect(() => {
    loadReports()
    loadReportData()
  }, [dateRange])

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('organization_id', authService.getCurrentOrganization()?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      const [pipelineAnalytics, salesForecast] = await Promise.all([
        salesPipelineService.getPipelineAnalytics(),
        salesPipelineService.getSalesForecast('month')
      ])

      // Generate sample data for different chart types
      const salesData = [
        { month: 'Jan', revenue: 45000, leads: 25, deals: 8 },
        { month: 'Feb', revenue: 52000, leads: 30, deals: 10 },
        { month: 'Mar', revenue: 48000, leads: 28, deals: 9 },
        { month: 'Apr', revenue: 61000, leads: 35, deals: 12 },
        { month: 'May', revenue: 55000, leads: 32, deals: 11 },
        { month: 'Jun', revenue: 67000, leads: 38, deals: 14 }
      ]

      const leadData = [
        { source: 'Website', count: 45, conversion: 12 },
        { source: 'Referral', count: 28, conversion: 18 },
        { source: 'Social', count: 32, conversion: 8 },
        { source: 'Email', count: 15, conversion: 5 },
        { source: 'Cold Call', count: 20, conversion: 3 }
      ]

      const conversionData = [
        { stage: 'New', count: 100, converted: 0 },
        { stage: 'Contacted', count: 80, converted: 20 },
        { stage: 'Qualified', count: 60, converted: 40 },
        { stage: 'Proposal', count: 40, converted: 60 },
        { stage: 'Negotiation', count: 25, converted: 75 },
        { stage: 'Closed Won', count: 15, converted: 100 }
      ]

      const kpis = {
        totalRevenue: salesData.reduce((sum, item) => sum + item.revenue, 0),
        totalLeads: salesData.reduce((sum, item) => sum + item.leads, 0),
        conversionRate: 15.2,
        averageDealSize: 4500,
        salesCycle: 45,
        winRate: 68.5
      }

      setReportData({
        salesData,
        leadData,
        conversionData,
        forecastData: salesForecast,
        kpis
      })
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (formData: FormData) => {
    try {
      const reportData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        report_type: formData.get('report_type') as string,
        configuration: {
          chart_type: formData.get('chart_type') as string,
          data_source: formData.get('data_source') as string,
          filters: {}
        },
        is_public: formData.get('is_public') === 'true',
        organization_id: authService.getCurrentOrganization()?.id,
        created_by: authService.getCurrentUser()?.id
      }

      const { data, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single()

      if (error) throw error

      setShowCreateDialog(false)
      loadReports()
    } catch (error) {
      console.error('Error creating report:', error)
    }
  }

  const updateReport = async (formData: FormData) => {
    if (!selectedReport) return

    try {
      const updates = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        configuration: {
          chart_type: formData.get('chart_type') as string,
          data_source: formData.get('data_source') as string,
          filters: {}
        },
        is_public: formData.get('is_public') === 'true'
      }

      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', selectedReport.id)

      if (error) throw error

      setShowEditDialog(false)
      setSelectedReport(null)
      loadReports()
    } catch (error) {
      console.error('Error updating report:', error)
    }
  }

  const deleteReport = async (reportId: string) => {
    try {
      await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      loadReports()
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const exportReport = async (reportId: string, format: 'pdf' | 'csv' | 'excel') => {
    // Implement export functionality
    console.log(`Exporting report ${reportId} as ${format}`)
  }

  const shareReport = async (reportId: string) => {
    // Implement share functionality
    console.log(`Sharing report ${reportId}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const renderChart = (data: any[], type: string) => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your sales performance
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Build a custom report with your preferred data and visualization
              </DialogDescription>
            </DialogHeader>
            <form action={createReport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report_type">Report Type</Label>
                  <Select name="report_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="leads">Lead Report</SelectItem>
                      <SelectItem value="conversion">Conversion Report</SelectItem>
                      <SelectItem value="forecast">Forecast Report</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chart_type">Chart Type</Label>
                  <Select name="chart_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chart" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_source">Data Source</Label>
                <Select name="data_source" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="opportunities">Opportunities</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="is_public" name="is_public" value="true" />
                <Label htmlFor="is_public">Make report public</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Report</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData.kpis.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-600" /> +12.5% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.kpis.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-600" /> +8.2% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.kpis.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-600" /> +2.1% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.kpis.winRate}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-600" /> +5.3% from last period
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Analytics</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly revenue performance
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {reportData && (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={reportData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1"
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>
                  Distribution by lead source
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={reportData.leadData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, count }) => `${source}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportData.leadData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>
                  Revenue and deal metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3B82F6" />
                      <Bar dataKey="deals" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Forecast</CardTitle>
                <CardDescription>
                  Projected revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="weighted_value" stroke="#3B82F6" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Generation</CardTitle>
                <CardDescription>
                  Monthly lead acquisition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="leads" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Source Performance</CardTitle>
                <CardDescription>
                  Conversion rates by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.leadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversion" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Conversion</CardTitle>
                <CardDescription>
                  Conversion rates by stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.conversionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="converted" fill="#10B981" />
                      <Bar dataKey="count" fill="#6B7280" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>
                  Stage-by-stage conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportData.conversionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="converted" 
                        stackId="1"
                        stroke="#10B981" 
                        fill="#10B981" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportReport(report.id, 'pdf')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareReport(report.id)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Chart preview for {report.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Report Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Update report configuration
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <form action={updateReport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Report Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={selectedReport.name}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={selectedReport.description}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-report_type">Report Type</Label>
                  <Select name="report_type" defaultValue={selectedReport.report_type} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="leads">Lead Report</SelectItem>
                      <SelectItem value="conversion">Conversion Report</SelectItem>
                      <SelectItem value="forecast">Forecast Report</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-chart_type">Chart Type</Label>
                  <Select name="chart_type" defaultValue={selectedReport.configuration?.chart_type} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chart" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="edit-is_public" 
                  name="is_public" 
                  value="true" 
                  defaultChecked={selectedReport.is_public}
                />
                <Label htmlFor="edit-is_public">Make report public</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Report</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
