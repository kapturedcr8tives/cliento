'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Send, Download, CreditCard, DollarSign, Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

import { useInvoiceStore } from '@/stores/invoiceStore'
import { useModal } from '@/stores/modalStore'
import { useAuthStore } from '@/stores/authStore'
import { Invoice, InvoiceStatus } from '@/types'

export default function InvoicesPage() {
  const router = useRouter()
  const { user, organization } = useAuthStore()
  const { 
    invoices, 
    isLoading, 
    error, 
    fetchInvoices, 
    deleteInvoice,
    sendInvoice,
    recordPayment,
    invoiceHelpers 
  } = useInvoiceStore()
  const { openModal } = useModal()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (user && organization) {
      fetchInvoices()
    }
  }, [user, organization, fetchInvoices])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}`)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    openModal({
      id: 'edit-invoice',
      type: 'form',
      title: 'Edit Invoice',
      size: 'lg',
      data: invoice,
      config: {
        fields: [
          { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
          { name: 'title', label: 'Invoice Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'clientId', label: 'Client', type: 'select', required: true },
          { name: 'projectId', label: 'Related Project', type: 'select', required: false },
          { name: 'type', label: 'Invoice Type', type: 'select', required: true },
          { name: 'subtotal', label: 'Subtotal', type: 'number', required: true },
          { name: 'taxRate', label: 'Tax Rate (%)', type: 'number', required: false },
          { name: 'taxAmount', label: 'Tax Amount', type: 'number', required: false },
          { name: 'total', label: 'Total Amount', type: 'number', required: true },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'notes', label: 'Notes', type: 'textarea', required: false },
          { name: 'terms', label: 'Terms & Conditions', type: 'textarea', required: false }
        ]
      }
    })
  }

  const handleDeleteInvoice = (invoice: Invoice) => {
    openModal({
      id: 'delete-invoice',
      type: 'delete',
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice "${invoice.invoiceNumber}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteInvoice(invoice.id)
          fetchInvoices()
        } catch (error) {
          console.error('Failed to delete invoice:', error)
        }
      }
    })
  }

  const handleSendInvoice = (invoice: Invoice) => {
    openModal({
      id: 'send-invoice',
      type: 'confirm',
      title: 'Send Invoice',
      message: `Send invoice "${invoice.invoiceNumber}" to ${invoice.client?.name || 'the client'}?`,
      onConfirm: async () => {
        try {
          await sendInvoice(invoice.id)
          fetchInvoices()
        } catch (error) {
          console.error('Failed to send invoice:', error)
        }
      }
    })
  }

  const handleRecordPayment = (invoice: Invoice) => {
    openModal({
      id: 'record-payment',
      type: 'form',
      title: 'Record Payment',
      size: 'md',
      data: { invoiceId: invoice.id },
      config: {
        fields: [
          { name: 'amount', label: 'Payment Amount', type: 'number', required: true },
          { name: 'paymentMethod', label: 'Payment Method', type: 'select', required: true },
          { name: 'transactionId', label: 'Transaction ID', type: 'text', required: false },
          { name: 'notes', label: 'Payment Notes', type: 'textarea', required: false }
        ]
      }
    })
  }

  const handleAddInvoice = () => {
    openModal({
      id: 'add-invoice',
      type: 'form',
      title: 'Create New Invoice',
      size: 'lg',
      config: {
        fields: [
          { name: 'title', label: 'Invoice Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'clientId', label: 'Client', type: 'select', required: true },
          { name: 'projectId', label: 'Related Project', type: 'select', required: false },
          { name: 'type', label: 'Invoice Type', type: 'select', required: true },
          { name: 'subtotal', label: 'Subtotal', type: 'number', required: true },
          { name: 'taxRate', label: 'Tax Rate (%)', type: 'number', required: false },
          { name: 'total', label: 'Total Amount', type: 'number', required: true },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'notes', label: 'Notes', type: 'textarea', required: false },
          { name: 'terms', label: 'Terms & Conditions', type: 'textarea', required: false }
        ]
      }
    })
  }

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      const matchesType = typeFilter === 'all' || invoice.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'invoiceNumber':
          aValue = a.invoiceNumber?.toLowerCase() || ''
          bValue = b.invoiceNumber?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'total':
          aValue = a.total || 0
          bValue = b.total || 0
          break
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Get invoice statistics
  const invoiceStats = invoiceHelpers.getInvoiceStats(invoices)
  const recentInvoices = invoiceHelpers.getRecentInvoices(invoices, 5)
  const overdueInvoices = invoiceHelpers.getOverdueInvoices(invoices)

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'viewed': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-gray-500" />
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />
      case 'viewed': return <Eye className="h-4 w-4 text-yellow-500" />
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-purple-100 text-purple-800'
      case 'project': return 'bg-blue-100 text-blue-800'
      case 'retainer': return 'bg-green-100 text-green-800'
      case 'consultation': return 'bg-orange-100 text-orange-800'
      case 'recurring': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getPaymentProgress = (invoice: Invoice) => {
    const paid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const total = invoice.total || 0
    return total > 0 ? (paid / total) * 100 : 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load invoices</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => fetchInvoices()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your client invoices
          </p>
        </div>
        <Button onClick={handleAddInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats.total}</div>
            <p className="text-xs text-muted-foreground">
              ${invoiceStats.totalValue.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{invoiceStats.paid}</div>
            <p className="text-xs text-muted-foreground">
              ${invoiceStats.paidValue.toLocaleString()} collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{invoiceStats.outstanding}</div>
            <p className="text-xs text-muted-foreground">
              ${invoiceStats.outstandingValue.toLocaleString()} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              ${overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            Manage and track all your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="retainer">Retainer</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    Invoice #
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total')}
                  >
                    Amount
                  </TableHead>
                  <TableHead>Payment Progress</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('dueDate')}
                  >
                    Due Date
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                          ? 'No invoices match your filters' 
                          : 'No invoices found'}
                      </div>
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('')
                            setStatusFilter('all')
                            setTypeFilter('all')
                          }}
                          className="mt-2"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const isOverdueInvoice = invoice.dueDate && isOverdue(invoice.dueDate)
                    const paymentProgress = getPaymentProgress(invoice)
                    
                    return (
                      <TableRow 
                        key={invoice.id} 
                        className={
                          isOverdueInvoice ? 'bg-red-50' : ''
                        }
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(invoice.status)}
                            <div className="flex-1">
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">{invoice.title}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {invoice.client?.name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{invoice.client?.name || 'Unknown Client'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(invoice.type)}>
                            {invoice.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            ${invoice.total?.toLocaleString() || '0'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={paymentProgress} className="w-16" />
                            <span className="text-sm text-muted-foreground">{Math.round(paymentProgress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {invoice.dueDate 
                              ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                              : 'No due date'
                            }
                            {isOverdueInvoice && (
                              <div className="text-xs text-red-600">Overdue</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Invoice
                              </DropdownMenuItem>
                              {invoice.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Invoice
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Record Payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteInvoice(invoice)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Invoices you've created recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => {
                const paymentProgress = getPaymentProgress(invoice)
                
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(invoice.status)}
                      <div className="flex-1">
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.client?.name} • {invoice.status} • ${invoice.total?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(paymentProgress)}%</div>
                        <div className="text-xs text-muted-foreground">Paid</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Overdue Invoices
            </CardTitle>
            <CardDescription className="text-red-600">
              {overdueInvoices.length} invoice(s) are past their due date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'No due date'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
              {overdueInvoices.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All {overdueInvoices.length} Overdue Invoices
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
