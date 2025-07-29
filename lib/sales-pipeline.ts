import { supabase } from './supabase'
import { authService } from './auth'

// Sales pipeline types
export interface PipelineStage {
  id: string
  organization_id: string
  name: string
  description?: string
  color: string
  probability: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  organization_id: string
  company_id: string
  contact_id?: string
  assigned_to?: string
  pipeline_stage_id?: string
  title: string
  description?: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  source?: string
  source_details?: Record<string, any>
  value?: number
  probability: number
  expected_close_date?: string
  actual_close_date?: string
  lost_reason?: string
  tags?: string[]
  lead_score: number
  lead_score_factors?: Record<string, any>
  custom_fields?: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  organization_id: string
  lead_id: string
  company_id: string
  assigned_to?: string
  pipeline_stage_id?: string
  name: string
  description?: string
  value: number
  probability: number
  expected_close_date?: string
  actual_close_date?: string
  close_reason?: string
  loss_reason?: string
  competitor?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface LeadScoringCriteria {
  id: string
  organization_id: string
  name: string
  description?: string
  criteria_type: 'company_size' | 'industry' | 'budget' | 'timeline' | 'authority' | 'need'
  field_name?: string
  condition_type?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list'
  condition_value?: string
  points: number
  is_active: boolean
  created_at: string
}

export interface SalesForecast {
  period: string
  total_value: number
  weighted_value: number
  probability: number
  count: number
}

export interface PipelineAnalytics {
  total_leads: number
  total_opportunities: number
  total_value: number
  weighted_value: number
  conversion_rate: number
  average_deal_size: number
  average_sales_cycle: number
  stage_breakdown: Array<{
    stage: string
    count: number
    value: number
    probability: number
  }>
}

// Sales pipeline service
export class SalesPipelineService {
  private static instance: SalesPipelineService

  private constructor() {}

  static getInstance(): SalesPipelineService {
    if (!SalesPipelineService.instance) {
      SalesPipelineService.instance = new SalesPipelineService()
    }
    return SalesPipelineService.instance
  }

  // Get pipeline stages
  async getPipelineStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('organization_id', authService.getCurrentOrganization()?.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pipeline stages:', error)
      return []
    }
  }

  // Create pipeline stage
  async createPipelineStage(stage: Omit<PipelineStage, 'id' | 'organization_id' | 'created_at'>): Promise<PipelineStage | null> {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert({
          ...stage,
          organization_id: authService.getCurrentOrganization()?.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating pipeline stage:', error)
      return null
    }
  }

  // Update pipeline stage
  async updatePipelineStage(id: string, updates: Partial<PipelineStage>): Promise<PipelineStage | null> {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating pipeline stage:', error)
      return null
    }
  }

  // Get leads with advanced filtering
  async getLeads(filters?: {
    status?: string
    assigned_to?: string
    pipeline_stage_id?: string
    source?: string
    tags?: string[]
    date_range?: { start: string; end: string }
    search?: string
  }): Promise<Lead[]> {
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          companies (name, industry, size),
          contacts (first_name, last_name, email),
          pipeline_stages (name, color, probability),
          users (first_name, last_name, email)
        `)
        .eq('organization_id', authService.getCurrentOrganization()?.id)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters?.pipeline_stage_id) {
        query = query.eq('pipeline_stage_id', filters.pipeline_stage_id)
      }
      if (filters?.source) {
        query = query.eq('source', filters.source)
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      if (filters?.date_range) {
        query = query.gte('created_at', filters.date_range.start)
        query = query.lte('created_at', filters.date_range.end)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching leads:', error)
      return []
    }
  }

  // Create lead with automatic scoring
  async createLead(lead: Omit<Lead, 'id' | 'organization_id' | 'lead_score' | 'created_at' | 'updated_at'>): Promise<Lead | null> {
    try {
      // Calculate lead score
      const leadScore = await this.calculateLeadScore(lead)

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          organization_id: authService.getCurrentOrganization()?.id,
          lead_score: leadScore,
          created_by: authService.getCurrentUser()?.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating lead:', error)
      return null
    }
  }

  // Update lead with score recalculation
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      // Recalculate lead score if relevant fields changed
      if (updates.value || updates.source || updates.description) {
        const currentLead = await this.getLead(id)
        if (currentLead) {
          const updatedLead = { ...currentLead, ...updates }
          updates.lead_score = await this.calculateLeadScore(updatedLead)
        }
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating lead:', error)
      return null
    }
  }

  // Get single lead
  async getLead(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          companies (name, industry, size),
          contacts (first_name, last_name, email),
          pipeline_stages (name, color, probability),
          users (first_name, last_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching lead:', error)
      return null
    }
  }

  // Calculate lead score based on criteria
  async calculateLeadScore(lead: Partial<Lead>): Promise<number> {
    try {
      const { data: criteria, error } = await supabase
        .from('lead_scoring_criteria')
        .select('*')
        .eq('organization_id', authService.getCurrentOrganization()?.id)
        .eq('is_active', true)

      if (error) throw error

      let totalScore = 0
      const scoreFactors: Record<string, any> = {}

      for (const criterion of criteria || []) {
        let score = 0
        let matched = false

        switch (criterion.criteria_type) {
          case 'company_size':
            if (lead.company_id) {
              const company = await this.getCompany(lead.company_id)
              if (company && criterion.condition_value) {
                const sizes = criterion.condition_value.split(',')
                if (sizes.includes(company.size)) {
                  score = criterion.points
                  matched = true
                }
              }
            }
            break

          case 'budget':
            if (lead.value && criterion.condition_value) {
              const threshold = parseFloat(criterion.condition_value)
              if (lead.value >= threshold) {
                score = criterion.points
                matched = true
              }
            }
            break

          case 'timeline':
            if (lead.expected_close_date && criterion.condition_value) {
              const closeDate = new Date(lead.expected_close_date)
              const now = new Date()
              const monthsDiff = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
              if (monthsDiff <= 3) {
                score = criterion.points
                matched = true
              }
            }
            break

          case 'authority':
            if (lead.contact_id) {
              const contact = await this.getContact(lead.contact_id)
              if (contact?.job_title && criterion.condition_value) {
                const titles = criterion.condition_value.split(',')
                if (titles.some(title => contact.job_title?.includes(title))) {
                  score = criterion.points
                  matched = true
                }
              }
            }
            break

          case 'need':
            if (lead.description && criterion.condition_value) {
              const keywords = criterion.condition_value.split(',')
              if (keywords.some(keyword => lead.description?.toLowerCase().includes(keyword.toLowerCase()))) {
                score = criterion.points
                matched = true
              }
            }
            break

          case 'source':
            if (lead.source === criterion.condition_value) {
              score = criterion.points
              matched = true
            }
            break
        }

        if (matched) {
          totalScore += score
          scoreFactors[criterion.name] = {
            points: score,
            criteria: criterion.name
          }
        }
      }

      return totalScore
    } catch (error) {
      console.error('Error calculating lead score:', error)
      return 0
    }
  }

  // Get opportunities
  async getOpportunities(filters?: {
    status?: string
    assigned_to?: string
    pipeline_stage_id?: string
    date_range?: { start: string; end: string }
    search?: string
  }): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          leads (title, status),
          companies (name, industry),
          pipeline_stages (name, color, probability),
          users (first_name, last_name, email)
        `)
        .eq('organization_id', authService.getCurrentOrganization()?.id)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters?.pipeline_stage_id) {
        query = query.eq('pipeline_stage_id', filters.pipeline_stage_id)
      }
      if (filters?.date_range) {
        query = query.gte('created_at', filters.date_range.start)
        query = query.lte('created_at', filters.date_range.end)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      return []
    }
  }

  // Create opportunity
  async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...opportunity,
          organization_id: authService.getCurrentOrganization()?.id,
          created_by: authService.getCurrentUser()?.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating opportunity:', error)
      return null
    }
  }

  // Update opportunity
  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating opportunity:', error)
      return null
    }
  }

  // Get pipeline analytics
  async getPipelineAnalytics(): Promise<PipelineAnalytics> {
    try {
      const organizationId = authService.getCurrentOrganization()?.id
      if (!organizationId) throw new Error('No organization found')

      // Get leads and opportunities
      const [leads, opportunities, stages] = await Promise.all([
        this.getLeads(),
        this.getOpportunities(),
        this.getPipelineStages()
      ])

      const totalLeads = leads.length
      const totalOpportunities = opportunities.length
      const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
      const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0)

      // Calculate conversion rate
      const wonOpportunities = opportunities.filter(opp => opp.actual_close_date)
      const conversionRate = totalOpportunities > 0 ? (wonOpportunities.length / totalOpportunities) * 100 : 0

      // Calculate average deal size
      const averageDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0

      // Calculate average sales cycle
      const closedOpportunities = opportunities.filter(opp => opp.actual_close_date && opp.created_at)
      const totalCycleDays = closedOpportunities.reduce((sum, opp) => {
        const created = new Date(opp.created_at)
        const closed = new Date(opp.actual_close_date!)
        return sum + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      }, 0)
      const averageSalesCycle = closedOpportunities.length > 0 ? totalCycleDays / closedOpportunities.length : 0

      // Calculate stage breakdown
      const stageBreakdown = stages.map(stage => {
        const stageLeads = leads.filter(lead => lead.pipeline_stage_id === stage.id)
        const stageOpportunities = opportunities.filter(opp => opp.pipeline_stage_id === stage.id)
        const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
        
        return {
          stage: stage.name,
          count: stageLeads.length + stageOpportunities.length,
          value: stageValue,
          probability: stage.probability
        }
      })

      return {
        total_leads: totalLeads,
        total_opportunities: totalOpportunities,
        total_value: totalValue,
        weighted_value: weightedValue,
        conversion_rate: conversionRate,
        average_deal_size: averageDealSize,
        average_sales_cycle: averageSalesCycle,
        stage_breakdown: stageBreakdown
      }
    } catch (error) {
      console.error('Error calculating pipeline analytics:', error)
      return {
        total_leads: 0,
        total_opportunities: 0,
        total_value: 0,
        weighted_value: 0,
        conversion_rate: 0,
        average_deal_size: 0,
        average_sales_cycle: 0,
        stage_breakdown: []
      }
    }
  }

  // Get sales forecast
  async getSalesForecast(period: 'month' | 'quarter' | 'year' = 'month'): Promise<SalesForecast[]> {
    try {
      const opportunities = await this.getOpportunities()
      const forecasts: SalesForecast[] = []

      const now = new Date()
      const periods = period === 'month' ? 12 : period === 'quarter' ? 4 : 1

      for (let i = 0; i < periods; i++) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() + i, 1)
        const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0)

        const periodOpportunities = opportunities.filter(opp => {
          if (!opp.expected_close_date) return false
          const closeDate = new Date(opp.expected_close_date)
          return closeDate >= periodStart && closeDate <= periodEnd
        })

        const totalValue = periodOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
        const weightedValue = periodOpportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0)
        const averageProbability = periodOpportunities.length > 0 
          ? periodOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / periodOpportunities.length 
          : 0

        forecasts.push({
          period: periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total_value: totalValue,
          weighted_value: weightedValue,
          probability: averageProbability,
          count: periodOpportunities.length
        })
      }

      return forecasts
    } catch (error) {
      console.error('Error calculating sales forecast:', error)
      return []
    }
  }

  // Helper methods
  private async getCompany(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching company:', error)
      return null
    }
  }

  private async getContact(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching contact:', error)
      return null
    }
  }
}

// Export singleton instance
export const salesPipelineService = SalesPipelineService.getInstance()