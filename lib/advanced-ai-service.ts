import { supabase } from "./supabase"

export interface AdvancedLeadScoring {
  final_score: number
  demographic_score: number
  firmographic_score: number
  behavioral_score: number
  engagement_score: number
  factors: string[]
  recommendations: string[]
  confidence: number
  next_actions: {
    priority: "immediate" | "high" | "medium" | "low"
    actions: string[]
    timeline: string
  }
}

export interface ProjectRiskAnalysis {
  risk_score: number
  completion_percentage: number
  risk_factors: {
    type: string
    severity: "critical" | "high" | "medium" | "low"
    description: string
    impact: number
  }[]
  recommendations: string[]
  predicted_completion_date: string | null
  budget_forecast: {
    current_spend: number
    projected_total: number
    variance_percentage: number
  }
  resource_optimization: {
    bottlenecks: string[]
    suggestions: string[]
  }
}

export interface ProposalOptimization {
  template_suggestions: {
    template_id: string
    name: string
    conversion_rate: number
    confidence: number
  }[]
  content_improvements: {
    section: string
    suggestion: string
    impact: "high" | "medium" | "low"
  }[]
  pricing_analysis: {
    suggested_price: number
    price_range: { min: number; max: number }
    market_comparison: string
  }
  ab_test_recommendations: {
    test_name: string
    variants: string[]
    success_metrics: string[]
  }[]
}

export interface InvoiceAutomation {
  suggested_items: {
    description: string
    quantity: number
    rate: number
    amount: number
  }[]
  payment_terms: {
    due_days: number
    early_payment_discount: number
    late_fee_percentage: number
  }
  automation_rules: {
    trigger: string
    action: string
    timing: string
  }[]
  follow_up_sequence: {
    day: number
    type: "email" | "sms" | "call"
    template: string
  }[]
}

class AdvancedAIService {
  // Enhanced lead scoring with machine learning-like analysis
  async analyzeLeadAdvanced(leadId: string): Promise<AdvancedLeadScoring> {
    try {
      // Get lead data and historical patterns
      const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single()

      if (!lead) throw new Error("Lead not found")

      // Call the advanced scoring function
      const { data: scoringResult } = await supabase.rpc("calculate_advanced_lead_score", {
        lead_id: leadId,
      })

      // Get historical conversion data for similar leads
      const { data: historicalData } = await supabase
        .from("leads")
        .select("status, expected_value, source, company")
        .eq("workspace_id", lead.workspace_id)
        .in("status", ["won", "lost"])
        .limit(100)

      // Analyze patterns
      const conversionRate = this.calculateConversionRate(historicalData, lead)
      const confidence = this.calculateConfidence(scoringResult, historicalData)

      // Generate recommendations
      const recommendations = this.generateRecommendations(scoringResult, lead, conversionRate)
      const nextActions = this.generateNextActions(scoringResult.final_score, lead)

      return {
        ...scoringResult,
        recommendations,
        confidence,
        next_actions: nextActions,
      }
    } catch (error) {
      console.error("Error in advanced lead analysis:", error)
      throw error
    }
  }

  // Project risk analysis with ML-like predictions
  async analyzeProjectRisks(projectId: string): Promise<ProjectRiskAnalysis> {
    try {
      // Get project predictions from database function
      const { data: predictions } = await supabase.rpc("predict_project_risks", {
        project_id: projectId,
      })

      // Get project financial data
      const { data: project } = await supabase
        .from("projects")
        .select(`
          *,
          invoices(total_amount, status),
          tasks(estimated_hours, actual_hours, status)
        `)
        .eq("id", projectId)
        .single()

      // Calculate budget forecast
      const budgetForecast = this.calculateBudgetForecast(project)

      // Identify resource bottlenecks
      const resourceOptimization = this.analyzeResourceOptimization(project)

      return {
        ...predictions,
        budget_forecast: budgetForecast,
        resource_optimization: resourceOptimization,
      }
    } catch (error) {
      console.error("Error in project risk analysis:", error)
      throw error
    }
  }

  // Proposal optimization with A/B testing insights
  async optimizeProposal(context: {
    client_id: string
    project_type: string
    budget_range?: number
    industry?: string
  }): Promise<ProposalOptimization> {
    try {
      const { client_id, project_type, budget_range, industry } = context

      // Get client data
      const { data: client } = await supabase.from("clients").select("*").eq("id", client_id).single()

      // Get historical proposal performance
      const { data: templates } = await supabase
        .from("proposal_templates")
        .select("*")
        .eq("workspace_id", client.workspace_id)
        .eq("is_active", true)
        .order("conversion_rate", { ascending: false })

      // Get A/B test results
      const { data: abTests } = await supabase
        .from("proposal_ab_tests")
        .select("*")
        .eq("workspace_id", client.workspace_id)
        .eq("status", "completed")

      // Generate template suggestions
      const templateSuggestions = this.generateTemplateSuggestions(templates, project_type, industry)

      // Generate content improvements
      const contentImprovements = this.generateContentImprovements(project_type, budget_range)

      // Pricing analysis
      const pricingAnalysis = this.analyzePricing(project_type, budget_range, industry)

      // A/B test recommendations
      const abTestRecommendations = this.generateABTestRecommendations(abTests, project_type)

      return {
        template_suggestions: templateSuggestions,
        content_improvements: contentImprovements,
        pricing_analysis: pricingAnalysis,
        ab_test_recommendations: abTestRecommendations,
      }
    } catch (error) {
      console.error("Error in proposal optimization:", error)
      throw error
    }
  }

  // Automated invoice generation with smart suggestions
  async generateInvoiceAutomation(context: {
    project_id: string
    client_id: string
    work_period: { start: string; end: string }
    include_expenses?: boolean
  }): Promise<InvoiceAutomation> {
    try {
      const { project_id, client_id, work_period, include_expenses } = context

      // Get project and task data
      const { data: project } = await supabase
        .from("projects")
        .select(`
          *,
          tasks(title, actual_hours, status, created_at),
          client:clients(*)
        `)
        .eq("id", project_id)
        .single()

      // Get completed tasks in the period
      const completedTasks = project.tasks?.filter(
        (task: any) =>
          task.status === "done" &&
          new Date(task.created_at) >= new Date(work_period.start) &&
          new Date(task.created_at) <= new Date(work_period.end),
      )

      // Generate invoice items
      const suggestedItems = this.generateInvoiceItems(completedTasks, project, include_expenses)

      // Get payment terms based on client history
      const paymentTerms = await this.getOptimalPaymentTerms(client_id)

      // Generate automation rules
      const automationRules = this.generateAutomationRules(project, client_id)

      // Create follow-up sequence
      const followUpSequence = this.generateFollowUpSequence(paymentTerms)

      return {
        suggested_items: suggestedItems,
        payment_terms: paymentTerms,
        automation_rules: automationRules,
        follow_up_sequence: followUpSequence,
      }
    } catch (error) {
      console.error("Error in invoice automation:", error)
      throw error
    }
  }

  // Helper methods for calculations and analysis

  private calculateConversionRate(historicalData: any[], currentLead: any): number {
    if (!historicalData || historicalData.length === 0) return 0.5

    const similarLeads = historicalData.filter(
      (lead) =>
        lead.source === currentLead.source ||
        lead.company?.toLowerCase().includes(currentLead.company?.toLowerCase() || "") ||
        Math.abs((lead.expected_value || 0) - (currentLead.expected_value || 0)) < 10000,
    )

    if (similarLeads.length === 0) return 0.5

    const wonLeads = similarLeads.filter((lead) => lead.status === "won").length
    return wonLeads / similarLeads.length
  }

  private calculateConfidence(scoringResult: any, historicalData: any[]): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on data quality
    if (historicalData && historicalData.length > 50) confidence += 0.1
    if (scoringResult.demographic_score > 30) confidence += 0.05
    if (scoringResult.firmographic_score > 30) confidence += 0.05
    if (scoringResult.behavioral_score > 30) confidence += 0.05
    if (scoringResult.engagement_score > 30) confidence += 0.05

    return Math.min(0.95, confidence)
  }

  private generateRecommendations(scoringResult: any, lead: any, conversionRate: number): string[] {
    const recommendations: string[] = []

    if (scoringResult.final_score >= 80) {
      recommendations.push("High-priority lead - contact immediately")
      recommendations.push("Prepare detailed proposal with premium pricing")
    } else if (scoringResult.final_score >= 60) {
      recommendations.push("Schedule discovery call within 24 hours")
      recommendations.push("Send relevant case studies")
    } else if (scoringResult.final_score >= 40) {
      recommendations.push("Add to nurture sequence")
      recommendations.push("Qualify budget and timeline")
    } else {
      recommendations.push("Monitor for engagement signals")
      recommendations.push("Consider long-term nurture campaign")
    }

    if (conversionRate > 0.7) {
      recommendations.push("Similar leads have high conversion rate")
    }

    if (!lead.phone) {
      recommendations.push("Obtain phone number for better qualification")
    }

    return recommendations
  }

  private generateNextActions(
    score: number,
    lead: any,
  ): {
    priority: "immediate" | "high" | "medium" | "low"
    actions: string[]
    timeline: string
  } {
    if (score >= 80) {
      return {
        priority: "immediate",
        actions: ["Call within 1 hour", "Send personalized email", "Connect on LinkedIn"],
        timeline: "Within 1 hour",
      }
    } else if (score >= 60) {
      return {
        priority: "high",
        actions: ["Schedule discovery call", "Send company overview", "Research their business"],
        timeline: "Within 24 hours",
      }
    } else if (score >= 40) {
      return {
        priority: "medium",
        actions: ["Add to email sequence", "Send relevant content", "Monitor website activity"],
        timeline: "Within 3 days",
      }
    } else {
      return {
        priority: "low",
        actions: ["Add to long-term nurture", "Monitor for engagement", "Quarterly check-in"],
        timeline: "Within 1 week",
      }
    }
  }

  private calculateBudgetForecast(project: any): {
    current_spend: number
    projected_total: number
    variance_percentage: number
  } {
    const invoicedAmount = project.invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0
    const totalHours = project.tasks?.reduce((sum: number, task: any) => sum + (task.actual_hours || 0), 0) || 0
    const estimatedHours = project.tasks?.reduce((sum: number, task: any) => sum + (task.estimated_hours || 0), 0) || 0

    const hourlyRate = totalHours > 0 ? invoicedAmount / totalHours : 100 // Default rate
    const projectedTotal = estimatedHours * hourlyRate
    const variance = project.budget ? ((projectedTotal - project.budget) / project.budget) * 100 : 0

    return {
      current_spend: invoicedAmount,
      projected_total: projectedTotal,
      variance_percentage: variance,
    }
  }

  private analyzeResourceOptimization(project: any): {
    bottlenecks: string[]
    suggestions: string[]
  } {
    const bottlenecks: string[] = []
    const suggestions: string[] = []

    const overdueTasks = project.tasks?.filter(
      (task: any) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "done",
    )

    if (overdueTasks && overdueTasks.length > 0) {
      bottlenecks.push(`${overdueTasks.length} overdue tasks`)
      suggestions.push("Prioritize overdue tasks and reassign if necessary")
    }

    const urgentTasks = project.tasks?.filter((task: any) => task.priority === "urgent")
    if (urgentTasks && urgentTasks.length > project.tasks?.length * 0.3) {
      bottlenecks.push("Too many urgent tasks")
      suggestions.push("Review task prioritization and planning process")
    }

    return { bottlenecks, suggestions }
  }

  private generateTemplateSuggestions(
    templates: any[],
    projectType: string,
    industry?: string,
  ): {
    template_id: string
    name: string
    conversion_rate: number
    confidence: number
  }[] {
    return templates
      .filter((template) => {
        const categoryMatch = template.category?.toLowerCase().includes(projectType.toLowerCase())
        const industryMatch = !industry || template.name.toLowerCase().includes(industry.toLowerCase())
        return categoryMatch || industryMatch
      })
      .slice(0, 3)
      .map((template) => ({
        template_id: template.id,
        name: template.name,
        conversion_rate: template.conversion_rate || 0.3,
        confidence: template.usage_count > 10 ? 0.8 : 0.6,
      }))
  }

  private generateContentImprovements(
    projectType: string,
    budgetRange?: number,
  ): {
    section: string
    suggestion: string
    impact: "high" | "medium" | "low"
  }[] {
    const improvements = [
      {
        section: "Executive Summary",
        suggestion: "Include specific ROI metrics and success stories",
        impact: "high" as const,
      },
      {
        section: "Timeline",
        suggestion: "Break down into detailed milestones with dependencies",
        impact: "medium" as const,
      },
      {
        section: "Investment",
        suggestion: "Provide multiple pricing options with clear value differentiation",
        impact: "high" as const,
      },
    ]

    if (budgetRange && budgetRange > 50000) {
      improvements.push({
        section: "Team",
        suggestion: "Highlight senior team members and their expertise",
        impact: "high",
      })
    }

    return improvements
  }

  private analyzePricing(
    projectType: string,
    budgetRange?: number,
    industry?: string,
  ): {
    suggested_price: number
    price_range: { min: number; max: number }
    market_comparison: string
  } {
    // Simple pricing logic - in production, this would use market data
    let basePrice = 25000

    switch (projectType.toLowerCase()) {
      case "website":
        basePrice = 15000
        break
      case "mobile app":
        basePrice = 45000
        break
      case "branding":
        basePrice = 12000
        break
      case "enterprise software":
        basePrice = 75000
        break
    }

    if (industry === "healthcare" || industry === "finance") {
      basePrice *= 1.3 // Premium for regulated industries
    }

    return {
      suggested_price: budgetRange || basePrice,
      price_range: {
        min: basePrice * 0.8,
        max: basePrice * 1.4,
      },
      market_comparison: "Competitive with industry standards",
    }
  }

  private generateABTestRecommendations(
    abTests: any[],
    projectType: string,
  ): {
    test_name: string
    variants: string[]
    success_metrics: string[]
  }[] {
    return [
      {
        test_name: "Pricing Strategy Test",
        variants: ["Value-based pricing", "Hourly rate pricing", "Package pricing"],
        success_metrics: ["Conversion rate", "Average deal size", "Time to close"],
      },
      {
        test_name: "Content Length Test",
        variants: ["Detailed proposal", "Executive summary", "Visual presentation"],
        success_metrics: ["Engagement time", "Response rate", "Conversion rate"],
      },
    ]
  }

  private generateInvoiceItems(
    completedTasks: any[],
    project: any,
    includeExpenses?: boolean,
  ): {
    description: string
    quantity: number
    rate: number
    amount: number
  }[] {
    const items: any[] = []

    if (completedTasks && completedTasks.length > 0) {
      // Group tasks by type or create individual items
      const totalHours = completedTasks.reduce((sum, task) => sum + (task.actual_hours || 8), 0)
      const hourlyRate = project.budget && totalHours > 0 ? project.budget / totalHours : 150

      items.push({
        description: `${project.name} - Development Work`,
        quantity: totalHours,
        rate: hourlyRate,
        amount: totalHours * hourlyRate,
      })
    } else {
      // Default milestone billing
      items.push({
        description: `${project.name} - Milestone Payment`,
        quantity: 1,
        rate: project.budget * 0.3 || 5000,
        amount: project.budget * 0.3 || 5000,
      })
    }

    if (includeExpenses) {
      items.push({
        description: "Project Expenses",
        quantity: 1,
        rate: 500,
        amount: 500,
      })
    }

    return items
  }

  private async getOptimalPaymentTerms(clientId: string): Promise<{
    due_days: number
    early_payment_discount: number
    late_fee_percentage: number
  }> {
    // Get client payment history
    const { data: invoices } = await supabase
      .from("invoices")
      .select("due_date, paid_at, status")
      .eq("client_id", clientId)
      .limit(10)

    let avgPaymentDays = 30 // Default

    if (invoices && invoices.length > 0) {
      const paidInvoices = invoices.filter((inv) => inv.paid_at)
      if (paidInvoices.length > 0) {
        const totalDays = paidInvoices.reduce((sum, inv) => {
          const dueDate = new Date(inv.due_date)
          const paidDate = new Date(inv.paid_at)
          return sum + Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        }, 0)
        avgPaymentDays = Math.ceil(totalDays / paidInvoices.length)
      }
    }

    return {
      due_days: Math.max(15, Math.min(45, avgPaymentDays + 5)),
      early_payment_discount: avgPaymentDays > 30 ? 2 : 0,
      late_fee_percentage: 1.5,
    }
  }

  private generateAutomationRules(
    project: any,
    clientId: string,
  ): {
    trigger: string
    action: string
    timing: string
  }[] {
    return [
      {
        trigger: "Task completion milestone reached",
        action: "Generate invoice automatically",
        timing: "Immediately",
      },
      {
        trigger: "Invoice due date approaching",
        action: "Send payment reminder email",
        timing: "3 days before due date",
      },
      {
        trigger: "Payment overdue",
        action: "Send follow-up email and apply late fee",
        timing: "1 day after due date",
      },
    ]
  }

  private generateFollowUpSequence(paymentTerms: any): {
    day: number
    type: "email" | "sms" | "call"
    template: string
  }[] {
    return [
      {
        day: paymentTerms.due_days - 3,
        type: "email",
        template: "Friendly payment reminder",
      },
      {
        day: paymentTerms.due_days + 1,
        type: "email",
        template: "Payment overdue notice",
      },
      {
        day: paymentTerms.due_days + 7,
        type: "call",
        template: "Personal follow-up call",
      },
      {
        day: paymentTerms.due_days + 14,
        type: "email",
        template: "Final notice before collections",
      },
    ]
  }

  // Analytics and tracking methods
  async trackEvent(event: {
    type: string
    entity_type?: string
    entity_id?: string
    properties?: Record<string, any>
    user_id?: string
    workspace_id?: string
  }) {
    try {
      await supabase.from("analytics_events").insert({
        event_type: event.type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        properties: event.properties,
        user_id: event.user_id,
        workspace_id: event.workspace_id,
        session_id: this.getSessionId(),
      })
    } catch (error) {
      console.error("Error tracking event:", error)
    }
  }

  private getSessionId(): string {
    // Simple session ID generation
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const advancedAIService = new AdvancedAIService()
