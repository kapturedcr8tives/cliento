'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Send, FileText, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react'
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

import { useProposalStore } from '@/stores/proposalStore'
import { useModal } from '@/stores/modalStore'
import { useAuthStore } from '@/stores/authStore'
import { Proposal, ProposalStatus } from '@/types'

export default function ProposalsPage() {
  const router = useRouter()
  const { user, organization } = useAuthStore()
  const { 
    proposals, 
    isLoading, 
    error, 
    fetchProposals, 
    deleteProposal,
    sendProposal,
    proposalHelpers 
  } = useProposalStore()
  const { openModal } = useModal()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (user && organization) {
      fetchProposals()
    }
  }, [user, organization, fetchProposals])

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

  const handleViewProposal = (proposal: Proposal) => {
    router.push(`/proposals/${proposal.id}`)
  }

  const handleEditProposal = (proposal: Proposal) => {
    openModal({
      id: 'edit-proposal',
      type: 'form',
      title: 'Edit Proposal',
      size: 'lg',
      data: proposal,
      config: {
        fields: [
          { name: 'title', label: 'Proposal Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'clientId', label: 'Client', type: 'select', required: true },
          { name: 'projectId', label: 'Related Project', type: 'select', required: false },
          { name: 'type', label: 'Proposal Type', type: 'select', required: true },
          { name: 'value', label: 'Proposal Value', type: 'number', required: true },
          { name: 'validUntil', label: 'Valid Until', type: 'date', required: true },
          { name: 'terms', label: 'Terms & Conditions', type: 'textarea', required: false },
          { name: 'tags', label: 'Tags', type: 'tags', required: false }
        ]
      }
    })
  }

  const handleDeleteProposal = (proposal: Proposal) => {
    openModal({
      id: 'delete-proposal',
      type: 'delete',
      title: 'Delete Proposal',
      message: `Are you sure you want to delete "${proposal.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteProposal(proposal.id)
          fetchProposals()
        } catch (error) {
          console.error('Failed to delete proposal:', error)
        }
      }
    })
  }

  const handleSendProposal = (proposal: Proposal) => {
    openModal({
      id: 'send-proposal',
      type: 'confirm',
      title: 'Send Proposal',
      message: `Send "${proposal.title}" to ${proposal.client?.name || 'the client'}?`,
      onConfirm: async () => {
        try {
          await sendProposal(proposal.id)
          fetchProposals()
        } catch (error) {
          console.error('Failed to send proposal:', error)
        }
      }
    })
  }

  const handleAddProposal = () => {
    openModal({
      id: 'add-proposal',
      type: 'form',
      title: 'Create New Proposal',
      size: 'lg',
      config: {
        fields: [
          { name: 'title', label: 'Proposal Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'clientId', label: 'Client', type: 'select', required: true },
          { name: 'projectId', label: 'Related Project', type: 'select', required: false },
          { name: 'type', label: 'Proposal Type', type: 'select', required: true },
          { name: 'value', label: 'Proposal Value', type: 'number', required: true },
          { name: 'validUntil', label: 'Valid Until', type: 'date', required: true },
          { name: 'terms', label: 'Terms & Conditions', type: 'textarea', required: false },
          { name: 'tags', label: 'Tags', type: 'tags', required: false }
        ]
      }
    })
  }

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proposal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proposal.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter
      const matchesType = typeFilter === 'all' || proposal.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'value':
          aValue = a.value || 0
          bValue = b.value || 0
          break
        case 'validUntil':
          aValue = a.validUntil ? new Date(a.validUntil).getTime() : 0
          bValue = b.validUntil ? new Date(b.validUntil).getTime() : 0
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

  // Get proposal statistics
  const proposalStats = proposalHelpers.getProposalStats(proposals)
  const recentProposals = proposalHelpers.getRecentProposals(proposals, 5)
  const expiringProposals = proposalHelpers.getExpiringProposals(proposals, 7)

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'viewed': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4 text-gray-500" />
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />
      case 'viewed': return <Eye className="h-4 w-4 text-yellow-500" />
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      case 'expired': return <Clock className="h-4 w-4 text-gray-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-purple-100 text-purple-800'
      case 'project': return 'bg-blue-100 text-blue-800'
      case 'retainer': return 'bg-green-100 text-green-800'
      case 'consultation': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (validUntil: string) => {
    const validDate = new Date(validUntil)
    const now = new Date()
    const diffDays = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load proposals</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => fetchProposals()} className="mt-4">
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
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your client proposals
          </p>
        </div>
        <Button onClick={handleAddProposal}>
          <Plus className="h-4 w-4 mr-2" />
          Create Proposal
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {proposalStats.draft} drafts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Proposals</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.sent}</div>
            <p className="text-xs text-muted-foreground">
              {proposalStats.viewed} viewed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{proposalStats.accepted}</div>
            <p className="text-xs text-muted-foreground">
              {proposalStats.acceptanceRate}% acceptance rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${proposalStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${proposalStats.averageValue.toLocaleString()} avg per proposal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal List</CardTitle>
          <CardDescription>
            Manage and track all your proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search proposals..."
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
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
              </SelectContent>
            </Select>
          </div>

          {/* Proposals Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('title')}
                  >
                    Proposal Title
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
                    onClick={() => handleSort('value')}
                  >
                    Value
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('validUntil')}
                  >
                    Valid Until
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
                {filteredProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                          ? 'No proposals match your filters' 
                          : 'No proposals found'}
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
                  filteredProposals.map((proposal) => {
                    const isExpiring = isExpiringSoon(proposal.validUntil)
                    const isExpiredProposal = isExpired(proposal.validUntil)
                    
                    return (
                      <TableRow 
                        key={proposal.id} 
                        className={
                          isExpiredProposal ? 'bg-red-50' : 
                          isExpiring ? 'bg-yellow-50' : ''
                        }
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(proposal.status)}
                            <div className="flex-1">
                              <div className="font-medium">{proposal.title}</div>
                              {proposal.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {proposal.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {proposal.client?.name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{proposal.client?.name || 'Unknown Client'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(proposal.type)}>
                            {proposal.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            ${proposal.value?.toLocaleString() || '0'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {proposal.validUntil 
                              ? format(new Date(proposal.validUntil), 'MMM dd, yyyy')
                              : 'No expiry'
                            }
                            {isExpiring && !isExpiredProposal && (
                              <div className="text-xs text-yellow-600">Expiring soon</div>
                            )}
                            {isExpiredProposal && (
                              <div className="text-xs text-red-600">Expired</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(proposal.createdAt), 'MMM dd, yyyy')}
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
                              <DropdownMenuItem onClick={() => handleViewProposal(proposal)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {proposal.status === 'draft' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditProposal(proposal)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Proposal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendProposal(proposal)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Proposal
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteProposal(proposal)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Proposal
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
            Showing {filteredProposals.length} of {proposals.length} proposals
          </div>
        </CardContent>
      </Card>

      {/* Recent Proposals */}
      {recentProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Proposals</CardTitle>
            <CardDescription>
              Proposals you've created recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(proposal.status)}
                    <div className="flex-1">
                      <div className="font-medium">{proposal.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {proposal.client?.name} • {proposal.status} • ${proposal.value?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewProposal(proposal)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Proposals Alert */}
      {expiringProposals.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Expiring Proposals
            </CardTitle>
            <CardDescription className="text-yellow-600">
              {expiringProposals.length} proposal(s) will expire soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringProposals.slice(0, 3).map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">{proposal.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Expires: {proposal.validUntil ? format(new Date(proposal.validUntil), 'MMM dd, yyyy') : 'No expiry'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewProposal(proposal)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
              {expiringProposals.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All {expiringProposals.length} Expiring Proposals
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
