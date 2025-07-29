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
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Building,
  MapPin,
  Star
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { salesPipelineService } from "@/lib/sales-pipeline"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface Lead {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  value?: number
  probability: number
  lead_score: number
  source?: string
  expected_close_date?: string
  assigned_to?: string
  company_id: string
  contact_id?: string
  companies?: {
    name: string
    industry: string
    size: string
  }
  contacts?: {
    first_name: string
    last_name: string
    email: string
  }
  users?: {
    first_name: string
    last_name: string
  }
  pipeline_stages?: {
    name: string
    color: string
    probability: number
  }
  created_at: string
  updated_at: string
}

interface PipelineStage {
  id: string
  name: string
  color: string
  probability: number
  leads: Lead[]
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSource, setSelectedSource] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      
      const [leadsData, stagesData] = await Promise.all([
        salesPipelineService.getLeads(),
        salesPipelineService.getPipelineStages()
      ])

      setLeads(leadsData)

      // Organize leads by pipeline stage
      const stagesWithLeads = stagesData.map(stage => ({
        ...stage,
        leads: leadsData.filter(lead => lead.pipeline_stage_id === stage.id)
      }))

      setPipelineStages(stagesWithLeads)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    const sourceStageId = source.droppableId
    const destinationStageId = destination.droppableId

    if (sourceStageId === destinationStageId) {
      // Reorder within same stage
      const stage = pipelineStages.find(s => s.id === sourceStageId)
      if (!stage) return

      const newLeads = Array.from(stage.leads)
      const [removed] = newLeads.splice(source.index, 1)
      newLeads.splice(destination.index, 0, removed)

      const newStages = pipelineStages.map(s => 
        s.id === sourceStageId ? { ...s, leads: newLeads } : s
      )
      setPipelineStages(newStages)
    } else {
      // Move to different stage
      const sourceStage = pipelineStages.find(s => s.id === sourceStageId)
      const destStage = pipelineStages.find(s => s.id === destinationStageId)
      
      if (!sourceStage || !destStage) return

      const sourceLeads = Array.from(sourceStage.leads)
      const destLeads = Array.from(destStage.leads)
      const [movedLead] = sourceLeads.splice(source.index, 1)
      destLeads.splice(destination.index, 0, movedLead)

      const newStages = pipelineStages.map(s => {
        if (s.id === sourceStageId) return { ...s, leads: sourceLeads }
        if (s.id === destinationStageId) return { ...s, leads: destLeads }
        return s
      })
      setPipelineStages(newStages)

      // Update lead in database
      try {
        await salesPipelineService.updateLead(draggableId, {
          pipeline_stage_id: destinationStageId,
          status: destStage.name.toLowerCase().replace(' ', '_')
        })
      } catch (error) {
        console.error('Error updating lead:', error)
        // Revert changes if update fails
        loadLeads()
      }
    }
  }

  const createLead = async (formData: FormData) => {
    try {
      const leadData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        company_id: formData.get('company_id') as string,
        contact_id: formData.get('contact_id') as string,
        source: formData.get('source') as string,
        value: parseFloat(formData.get('value') as string) || undefined,
        priority: formData.get('priority') as string,
        expected_close_date: formData.get('expected_close_date') as string,
        assigned_to: formData.get('assigned_to') as string
      }

      await salesPipelineService.createLead(leadData)
      setShowCreateDialog(false)
      loadLeads()
    } catch (error) {
      console.error('Error creating lead:', error)
    }
  }

  const updateLead = async (formData: FormData) => {
    if (!selectedLead) return

    try {
      const updates = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        source: formData.get('source') as string,
        value: parseFloat(formData.get('value') as string) || undefined,
        priority: formData.get('priority') as string,
        expected_close_date: formData.get('expected_close_date') as string,
        assigned_to: formData.get('assigned_to') as string
      }

      await salesPipelineService.updateLead(selectedLead.id, updates)
      setShowEditDialog(false)
      setSelectedLead(null)
      loadLeads()
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }

  const deleteLead = async (leadId: string) => {
    try {
      await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      loadLeads()
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track lead progress
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your sales pipeline
              </DialogDescription>
            </DialogHeader>
            <form action={createLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select name="source" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input id="value" name="value" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input id="expected_close_date" name="expected_close_date" type="date" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Lead</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="email">Email Campaign</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline View */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pipelineStages.map((stage) => (
                <Card key={stage.id} className="h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{stage.name}</CardTitle>
                      <Badge variant="secondary">{stage.leads.length}</Badge>
                    </div>
                    <CardDescription>
                      {stage.probability}% probability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Droppable droppableId={stage.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2 min-h-[200px]"
                        >
                          {stage.leads
                            .filter(lead => 
                              lead.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                              (!selectedSource || lead.source === selectedSource) &&
                              (!selectedPriority || lead.priority === selectedPriority)
                            )
                            .map((lead, index) => (
                              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="text-sm font-medium line-clamp-2">
                                        {lead.title}
                                      </h4>
                                      <div className="flex items-center space-x-1">
                                        <Badge className={getPriorityColor(lead.priority)}>
                                          {lead.priority}
                                        </Badge>
                                        <div className="flex items-center space-x-1 text-xs">
                                          <Star className={`h-3 w-3 ${getScoreColor(lead.lead_score)}`} />
                                          <span className={getScoreColor(lead.lead_score)}>
                                            {lead.lead_score}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {lead.companies && (
                                      <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                                        <Building className="h-3 w-3" />
                                        <span>{lead.companies.name}</span>
                                      </div>
                                    )}
                                    
                                    {lead.value && (
                                      <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                                        <DollarSign className="h-3 w-3" />
                                        <span>{formatCurrency(lead.value)}</span>
                                      </div>
                                    )}
                                    
                                    {lead.expected_close_date && (
                                      <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-2">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(lead.expected_close_date).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                      {lead.users && (
                                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                          <Users className="h-3 w-3" />
                                          <span>{lead.users.first_name} {lead.users.last_name}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedLead(lead)
                                            setShowEditDialog(true)
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteLead(lead.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Leads</CardTitle>
              <CardDescription>
                Complete list of all leads in your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads
                  .filter(lead => 
                    lead.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (!selectedSource || lead.source === selectedSource) &&
                    (!selectedPriority || lead.priority === selectedPriority)
                  )
                  .map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{lead.title}</h4>
                          {lead.companies && (
                            <p className="text-sm text-muted-foreground">{lead.companies.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {lead.value && (
                            <p className="text-sm font-medium">{formatCurrency(lead.value)}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {lead.probability}% probability
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className={`h-3 w-3 ${getScoreColor(lead.lead_score)}`} />
                            <span className={`text-xs ${getScoreColor(lead.lead_score)}`}>
                              {lead.lead_score}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLead(lead.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form action={updateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input 
                    id="edit-title" 
                    name="title" 
                    defaultValue={selectedLead.title}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-source">Source</Label>
                  <Select name="source" defaultValue={selectedLead.source} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={selectedLead.description}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-value">Value</Label>
                  <Input 
                    id="edit-value" 
                    name="value" 
                    type="number" 
                    defaultValue={selectedLead.value?.toString()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select name="priority" defaultValue={selectedLead.priority} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expected_close_date">Expected Close Date</Label>
                <Input 
                  id="edit-expected_close_date" 
                  name="expected_close_date" 
                  type="date" 
                  defaultValue={selectedLead.expected_close_date}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Lead</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
