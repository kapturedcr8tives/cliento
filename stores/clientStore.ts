import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Client, ClientStore } from '@/types'

export const useClientStore = create<ClientStore>()(
  subscribeWithSelector((set, get) => ({
    clients: [],
    selectedClient: null,
    isLoading: false,
    error: undefined,

    fetchClients: async (filters?: Record<string, any>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        let query = supabase
          .from('clients')
          .select(`
            *,
            contacts (*),
            projects (*),
            invoices (*),
            proposals (*),
            contracts (*)
          `)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (key === 'search') {
                query = query.or(`name.ilike.%${value}%,email.ilike.%${value}%,company.ilike.%${value}%`)
              } else if (key === 'status') {
                query = query.eq(key, value)
              } else if (key === 'tags') {
                query = query.contains(key, [value])
              } else if (key === 'assigned_to') {
                query = query.eq(key, value)
              }
            }
          })
        }

        const { data, error } = await query

        if (error) {
          throw new Error(error.message)
        }

        set({
          clients: data || [],
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch clients',
          isLoading: false,
        })
        throw error
      }
    },

    fetchClient: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            contacts (*),
            projects (*),
            invoices (*),
            proposals (*),
            contracts (*)
          `)
          .eq('id', id)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set({
          selectedClient: data,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch client',
          isLoading: false,
        })
        throw error
      }
    },

    createClient: async (data: Partial<Client>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            ...data,
            organization_id: useAuthStore.getState().organization?.id,
            status: data.status || 'active',
            tags: data.tags || [],
            total_revenue: data.total_revenue || 0,
            currency: data.currency || 'USD',
            custom_fields: data.custom_fields || {},
            contacts: data.contacts || [],
            projects: data.projects || [],
            invoices: data.invoices || [],
            proposals: data.proposals || [],
            contracts: data.contracts || [],
          })
          .select(`
            *,
            contacts (*),
            projects (*),
            invoices (*),
            proposals (*),
            contracts (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          clients: [newClient, ...state.clients],
          selectedClient: newClient,
          isLoading: false,
        }))

        return newClient
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create client',
          isLoading: false,
        })
        throw error
      }
    },

    updateClient: async (id: string, data: Partial<Client>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: updatedClient, error } = await supabase
          .from('clients')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            contacts (*),
            projects (*),
            invoices (*),
            proposals (*),
            contracts (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id ? updatedClient : client
          ),
          selectedClient: state.selectedClient?.id === id ? updatedClient : state.selectedClient,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update client',
          isLoading: false,
        })
        throw error
      }
    },

    deleteClient: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
          selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete client',
          isLoading: false,
        })
        throw error
      }
    },
  }))
)

// Helper functions for client operations
export const clientHelpers = {
  // Get client by ID
  getClientById: (id: string) => {
    return useClientStore.getState().clients.find((client) => client.id === id)
  },

  // Get clients by status
  getClientsByStatus: (status: string) => {
    return useClientStore.getState().clients.filter((client) => client.status === status)
  },

  // Get clients by assigned user
  getClientsByAssignee: (userId: string) => {
    return useClientStore.getState().clients.filter((client) => client.assigned_to === userId)
  },

  // Search clients
  searchClients: (query: string) => {
    const clients = useClientStore.getState().clients
    const searchTerm = query.toLowerCase()
    
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      client.company?.toLowerCase().includes(searchTerm) ||
      client.phone?.includes(searchTerm)
    )
  },

  // Get client statistics
  getClientStats: () => {
    const clients = useClientStore.getState().clients
    
    return {
      total: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      inactive: clients.filter((c) => c.status === 'inactive').length,
      prospects: clients.filter((c) => c.status === 'prospect').length,
      leads: clients.filter((c) => c.status === 'lead').length,
      churned: clients.filter((c) => c.status === 'churned').length,
      totalRevenue: clients.reduce((sum, client) => sum + (client.total_revenue || 0), 0),
      averageRevenue: clients.length > 0 
        ? clients.reduce((sum, client) => sum + (client.total_revenue || 0), 0) / clients.length 
        : 0,
    }
  },

  // Get recent clients
  getRecentClients: (limit: number = 5) => {
    return useClientStore.getState().clients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  },

  // Get top clients by revenue
  getTopClientsByRevenue: (limit: number = 10) => {
    return useClientStore.getState().clients
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, limit)
  },

  // Get clients with overdue invoices
  getClientsWithOverdueInvoices: () => {
    return useClientStore.getState().clients.filter((client) =>
      client.invoices?.some((invoice) => 
        invoice.status === 'overdue' || 
        (invoice.status === 'sent' && new Date(invoice.due_date) < new Date())
      )
    )
  },

  // Get clients with active projects
  getClientsWithActiveProjects: () => {
    return useClientStore.getState().clients.filter((client) =>
      client.projects?.some((project) => project.status === 'active')
    )
  },

  // Get clients by tag
  getClientsByTag: (tag: string) => {
    return useClientStore.getState().clients.filter((client) =>
      client.tags?.includes(tag)
    )
  },

  // Get all unique tags
  getAllTags: () => {
    const clients = useClientStore.getState().clients
    const allTags = clients.flatMap((client) => client.tags || [])
    return [...new Set(allTags)]
  },

  // Get clients by source
  getClientsBySource: (source: string) => {
    return useClientStore.getState().clients.filter((client) => client.source === source)
  },

  // Get all unique sources
  getAllSources: () => {
    const clients = useClientStore.getState().clients
    const allSources = clients.map((client) => client.source).filter(Boolean)
    return [...new Set(allSources)]
  },
}