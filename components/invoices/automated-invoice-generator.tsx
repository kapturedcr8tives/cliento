"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Plus, Trash2, Mail, Phone, Settings, Loader2, FileText, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { advancedAIService, type InvoiceAutomation } from "@/lib/advanced-ai-service"
import type { Project, Client } from "@/lib/types"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface AutomatedInvoiceGeneratorProps {
  projectId?: string
  clientId?: string
  onInvoiceGenerated?: (invoiceId: string) => void
}

export function AutomatedInvoiceGenerator({ projectId, clientId, onInvoiceGenerated }: AutomatedInvoiceGeneratorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "")
  const [selectedClient, setSelectedClient] = useState<string>(clientId || "")
  const [workPeriod, setWorkPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
    end: new Date().toISOString().split("T")[0], // today
  })
  const [includeExpenses, setIncludeExpenses] = useState(false)
  const [automation, setAutomation] = useState<InvoiceAutomation | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [invoiceDetails, setInvoiceDetails] = useState({
    title: "",
    notes: "",
    due_days: 30,
    tax_rate: 0,
    discount_amount: 0,
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userData } = useAuth()

  useEffect(() => {
    if (userData?.workspace_id) {
      fetchProjects()
      fetchClients()
    }
  }, [userData])

  useEffect(() => {
    if (selectedProject && selectedClient) {
      generateAutomation()
    }
  }, [selectedProject, selectedClient, workPeriod, includeExpenses])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("workspace_id", userData?.workspace_id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

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

  const generateAutomation = async () => {
    if (!selectedProject || !selectedClient) return

    setGenerating(true)
    setError(null)

    try {
      const result = await advancedAIService.generateInvoiceAutomation({
        project_id: selectedProject,
        client_id: selectedClient,
        work_period: workPeriod,
        include_expenses: includeExpenses,
      })

      setAutomation(result)
      setInvoiceItems(
        result.suggested_items.map((item, index) => ({
          id: (index + 1).toString(),
          ...item,
        })),
      )

      // Update invoice details with AI suggestions
      const project = projects.find((p) => p.id === selectedProject)
      setInvoiceDetails((prev) => ({
        ...prev,
        title: `Invoice for ${project?.name || "Project"}`,
        due_days: result.payment_terms.due_days,
      }))
    } catch (err) {
      setError("Failed to generate invoice automation. Please try again.")
      console.error("Invoice automation error:", err)
    } finally {
      setGenerating(false)
    }
  }

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
    setInvoiceItems([...invoiceItems, newItem])
  }

  const updateInvoiceItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems((prev) =>
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

  const removeInvoiceItem = (id: string) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== id))
  }

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTax = () => {
    return (calculateSubtotal() * invoiceDetails.tax_rate) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - invoiceDetails.discount_amount
  }

  const generateInvoice = async () => {
    setLoading(true)
    setError(null)

    try {
      // Generate invoice number
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", userData?.workspace_id)

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, "0")}`

      // Create invoice
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const total = calculateTotal()

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          workspace_id: userData?.workspace_id,
          client_id: selectedClient,
          project_id: selectedProject,
          invoice_number: invoiceNumber,
          title: invoiceDetails.title,
          subtotal,
          tax_rate: invoiceDetails.tax_rate,
          tax_amount: taxAmount,
          discount_amount: invoiceDetails.discount_amount,
          total_amount: total,
          status: "draft",
          due_date: new Date(Date.now() + invoiceDetails.due_days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          created_by: userData?.id,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const itemsToInsert = invoiceItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }))

      const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Track analytics event
      await advancedAIService.trackEvent({
        type: "invoice_generated",
        entity_type: "invoice",
        entity_id: invoice.id,
        properties: {
          total_amount: total,
          automation_used: true,
          project_id: selectedProject,
        },
      })

      onInvoiceGenerated?.(invoice.id)
    } catch (err) {
      setError("Failed to generate invoice. Please try again.")
      console.error("Invoice generation error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automated Invoice Generator
              </CardTitle>
              <CardDescription>AI-powered invoice generation with smart suggestions</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="setup" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - {project.client?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
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
                  <Label>Work Period Start</Label>
                  <Input
                    type="date"
                    value={workPeriod.start}
                    onChange={(e) => setWorkPeriod((prev) => ({ ...prev, start: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Work Period End</Label>
                  <Input
                    type="date"
                    value={workPeriod.end}
                    onChange={(e) => setWorkPeriod((prev) => ({ ...prev, end: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Invoice Title</Label>
                  <Input
                    value={invoiceDetails.title}
                    onChange={(e) => setInvoiceDetails((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Invoice title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Days</Label>
                  <Input
                    type="number"
                    value={invoiceDetails.due_days}
                    onChange={(e) => setInvoiceDetails((prev) => ({ ...prev, due_days: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-expenses"
                  checked={includeExpenses}
                  onCheckedChange={(checked) => setIncludeExpenses(checked as boolean)}
                />
                <Label htmlFor="include-expenses">Include project expenses</Label>
              </div>

              {generating && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>Generating AI suggestions...</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice Items</h3>
                <Button onClick={addInvoiceItem} size="sm">
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
                        {invoiceItems.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-4">
                              <Input
                                value={item.description}
                                onChange={(e) => updateInvoiceItem(item.id, "description", e.target.value)}
                                placeholder="Item description"
                              />
                            </td>
                            <td className="p-4">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateInvoiceItem(item.id, "quantity", Number(e.target.value))}
                                className="w-20"
                              />
                            </td>
                            <td className="p-4">
                              <Input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateInvoiceItem(item.id, "rate", Number(e.target.value))}
                                className="w-32"
                              />
                            </td>
                            <td className="p-4">
                              <span className="font-medium">${item.amount.toLocaleString()}</span>
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="icon" onClick={() => removeInvoiceItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={invoiceDetails.tax_rate}
                          onChange={(e) => setInvoiceDetails((prev) => ({ ...prev, tax_rate: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Amount</Label>
                        <Input
                          type="number"
                          value={invoiceDetails.discount_amount}
                          onChange={(e) =>
                            setInvoiceDetails((prev) => ({ ...prev, discount_amount: Number(e.target.value) }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSubtotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${calculateTax().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${invoiceDetails.discount_amount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              {automation ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Payment Terms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Due Days</p>
                          <p className="text-lg font-semibold">{automation.payment_terms.due_days}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Early Payment Discount</p>
                          <p className="text-lg font-semibold">{automation.payment_terms.early_payment_discount}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Late Fee</p>
                          <p className="text-lg font-semibold">{automation.payment_terms.late_fee_percentage}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Automation Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {automation.automation_rules.map((rule, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{rule.trigger}</p>
                              <p className="text-sm text-muted-foreground">{rule.action}</p>
                            </div>
                            <Badge variant="outline">{rule.timing}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Follow-up Sequence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {automation.follow_up_sequence.map((followUp, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                              {followUp.type === "email" ? (
                                <Mail className="h-4 w-4" />
                              ) : followUp.type === "sms" ? (
                                <Phone className="h-4 w-4" />
                              ) : (
                                <Phone className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Day {followUp.day}</p>
                              <p className="text-sm text-muted-foreground">{followUp.template}</p>
                            </div>
                            <Badge variant="outline">{followUp.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>Select a project and client to view automation suggestions.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{invoiceDetails.title || "Invoice Preview"}</CardTitle>
                  <CardDescription>
                    {clients.find((c) => c.id === selectedClient)?.name || "No client selected"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Bill To:</h4>
                      {selectedClient && (
                        <div className="text-sm">
                          <p>{clients.find((c) => c.id === selectedClient)?.name}</p>
                          <p>{clients.find((c) => c.id === selectedClient)?.company}</p>
                          <p>{clients.find((c) => c.id === selectedClient)?.email}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Invoice Details:</h4>
                      <div className="text-sm space-y-1">
                        <p>
                          Due Date:{" "}
                          {new Date(Date.now() + invoiceDetails.due_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </p>
                        <p>Payment Terms: Net {invoiceDetails.due_days} days</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-4">Items:</h4>
                    <div className="space-y-2">
                      {invoiceItems.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × ${item.rate}
                            </p>
                          </div>
                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toLocaleString()}</span>
                    </div>
                    {invoiceDetails.tax_rate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({invoiceDetails.tax_rate}%):</span>
                        <span>${calculateTax().toLocaleString()}</span>
                      </div>
                    )}
                    {invoiceDetails.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${invoiceDetails.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={generateInvoice} disabled={loading || !selectedProject || !selectedClient}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      Generate Invoice
                    </Button>
                    <Button variant="outline" disabled={loading}>
                      <Send className="mr-2 h-4 w-4" />
                      Generate & Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
