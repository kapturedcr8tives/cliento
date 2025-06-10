import { supabase } from "./supabase"

export interface LeadInsights {
  score: number
  factors: string[]
  recommendations: string[]
  priority: "low" | "medium" | "high" | "urgent"
}

export interface ProposalSuggestions {
  title: string
  sections: {
    name: string
    content: string
  }[]
  pricing: {
    suggested_amount: number
    breakdown: {
      item: string
      amount: number
    }[]
  }
}

export interface ProjectPrediction {
  completion_date: string
  risk_factors: string[]
  recommendations: string[]
  confidence: number
}

class AIService {
  // Simulate AI lead scoring (in production, this would call OpenAI API)
  async scoreLeadWithAI(lead: {
    name: string
    email?: string
    company?: string
    source?: string
    expected_value?: number
    notes?: string
  }): Promise<LeadInsights> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    let score = 50
    const factors: string[] = []
    const recommendations: string[] = []

    // Email domain analysis
    if (lead.email) {
      if (lead.email.includes("@gmail.com") || lead.email.includes("@yahoo.com")) {
        score -= 10
        factors.push("Personal email domain")
        recommendations.push("Verify business email for higher credibility")
      } else if (lead.email.includes(".com") || lead.email.includes(".org")) {
        score += 15
        factors.push("Professional email domain")
      }
    }

    // Company presence
    if (lead.company && lead.company.length > 0) {
      score += 20
      factors.push("Company information provided")
    } else {
      recommendations.push("Request company information")
    }

    // Source quality
    switch (lead.source) {
      case "Referral":
        score += 25
        factors.push("High-quality referral source")
        break
      case "LinkedIn":
        score += 15
        factors.push("Professional network source")
        break
      case "Website Contact Form":
        score += 10
        factors.push("Direct website inquiry")
        break
      case "Cold Outreach":
        score -= 5
        factors.push("Cold outreach lead")
        recommendations.push("Nurture with valuable content")
        break
    }

    // Expected value impact
    if (lead.expected_value) {
      if (lead.expected_value > 50000) {
        score += 20
        factors.push("High-value opportunity")
      } else if (lead.expected_value > 25000) {
        score += 10
        factors.push("Medium-value opportunity")
      } else if (lead.expected_value > 10000) {
        score += 5
        factors.push("Standard-value opportunity")
      }
    } else {
      recommendations.push("Qualify budget and timeline")
    }

    // Notes analysis (simple keyword matching)
    if (lead.notes) {
      const urgentKeywords = ["urgent", "asap", "immediately", "deadline"]
      const positiveKeywords = ["interested", "excited", "ready", "approved"]

      if (urgentKeywords.some((keyword) => lead.notes!.toLowerCase().includes(keyword))) {
        score += 15
        factors.push("Urgent timeline indicated")
      }

      if (positiveKeywords.some((keyword) => lead.notes!.toLowerCase().includes(keyword))) {
        score += 10
        factors.push("Positive engagement signals")
      }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score))

    // Determine priority
    let priority: "low" | "medium" | "high" | "urgent"
    if (score >= 80) priority = "urgent"
    else if (score >= 65) priority = "high"
    else if (score >= 40) priority = "medium"
    else priority = "low"

    // Add priority-based recommendations
    if (priority === "urgent") {
      recommendations.unshift("Contact immediately - high conversion potential")
    } else if (priority === "high") {
      recommendations.unshift("Schedule follow-up within 24 hours")
    } else if (priority === "medium") {
      recommendations.unshift("Add to nurture sequence")
    } else {
      recommendations.unshift("Monitor and re-evaluate in 30 days")
    }

    return {
      score,
      factors,
      recommendations,
      priority,
    }
  }

  // Generate proposal content suggestions
  async generateProposalSuggestions(context: {
    client_name: string
    project_type: string
    budget_range?: number
    requirements?: string
  }): Promise<ProposalSuggestions> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const { client_name, project_type, budget_range, requirements } = context

    // Generate title
    const title = `${project_type} Proposal for ${client_name}`

    // Generate sections based on project type
    const sections = [
      {
        name: "Executive Summary",
        content: `We are excited to present this comprehensive ${project_type.toLowerCase()} proposal for ${client_name}. Our team brings extensive experience and proven methodologies to deliver exceptional results that align with your business objectives.`,
      },
      {
        name: "Project Overview",
        content: `This ${project_type.toLowerCase()} project will focus on ${requirements || "delivering high-quality solutions tailored to your specific needs"}. We will work closely with your team to ensure seamless integration and optimal outcomes.`,
      },
      {
        name: "Scope of Work",
        content: `Our comprehensive approach includes:\n• Initial consultation and requirements gathering\n• Strategic planning and design phase\n• Implementation and development\n• Testing and quality assurance\n• Deployment and go-live support\n• Post-launch maintenance and support`,
      },
      {
        name: "Timeline",
        content: `We propose a phased approach to ensure quality delivery:\n• Phase 1: Discovery and Planning (2 weeks)\n• Phase 2: Design and Development (4-6 weeks)\n• Phase 3: Testing and Refinement (1-2 weeks)\n• Phase 4: Launch and Support (1 week)\n\nTotal estimated timeline: 8-11 weeks`,
      },
      {
        name: "Investment",
        content: `Our investment for this ${project_type.toLowerCase()} project is structured to provide maximum value while ensuring transparent pricing. All costs are outlined below with no hidden fees.`,
      },
    ]

    // Generate pricing suggestions
    const suggested_amount = budget_range || 25000
    const breakdown = []

    switch (project_type.toLowerCase()) {
      case "website":
      case "web development":
        breakdown.push(
          { item: "UX/UI Design", amount: suggested_amount * 0.3 },
          { item: "Frontend Development", amount: suggested_amount * 0.4 },
          { item: "Backend Development", amount: suggested_amount * 0.2 },
          { item: "Testing & QA", amount: suggested_amount * 0.1 },
        )
        break
      case "mobile app":
        breakdown.push(
          { item: "App Design", amount: suggested_amount * 0.25 },
          { item: "iOS Development", amount: suggested_amount * 0.35 },
          { item: "Android Development", amount: suggested_amount * 0.35 },
          { item: "Testing & Deployment", amount: suggested_amount * 0.05 },
        )
        break
      case "branding":
        breakdown.push(
          { item: "Brand Strategy", amount: suggested_amount * 0.3 },
          { item: "Logo Design", amount: suggested_amount * 0.25 },
          { item: "Brand Guidelines", amount: suggested_amount * 0.25 },
          { item: "Marketing Materials", amount: suggested_amount * 0.2 },
        )
        break
      default:
        breakdown.push(
          { item: "Planning & Strategy", amount: suggested_amount * 0.2 },
          { item: "Implementation", amount: suggested_amount * 0.6 },
          { item: "Testing & Support", amount: suggested_amount * 0.2 },
        )
    }

    return {
      title,
      sections,
      pricing: {
        suggested_amount,
        breakdown,
      },
    }
  }

  // Predict project completion and risks
  async predictProjectOutcome(projectId: string): Promise<ProjectPrediction> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // In production, this would analyze project data
    const { data: project } = await supabase
      .from("projects")
      .select(`
        *,
        tasks(*)
      `)
      .eq("id", projectId)
      .single()

    if (!project) {
      throw new Error("Project not found")
    }

    const tasks = project.tasks || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task: any) => task.status === "done").length
    const overdueTasks = tasks.filter(
      (task: any) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "done",
    ).length

    // Calculate completion percentage
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Predict completion date
    const startDate = new Date(project.start_date || project.created_at)
    const originalEndDate = new Date(project.end_date || Date.now())
    const projectDuration = originalEndDate.getTime() - startDate.getTime()

    // Adjust based on current progress
    const remainingWork = (100 - completionPercentage) / 100
    const estimatedRemainingTime = projectDuration * remainingWork
    const predictedCompletion = new Date(Date.now() + estimatedRemainingTime)

    // Identify risk factors
    const risk_factors: string[] = []
    const recommendations: string[] = []

    if (overdueTasks > 0) {
      risk_factors.push(`${overdueTasks} overdue tasks`)
      recommendations.push("Address overdue tasks immediately")
    }

    if (completionPercentage < 25 && new Date() > new Date(startDate.getTime() + projectDuration * 0.5)) {
      risk_factors.push("Project significantly behind schedule")
      recommendations.push("Consider additional resources or scope adjustment")
    }

    if (totalTasks === 0) {
      risk_factors.push("No tasks defined")
      recommendations.push("Break down project into actionable tasks")
    }

    // Calculate confidence based on various factors
    let confidence = 70
    if (overdueTasks === 0) confidence += 15
    if (completionPercentage > 50) confidence += 10
    if (totalTasks > 5) confidence += 5
    confidence = Math.min(95, confidence)

    return {
      completion_date: predictedCompletion.toISOString().split("T")[0],
      risk_factors,
      recommendations,
      confidence,
    }
  }

  // Generate invoice automation suggestions
  async generateInvoiceContent(context: {
    client_name: string
    project_name?: string
    work_completed: string[]
    hours_worked?: number
    hourly_rate?: number
  }) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const { client_name, project_name, work_completed, hours_worked, hourly_rate } = context

    const title = project_name
      ? `Invoice for ${project_name} - ${client_name}`
      : `Professional Services - ${client_name}`

    const description =
      work_completed.length > 0
        ? `Work completed:\n${work_completed.map((item) => `• ${item}`).join("\n")}`
        : "Professional services rendered as per agreement"

    const suggested_amount = hours_worked && hourly_rate ? hours_worked * hourly_rate : 5000 // Default amount

    return {
      title,
      description,
      suggested_amount,
      line_items: work_completed.map((item) => ({
        description: item,
        quantity: 1,
        rate: suggested_amount / work_completed.length,
      })),
    }
  }
}

export const aiService = new AIService()
