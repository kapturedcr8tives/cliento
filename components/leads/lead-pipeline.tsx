"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, DollarSign, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { Lead, LeadStatus } from "@/lib/types"
import { aiService } from "@/lib/ai-service"

const LEAD_STAGES: { id: LeadStatus; title: string; color: string }[] = [
  { id: "new", title: "New Leads", color: "bg-blue-100 text-blue-800" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { id: "qualified", title: "Qualified", color: "bg-purple-100 text-purple-800" },
  { id: "proposal", title: "Proposal Sent", color: "bg-orange-100 text-orange-800" },
  { id: "won", title: "Won", color: "bg-green-100 text-green-800" },
  { id: "lost", title: "Lost", color: "bg-red-100 text-red-800" },
]

interface LeadPipelineProps {
  onLeadClick?: (lead: Lead) => void
  onNewLead?: () => void
}

export function LeadPipeline({ onLeadClick, onNewLead }: LeadPipelineProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [aiProcessing, setAiProcessing] = useState<string[]>([])
  const { userData } = useAuth()

  useEffect(() => {
    if (userData?.workspace_id) {
      fetchLeads()
    }
  }, [userData])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("workspace_id", userData?.workspace_id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId as LeadStatus

    try {
      const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", draggableId)

      if (error) throw error

      // Update local state
      setLeads((prev) => prev.map((lead) => (lead.id === draggableId ? { ...lead, status: newStatus } : lead)))

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: userData?.workspace_id,
        user_id: userData?.id,
        entity_type: "lead",
        entity_id: draggableId,
        action: "status_changed",
        details: { new_status: newStatus },
      })
    } catch (error) {
      console.error("Error updating lead status:", error)
    }
  }

  const enhanceLeadWithAI = async (leadId: string) => {
    setAiProcessing((prev) => [...prev, leadId])

    try {
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return

      const insights = await aiService.scoreLeadWithAI({
        name: lead.name,
        email: lead.email,
        company: lead.company,
        source: lead.source,
        expected_value: lead.expected_value,
        notes: lead.notes,
      })

      // Update lead with AI insights
      const { error } = await supabase
        .from("leads")
        .update({
          ai_score: insights.score,
          ai_insights: insights,
        })
        .eq("id", leadId)

      if (error) throw error

      // Update local state
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, ai_score: insights.score, ai_insights: insights } : l)),
      )
    } catch (error) {
      console.error("Error enhancing lead with AI:", error)
    } finally {
      setAiProcessing((prev) => prev.filter((id) => id !== leadId))
    }
  }

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getPriorityColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 80) return "bg-red-100 text-red-800"
    if (score >= 65) return "bg-orange-100 text-orange-800"
    if (score >= 40) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {LEAD_STAGES.map((stage) => (
          <Card key={stage.id}>
            <CardHeader>
              <CardTitle className="text-sm">{stage.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {LEAD_STAGES.map((stage) => (
          <Card key={stage.id} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{stage.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {getLeadsByStatus(stage.id).length}
                </Badge>
              </div>
              {stage.id === "new" && (
                <Button size="sm" onClick={onNewLead} className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Lead
                </Button>
              )}
            </CardHeader>
            <Droppable droppableId={stage.id}>
              {(provided, snapshot) => (
                <CardContent
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[200px] ${snapshot.isDraggingOver ? "bg-blue-50" : ""}`}
                >
                  {getLeadsByStatus(stage.id).map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? "rotate-2 shadow-lg" : ""
                          }`}
                          onClick={() => onLeadClick?.(lead)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{getInitials(lead.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium truncate">{lead.name}</p>
                                {lead.company && (
                                  <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => enhanceLeadWithAI(lead.id)}>
                                  <Sparkles className="mr-2 h-3 w-3" />
                                  AI Enhance
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2">
                            {lead.expected_value && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3 mr-1" />${lead.expected_value.toLocaleString()}
                              </div>
                            )}

                            {lead.ai_score && (
                              <div className="flex items-center justify-between">
                                <Badge className={`text-xs ${getPriorityColor(lead.ai_score)}`}>
                                  Score: {lead.ai_score}
                                </Badge>
                                {aiProcessing.includes(lead.id) && (
                                  <Sparkles className="h-3 w-3 animate-pulse text-blue-500" />
                                )}
                              </div>
                            )}

                            {lead.source && (
                              <Badge variant="outline" className="text-xs">
                                {lead.source}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              )}
            </Droppable>
          </Card>
        ))}
      </div>
    </DragDropContext>
  )
}
