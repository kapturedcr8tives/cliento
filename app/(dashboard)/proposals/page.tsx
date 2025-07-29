"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Copy
} from "lucide-react"
import { useProposalStore, proposalHelpers } from "@/stores/proposalStore"
import { useModal, useDeleteModal } from "@/stores/modalStore"
import { useNavigation } from "@/hooks/use-navigation"
import { cn } from "@/lib/utils"

export default function ProposalsPage() {
  const { proposals, isLoading, error, fetchProposals, deleteProposal } = useProposalStore()
  const { navigateTo } = useNavigation()
  const { openModal } = useModal()
  const { confirmDelete } = useDeleteModal()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handleDeleteProposal = (proposalId: string, proposalTitle: string) => {
    confirmDelete(proposalTitle, async () => {
      try {
        await deleteProposal(proposalId)
      } catch (error) {
        console.error("Failed to delete proposal:", error)
      }
    })
  }

  const handleViewProposal = (proposalId: string) => {
    navigateTo(`/dashboard/proposals/${proposalId}`)
  }

  const handleEditProposal = (proposalId: string) => {
    navigateTo(`/dashboard/proposals/${proposalId}/edit`)
  }

  const handleAddProposal = () => {
    navigateTo("/dashboard/proposals/new")
  }

  const handleSendProposal = (proposalId: string) => {
    // TODO: Implement send proposal functionality
    console.log("Sending proposal:", proposalId)
  }

  const handleDownloadProposal = (proposalId: string) => {
    // TODO: Implement download functionality
    console.log("Downloading proposal:", proposalId)
  }

  const handleDuplicateProposal = (proposalId: string) => {
    // TODO: Implement duplicate functionality
    console.log("Duplicating proposal:", proposalId)
  }

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter((proposal) => {
      const matchesSearch = searchQuery === "" || 
        proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
      const matchesType = typeFilter === "all" || proposal.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case "title":
          aValue = a.title
          bValue = b.title
          break
        case "client":
          aValue = a.client_name || ""
          bValue = b.client_name || ""
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "value":
          aValue = a.total_value || 0
          bValue = b.total_value || 0
          break
        case "created":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "sent":
          aValue = a.sent_at ? new Date(a.sent_at).getTime() : 0
          bValue = b.sent_at ? new Date(b.sent_at).getTime() : 0
          break
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const proposalStats = proposalHelpers.getProposalStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "viewed":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "service":
        return "bg-purple-100 text-purple-800"
      case "project":
        return "bg-indigo-100 text-indigo-800"
      case "retainer":
        return "bg-teal-100 text-teal-800"
      case "consultation":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4 text-gray-600" />
      case "sent":
        return <Send className="h-4 w-4 text-blue-600" />
      case "viewed":
        return <Eye className="h-4 w-4 text-yellow-600" />
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-red-600">Error loading proposals: {error}</p>
            <Button onClick={() => fetchProposals()} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600">
            Create, manage, and track your client proposals
          </p>
        </div>
        <Button onClick={handleAddProposal} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Proposal</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{proposalStats.newProposalsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.sent}</div>
            <p className="text-xs text-muted-foreground">
              {((proposalStats.sent / proposalStats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-600"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.accepted}</div>
            <p className="text-xs text-muted-foreground">
              {proposalStats.acceptanceRate.toFixed(1)}% acceptance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${proposalStats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${proposalStats.averageValue.toFixed(0)} avg per proposal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search proposals by title, description, or client..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
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
        </CardContent>
      </Card>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Proposals</CardTitle>
          <CardDescription>
            {filteredProposals.length} of {proposals.length} proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Proposal</span>
                      {sortBy === "title" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("client")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      {sortBy === "client" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortBy === "status" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortBy === "type" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("value")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Value</span>
                      {sortBy === "value" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("sent")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Sent</span>
                      {sortBy === "sent" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("created")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {sortBy === "created" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => {
                  const isExpiredProposal = isExpired(proposal.expiry_date)
                  
                  return (
                    <TableRow key={proposal.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(proposal.status)}
                          </div>
                          <div>
                            <div className="font-medium">{proposal.title}</div>
                            {proposal.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {proposal.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {proposal.client_name && (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {proposal.client_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{proposal.client_name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(proposal.type)}>
                          {proposal.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            ${(proposal.total_value || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {proposal.sent_at ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {new Date(proposal.sent_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(proposal.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProposal(proposal.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {proposal.status === "draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProposal(proposal.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendProposal(proposal.id)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadProposal(proposal.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateProposal(proposal.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProposal(proposal.id, proposal.title)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredProposals.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No proposals found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first proposal"
                }
              </p>
              {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                <Button onClick={handleAddProposal}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
