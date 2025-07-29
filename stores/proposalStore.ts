import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { Proposal, ProposalStatus, ApiResponse, PaginatedResponse } from '@/types'

interface ProposalState {
  proposals: Proposal[]
  selectedProposal: Proposal | null
  isLoading: boolean
  error: string | null
}

interface ProposalActions {
  fetchProposals: (filters?: {
    status?: ProposalStatus
    type?: string
    clientId?: string
    search?: string
  }) => Promise<void>
  fetchProposal: (id: string) => Promise<Proposal | null>
  createProposal: (data: Partial<Proposal>) => Promise<Proposal>
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<Proposal>
  deleteProposal: (id: string) => Promise<void>
  sendProposal: (id: string) => Promise<void>
  clearError: () => void
}

interface ProposalHelpers {
  getProposalById: (id: string) => Proposal | null
  getProposalsByStatus: (status: ProposalStatus) => Proposal[]
  getProposalsByType: (type: string) => Proposal[]
  getProposalsByClient: (clientId: string) => Proposal[]
  searchProposals: (query: string) => Proposal[]
  getProposalStats: (proposals: Proposal[]) => {
    total: number
    draft: number
    sent: number
    viewed: number
    accepted: number
    rejected: number
    expired: number
    acceptanceRate: number
    totalValue: number
    averageValue: number
  }
  getRecentProposals: (proposals: Proposal[], limit?: number) => Proposal[]
  getExpiringProposals: (proposals: Proposal[], days?: number) => Proposal[]
  getProposalsByValueRange: (min: number, max: number) => Proposal[]
  getTopClientsByProposals: (proposals: Proposal[], limit?: number) => Array<{
    clientId: string
    clientName: string
    count: number
    totalValue: number
  }>
  getProposalConversionRate: (proposals: Proposal[]) => {
    sent: number
    viewed: number
    accepted: number
    conversionRate: number
  }
}

type ProposalStore = ProposalState & ProposalActions & {
  proposalHelpers: ProposalHelpers
}

export const useProposalStore = create<ProposalStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    proposals: [],
    selectedProposal: null,
    isLoading: false,
    error: null,

    // Actions
    fetchProposals: async (filters = {}) => {
      set({ isLoading: true, error: null })
      
      try {
        const { user, organization } = useAuthStore.getState()
        if (!user || !organization) {
          throw new Error('User not authenticated')
        }

        let query = supabase
          .from('proposals')
          .select(`
            *,
            client:clients(id, name, email, company),
            project:projects(id, name, status)
          `)
          .eq('organization_id', organization.id)

        // Apply filters
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.type) {
          query = query.eq('type', filters.type)
        }
        if (filters.clientId) {
          query = query.eq('client_id', filters.clientId)
        }
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        set({ proposals: data || [], isLoading: false })
      } catch (error) {
        console.error('Error fetching proposals:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch proposals',
          isLoading: false 
        })
      }
    },

    fetchProposal: async (id: string) => {
      set({ isLoading: true, error: null })
      
      try {
        const { user, organization } = useAuthStore.getState()
        if (!user || !organization) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('proposals')
          .select(`
            *,
            client:clients(id, name, email, company),
            project:projects(id, name, status)
          `)
          .eq('id', id)
          .eq('organization_id', organization.id)
          .single()

        if (error) {
          throw error
        }

        set({ selectedProposal: data, isLoading: false })
        return data
      } catch (error) {
        console.error('Error fetching proposal:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch proposal',
          isLoading: false 
        })
        return null
      }
    },

    createProposal: async (data: Partial<Proposal>) => {
      set({ isLoading: true, error: null })
      
      try {
        const { user, organization } = useAuthStore.getState()
        if (!user || !organization) {
          throw new Error('User not authenticated')
        }

        const proposalData = {
          ...data,
          organization_id: organization.id,
          created_by: user.id,
          status: 'draft' as ProposalStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: newProposal, error } = await supabase
          .from('proposals')
          .insert(proposalData)
          .select(`
            *,
            client:clients(id, name, email, company),
            project:projects(id, name, status)
          `)
          .single()

        if (error) {
          throw error
        }

        set(state => ({
          proposals: [newProposal, ...state.proposals],
          selectedProposal: newProposal,
          isLoading: false
        }))

        return newProposal
      } catch (error) {
        console.error('Error creating proposal:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create proposal',
          isLoading: false 
        })
        throw error
      }
    },

    updateProposal: async (id: string, data: Partial<Proposal>) => {
      set({ isLoading: true, error: null })
      
      try {
        const { user, organization } = useAuthStore.getState()
        if (!user || !organization) {
          throw new Error('User not authenticated')
        }

        const updateData = {
          ...data,
          updated_at: new Date().toISOString()
        }

        const { data: updatedProposal, error } = await supabase
          .from('proposals')
          .update(updateData)
          .eq('id', id)
          .eq('organization_id', organization.id)
          .select(`
            *,
            client:clients(id, name, email, company),
            project:projects(id, name, status)
          `)
          .single()

        if (error) {
          throw error
        }

        set(state => ({
          proposals: state.proposals.map(p => 
            p.id === id ? updatedProposal : p
          ),
          selectedProposal: updatedProposal,
          isLoading: false
        }))

        return updatedProposal
      } catch (error) {
        console.error('Error updating proposal:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update proposal',
          isLoading: false 
        })
        throw error
      }
    },

    deleteProposal: async (id: string) => {
      set({ isLoading: true, error: null })
      
      try {
        const { user, organization } = useAuthStore.getState()
        if (!user || !organization) {
          throw new Error('User not authenticated')
        }

        const { error } = await supabase
          .from('proposals')
          .delete()
          .eq('id', id)
          .eq('organization_id', organization.id)

        if (error) {
          throw error
        }

        set(state => ({
          proposals: state.proposals.filter(p => p.id !== id),
          selectedProposal: state.selectedProposal?.id === id ? null : state.selectedProposal,
          isLoading: false
        }))
      } catch (error) {
        console.error('Error deleting proposal:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete proposal',
          isLoading: false 
        })
        throw error
      }
    },

    sendProposal: async (id: string) => {
      set({ isLoading: true, error: null })
      
      try {
        const { user, organization } = useAuthStore.getState()
        if (!user || !organization) {
          throw new Error('User not authenticated')
        }

        const { data: proposal, error: fetchError } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .eq('organization_id', organization.id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (!proposal) {
          throw new Error('Proposal not found')
        }

        // Update proposal status to sent
        const { data: updatedProposal, error: updateError } = await supabase
          .from('proposals')
          .update({
            status: 'sent' as ProposalStatus,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('organization_id', organization.id)
          .select(`
            *,
            client:clients(id, name, email, company),
            project:projects(id, name, status)
          `)
          .single()

        if (updateError) {
          throw updateError
        }

        // TODO: Send email notification to client
        // This would integrate with your email service (Resend, etc.)

        set(state => ({
          proposals: state.proposals.map(p => 
            p.id === id ? updatedProposal : p
          ),
          selectedProposal: updatedProposal,
          isLoading: false
        }))
      } catch (error) {
        console.error('Error sending proposal:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to send proposal',
          isLoading: false 
        })
        throw error
      }
    },

    clearError: () => {
      set({ error: null })
    },

    // Helper functions
    proposalHelpers: {
      getProposalById: (id: string) => {
        const { proposals } = get()
        return proposals.find(p => p.id === id) || null
      },

      getProposalsByStatus: (status: ProposalStatus) => {
        const { proposals } = get()
        return proposals.filter(p => p.status === status)
      },

      getProposalsByType: (type: string) => {
        const { proposals } = get()
        return proposals.filter(p => p.type === type)
      },

      getProposalsByClient: (clientId: string) => {
        const { proposals } = get()
        return proposals.filter(p => p.clientId === clientId)
      },

      searchProposals: (query: string) => {
        const { proposals } = get()
        const searchTerm = query.toLowerCase()
        return proposals.filter(p => 
          p.title.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm) ||
          p.client?.name?.toLowerCase().includes(searchTerm)
        )
      },

      getProposalStats: (proposals: Proposal[]) => {
        const total = proposals.length
        const draft = proposals.filter(p => p.status === 'draft').length
        const sent = proposals.filter(p => p.status === 'sent').length
        const viewed = proposals.filter(p => p.status === 'viewed').length
        const accepted = proposals.filter(p => p.status === 'accepted').length
        const rejected = proposals.filter(p => p.status === 'rejected').length
        const expired = proposals.filter(p => p.status === 'expired').length

        const totalValue = proposals.reduce((sum, p) => sum + (p.value || 0), 0)
        const averageValue = total > 0 ? totalValue / total : 0
        const acceptanceRate = sent > 0 ? (accepted / sent) * 100 : 0

        return {
          total,
          draft,
          sent,
          viewed,
          accepted,
          rejected,
          expired,
          acceptanceRate: Math.round(acceptanceRate),
          totalValue,
          averageValue: Math.round(averageValue)
        }
      },

      getRecentProposals: (proposals: Proposal[], limit = 5) => {
        return proposals
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      },

      getExpiringProposals: (proposals: Proposal[], days = 7) => {
        const now = new Date()
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        
        return proposals.filter(p => {
          if (!p.validUntil) return false
          const validDate = new Date(p.validUntil)
          return validDate > now && validDate <= futureDate && p.status !== 'accepted' && p.status !== 'rejected'
        })
      },

      getProposalsByValueRange: (min: number, max: number) => {
        const { proposals } = get()
        return proposals.filter(p => {
          const value = p.value || 0
          return value >= min && value <= max
        })
      },

      getTopClientsByProposals: (proposals: Proposal[], limit = 5) => {
        const clientStats = new Map<string, { count: number; totalValue: number; name: string }>()
        
        proposals.forEach(p => {
          if (p.clientId && p.client?.name) {
            const existing = clientStats.get(p.clientId) || { count: 0, totalValue: 0, name: p.client.name }
            existing.count++
            existing.totalValue += p.value || 0
            clientStats.set(p.clientId, existing)
          }
        })

        return Array.from(clientStats.entries())
          .map(([clientId, stats]) => ({
            clientId,
            clientName: stats.name,
            count: stats.count,
            totalValue: stats.totalValue
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
      },

      getProposalConversionRate: (proposals: Proposal[]) => {
        const sent = proposals.filter(p => p.status === 'sent').length
        const viewed = proposals.filter(p => p.status === 'viewed').length
        const accepted = proposals.filter(p => p.status === 'accepted').length
        const conversionRate = sent > 0 ? (accepted / sent) * 100 : 0

        return {
          sent,
          viewed,
          accepted,
          conversionRate: Math.round(conversionRate)
        }
      }
    }
  }))
)