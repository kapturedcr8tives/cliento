"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, FileText, Send, Plus, Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { aiService } from "@/lib/ai-service"
import type { Client, Proposal, ProposalStatus } from "@/lib/types"

interface ProposalSection {
  id: string
  name: string
  content: string
  order: number
}

interface PricingItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface ProposalBuilderProps {
  proposalId?: string
  clientId?: string
  onSave?: (proposal: Proposal) => void
  onCancel?: () => void
}

export function ProposalBuilder({ proposalId, clientId, onSave, onCancel }: ProposalBuilderProps) {
  const [proposal, setProposal] = useState<Partial<Proposal>>({
    title: "",
    content: "",
    total_amount: 0,
    status: "draft",
    valid_until: "",
    client_id: clientId,
  })
  const [sections, setSections] = useState<ProposalSection[]>([])
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { userData } = useAuth()

  useEffect(() => {
    if (userData?.workspace_id) {
      fetchClients()
      if (proposalId) {
        fetchProposal()
      } else {
        initializeDefaultSections()
      }
    }
  }, [userData, proposalId])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", userData?.workspace_id)
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchProposal = async () => {
    if (!proposalId) return

    try {
      const { data, error } = await supabase.from("proposals").select("*").eq("id", proposalId).single()

      if (error) throw error
      setProposal(data)

      // Parse sections from content if available
      if (data.content) {
        try {
          const parsedContent = JSON.parse(data.content)
          if (parsedContent.sections) {
            setSections(parsedContent.sections)
          }
          if (parsedContent.pricing) {
            setPricingItems(parsedContent.pricing)
          }
        } catch {
          // If content is not JSON, create a single section
          setSections([
            {
              id: "1",
              name: "Content",
              content: data.content,
              order: 1,
            },
          ])
        }
      }
    } catch (error) {
      console.error("Error fetching proposal:", error)
    }
  }

  const initializeDefaultSections = () => {
    setSections([
      {
        id: "1",
        name: "Executive Summary",
        content: "",
        order: 1,
      },
      {
        id: "2",
        name: "Project Overview",
        content: "",
        order: 2,
      },
      {
        id: "3",
        name: "Scope of Work",
        content: "",
        order: 3,
      },
      {
        id: "4",
        name: "Timeline",
        content: "",
        order: 4,
      },
    ])

    setPricingItems([
      {
        id: "1",
        description: "Professional Services",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ])
  }

  const generateWithAI = async () => {
    if (!proposal.client_id) {
      setErrors({ client: "Please select a client first" })
      return
    }

    setAiGenerating(true)
    setErrors({})

    try {
      const client = clients.find((c) => c.id === proposal.client_id)
      if (!client) throw new Error("Client not found")

      const suggestions = await aiService.generateProposalSuggestions({
        client_name: client.name,
        project_type: proposal.title || "Professional Services",
        budget_range: proposal.total_amount || undefined,
        requirements: proposal.content || undefined,
      })

      // Update proposal with AI suggestions
      setProposal((prev) => ({
        ...prev,
        title: suggestions.title,
        total_amount: suggestions.pricing.suggested_amount,
      }))

      // Update sections
      setSections(
        suggestions.sections.map((section, index) => ({
          id: (index + 1).toString(),
          name: section.name,
          content: section.content,
          order: index + 1,
        })),
      )

      // Update pricing
      setPricingItems(
        suggestions.pricing.breakdown.map((item, index) => ({
          id: (index + 1).toString(),
          description: item.item,
          quantity: 1,
          rate: item.amount,
          amount: item.amount,
        })),
      )
    } catch (error) {
      console.error("Error generating AI content:", error)
      setErrors({ ai: "Failed to generate content. Please try again." })
    } finally {
      setAiGenerating(false)
    }
  }

  const addSection = () => {
    const newSection: ProposalSection = {
      id: Date.now().toString(),
      name: "New Section",
      content: "",
      order: sections.length + 1,
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, field: keyof ProposalSection, value: string | number) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, [field]: value } : section)))
  }

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id))
  }

  const addPricingItem = () => {
    const newItem: PricingItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
    setPricingItems([...pricingItems, newItem])
  }

  const updatePricingItem = (id: string, field: keyof PricingItem, value: string | number) => {
    setPricingItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "rate") {
            updated.amount = Number(updated.quantity) * Number(updated.rate)
          }
          return updated
        }
        return item
      }),
    )
  }

  const removePricingItem = (id: string) => {
    setPricingItems((prev) => prev.filter((item) => item.id !== id))
  }

  const calculateTotal = () => {
    return pricingItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const validateProposal = () => {
    const newErrors: Record<string, string> = {}

    if (!proposal.title?.trim()) {
      newErrors.title = "Title is required"
    }

    if (!proposal.client_id) {
      newErrors.client = "Client is required"
    }

    if (sections.length === 0) {
      newErrors.sections = "At least one section is required"
    }

    if (pricingItems.length === 0) {
      newErrors.pricing = "At least one pricing item is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveProposal = async (status: ProposalStatus = "draft") => {
    if (!validateProposal()) return

    setLoading(true)

    try {
      const total = calculateTotal()
      const content = JSON.stringify({
        sections,
        pricing: pricingItems,
      })

      const proposalData = {
        ...proposal,
        content,
        total_amount: total,
        status,
        workspace_id: userData?.workspace_id,
        created_by: userData?.id,
      }

      let savedProposal
      if (proposalId) {
        const { data, error } = await supabase
          .from("proposals")
          .update(proposalData)
          .eq("id", proposalId)
          .select()
          .single()

        if (error) throw error
        savedProposal = data
      } else {
        const { data, error } = await supabase.from("proposals").insert(proposalData).select().single()

        if (error) throw error
        savedProposal = data
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: userData?.workspace_id,
        user_id: userData?.id,
        entity_type: "proposal",
        entity_id: savedProposal.id,
        action: proposalId ? "updated" : "created",
        details: { status },
      })

      onSave?.(savedProposal)
    } catch (error) {
      console.error("Error saving proposal:", error)
      setErrors({ save: "Failed to save proposal. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{proposalId ? "Edit Proposal" : "Create Proposal"}</h2>
          <p className="text-muted-foreground">Build professional proposals with AI assistance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={generateWithAI} disabled={aiGenerating}>
            {aiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI Generate
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => saveProposal("draft")} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => saveProposal("sent")} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            Send Proposal
          </Button>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Please fix the following errors:
            <ul className="list-disc list-inside mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
              <CardDescription>Basic information about your proposal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input
                    id="title"
                    value={proposal.title || ""}
                    onChange={(e) => setProposal((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter proposal title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={proposal.client_id || ""}
                    onValueChange={(value) => setProposal((prev) => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger className={errors.client ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={proposal.valid_until || ""}
                    onChange={(e) => setProposal((prev) => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge variant="outline">{proposal.status || "draft"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Proposal Sections</h3>
            <Button onClick={addSection} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, "name", e.target.value)}
                      className="font-semibold border-none p-0 h-auto text-lg"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, "content", e.target.value)}
                    placeholder="Enter section content..."
                    rows={6}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pricing Breakdown</h3>
            <Button onClick={addPricingItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Qty</th>
                      <th className="text-left p-4">Rate</th>
                      <th className="text-left p-4">Amount</th>
                      <th className="w-12 p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">
                          <Input
                            value={item.description}
                            onChange={(e) => updatePricingItem(item.id, "description", e.target.value)}
                            placeholder="Item description"
                          />
                        </td>
                        <td className="p-4">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePricingItem(item.id, "quantity", Number(e.target.value))}
                            className="w-20"
                          />
                        </td>
                        <td className="p-4">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updatePricingItem(item.id, "rate", Number(e.target.value))}
                            className="w-32"
                          />
                        </td>
                        <td className="p-4">
                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="icon" onClick={() => removePricingItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2">
                      <td colSpan={3} className="p-4 text-right font-semibold">
                        Total:
                      </td>
                      <td className="p-4 font-bold text-lg">${calculateTotal().toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{proposal.title || "Untitled Proposal"}</CardTitle>
              <CardDescription>
                {clients.find((c) => c.id === proposal.client_id)?.name || "No client selected"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-lg font-semibold mb-2">{section.name}</h3>
                  <div className="text-muted-foreground whitespace-pre-wrap">{section.content || "No content"}</div>
                </div>
              ))}

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Investment</h3>
                <div className="space-y-2">
                  {pricingItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.description}</span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
