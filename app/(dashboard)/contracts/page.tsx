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
  Copy,
  Shield,
  FileSignature
} from "lucide-react"
import { useContractStore, contractHelpers } from "@/stores/contractStore"
import { useModal, useDeleteModal } from "@/stores/modalStore"
import { useNavigation } from "@/hooks/use-navigation"
import { cn } from "@/lib/utils"

export default function ContractsPage() {
  const { contracts, isLoading, error, fetchContracts, deleteContract } = useContractStore()
  const { navigateTo } = useNavigation()
  const { openModal } = useModal()
  const { confirmDelete } = useDeleteModal()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

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

  const handleDeleteContract = (contractId: string, contractTitle: string) => {
    confirmDelete(contractTitle, async () => {
      try {
        await deleteContract(contractId)
      } catch (error) {
        console.error("Failed to delete contract:", error)
      }
    })
  }

  const handleViewContract = (contractId: string) => {
    navigateTo(`/dashboard/contracts/${contractId}`)
  }

  const handleEditContract = (contractId: string) => {
    navigateTo(`/dashboard/contracts/${contractId}/edit`)
  }

  const handleAddContract = () => {
    navigateTo("/dashboard/contracts/new")
  }

  const handleSendContract = (contractId: string) => {
    // TODO: Implement send contract functionality
    console.log("Sending contract:", contractId)
  }

  const handleDownloadContract = (contractId: string) => {
    // TODO: Implement download functionality
    console.log("Downloading contract:", contractId)
  }

  const handleDuplicateContract = (contractId: string) => {
    // TODO: Implement duplicate functionality
    console.log("Duplicating contract:", contractId)
  }

  // Filter and sort contracts
  const filteredContracts = contracts
    .filter((contract) => {
      const matchesSearch = searchQuery === "" || 
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter
      const matchesType = typeFilter === "all" || contract.type === typeFilter
      
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
        case "start_date":
          aValue = a.start_date ? new Date(a.start_date).getTime() : 0
          bValue = b.start_date ? new Date(b.start_date).getTime() : 0
          break
        case "end_date":
          aValue = a.end_date ? new Date(a.end_date).getTime() : 0
          bValue = b.end_date ? new Date(b.end_date).getTime() : 0
          break
        case "created":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
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

  const contractStats = contractHelpers.getContractStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "terminated":
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
      case "nda":
        return "bg-indigo-100 text-indigo-800"
      case "msa":
        return "bg-teal-100 text-teal-800"
      case "sow":
        return "bg-pink-100 text-pink-800"
      case "maintenance":
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4 text-gray-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "terminated":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false
    const end = new Date(endDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-red-600">Error loading contracts: {error}</p>
            <Button onClick={() => fetchContracts()} className="mt-2">
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
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600">
            Manage your legal agreements and service contracts
          </p>
        </div>
        <Button onClick={handleAddContract} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Contract</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{contractStats.newContractsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-600"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((contractStats.active / contractStats.total) * 100).toFixed(1)}% of total
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
            <div className="text-2xl font-bold">{contractStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting signature
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
              ${contractStats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${contractStats.averageValue.toFixed(0)} avg per contract
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <div className="h-4 w-4 rounded-full bg-orange-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-orange-600"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractStats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
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
                  placeholder="Search contracts by title, description, or client..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
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
                <SelectItem value="nda">NDA</SelectItem>
                <SelectItem value="msa">MSA</SelectItem>
                <SelectItem value="sow">SOW</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>
            {filteredContracts.length} of {contracts.length} contracts
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
                      <span>Contract</span>
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
                    onClick={() => handleSort("start_date")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Start Date</span>
                      {sortBy === "start_date" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("end_date")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>End Date</span>
                      {sortBy === "end_date" && (
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
                {filteredContracts.map((contract) => {
                  const isExpiredContract = isExpired(contract.end_date)
                  const isExpiringSoonContract = isExpiringSoon(contract.end_date)
                  
                  return (
                    <TableRow key={contract.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(contract.status)}
                          </div>
                          <div>
                            <div className="font-medium">{contract.title}</div>
                            {contract.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {contract.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.client_name && (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {contract.client_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{contract.client_name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(contract.type)}>
                          {contract.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            ${(contract.total_value || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.start_date ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {new Date(contract.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contract.end_date ? (
                          <div className={cn(
                            "flex items-center space-x-1",
                            (isExpiredContract || isExpiringSoonContract) && "text-red-600"
                          )}>
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {new Date(contract.end_date).toLocaleDateString()}
                            </span>
                            {isExpiredContract && (
                              <span className="text-xs text-red-600">Expired</span>
                            )}
                            {isExpiringSoonContract && (
                              <span className="text-xs text-orange-600">Expiring</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No end date</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewContract(contract.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {contract.status === "draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditContract(contract.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendContract(contract.id)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadContract(contract.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateContract(contract.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContract(contract.id, contract.title)}
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
          
          {filteredContracts.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No contracts found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first contract"
                }
              </p>
              {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                <Button onClick={handleAddContract}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Contract
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}