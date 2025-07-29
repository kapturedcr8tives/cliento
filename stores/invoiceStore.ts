import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Invoice, InvoiceItem, Payment, InvoiceStore } from '@/types'

export const useInvoiceStore = create<InvoiceStore>()(
  subscribeWithSelector((set, get) => ({
    invoices: [],
    selectedInvoice: null,
    isLoading: false,
    error: undefined,

    fetchInvoices: async (filters?: Record<string, any>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        let query = supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            project:projects(*),
            contract:contracts(*),
            payments (*),
            attachments (*)
          `)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (key === 'search') {
                query = query.or(`invoice_number.ilike.%${value}%,title.ilike.%${value}%`)
              } else if (key === 'status') {
                query = query.eq(key, value)
              } else if (key === 'client_id') {
                query = query.eq(key, value)
              } else if (key === 'project_id') {
                query = query.eq(key, value)
              } else if (key === 'type') {
                query = query.eq(key, value)
              } else if (key === 'date_from') {
                query = query.gte('issue_date', value)
              } else if (key === 'date_to') {
                query = query.lte('issue_date', value)
              }
            }
          })
        }

        const { data, error } = await query

        if (error) {
          throw new Error(error.message)
        }

        set({
          invoices: data || [],
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch invoices',
          isLoading: false,
        })
        throw error
      }
    },

    fetchInvoice: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            project:projects(*),
            contract:contracts(*),
            payments (*),
            attachments (*)
          `)
          .eq('id', id)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set({
          selectedInvoice: data,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch invoice',
          isLoading: false,
        })
        throw error
      }
    },

    createInvoice: async (data: Partial<Invoice>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        // Generate invoice number
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .order('created_at', { ascending: false })
          .limit(1)

        const lastNumber = lastInvoice?.[0]?.invoice_number || 'INV-0000'
        const nextNumber = generateInvoiceNumber(lastNumber)

        const { data: newInvoice, error } = await supabase
          .from('invoices')
          .insert({
            ...data,
            organization_id: useAuthStore.getState().organization?.id,
            invoice_number: nextNumber,
            status: data.status || 'draft',
            type: data.type || 'one_time',
            currency: data.currency || 'USD',
            subtotal: data.subtotal || 0,
            tax_amount: data.tax_amount || 0,
            discount_amount: data.discount_amount || 0,
            total: data.total || 0,
            items: data.items || [],
            payments: data.payments || [],
            attachments: data.attachments || [],
            custom_fields: data.custom_fields || {},
          })
          .select(`
            *,
            client:clients(*),
            project:projects(*),
            contract:contracts(*),
            payments (*),
            attachments (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          invoices: [newInvoice, ...state.invoices],
          selectedInvoice: newInvoice,
          isLoading: false,
        }))

        return newInvoice
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create invoice',
          isLoading: false,
        })
        throw error
      }
    },

    updateInvoice: async (id: string, data: Partial<Invoice>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: updatedInvoice, error } = await supabase
          .from('invoices')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            client:clients(*),
            project:projects(*),
            contract:contracts(*),
            payments (*),
            attachments (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? updatedInvoice : invoice
          ),
          selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update invoice',
          isLoading: false,
        })
        throw error
      }
    },

    deleteInvoice: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
          selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete invoice',
          isLoading: false,
        })
        throw error
      }
    },

    sendInvoice: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: invoice, error } = await supabase
          .from('invoices')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select(`
            *,
            client:clients(*),
            project:projects(*),
            contract:contracts(*),
            payments (*),
            attachments (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        // TODO: Send email notification to client
        // await sendInvoiceEmail(invoice)

        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? invoice : inv
          ),
          selectedInvoice: state.selectedInvoice?.id === id ? invoice : state.selectedInvoice,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to send invoice',
          isLoading: false,
        })
        throw error
      }
    },
  }))
)

// Helper functions for invoice operations
export const invoiceHelpers = {
  // Generate invoice number
  generateInvoiceNumber: (lastNumber: string) => {
    const match = lastNumber.match(/INV-(\d+)/)
    if (match) {
      const nextNum = parseInt(match[1]) + 1
      return `INV-${nextNum.toString().padStart(4, '0')}`
    }
    return 'INV-0001'
  },

  // Calculate invoice totals
  calculateInvoiceTotals: (items: InvoiceItem[], taxRate?: number, discountRate?: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0
    const discountAmount = discountRate ? (subtotal * discountRate) / 100 : 0
    const total = subtotal + taxAmount - discountAmount

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total,
    }
  },

  // Get invoice by ID
  getInvoiceById: (id: string) => {
    return useInvoiceStore.getState().invoices.find((invoice) => invoice.id === id)
  },

  // Get invoices by status
  getInvoicesByStatus: (status: string) => {
    return useInvoiceStore.getState().invoices.filter((invoice) => invoice.status === status)
  },

  // Get invoices by client
  getInvoicesByClient: (clientId: string) => {
    return useInvoiceStore.getState().invoices.filter((invoice) => invoice.client_id === clientId)
  },

  // Get invoices by project
  getInvoicesByProject: (projectId: string) => {
    return useInvoiceStore.getState().invoices.filter((invoice) => invoice.project_id === projectId)
  },

  // Search invoices
  searchInvoices: (query: string) => {
    const invoices = useInvoiceStore.getState().invoices
    const searchTerm = query.toLowerCase()
    
    return invoices.filter((invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm) ||
      invoice.title.toLowerCase().includes(searchTerm) ||
      invoice.client?.name.toLowerCase().includes(searchTerm)
    )
  },

  // Get invoice statistics
  getInvoiceStats: () => {
    const invoices = useInvoiceStore.getState().invoices
    
    return {
      total: invoices.length,
      draft: invoices.filter((i) => i.status === 'draft').length,
      sent: invoices.filter((i) => i.status === 'sent').length,
      viewed: invoices.filter((i) => i.status === 'viewed').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      cancelled: invoices.filter((i) => i.status === 'cancelled').length,
      totalAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
      paidAmount: invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.total, 0),
      outstandingAmount: invoices
        .filter((i) => ['sent', 'viewed', 'overdue'].includes(i.status))
        .reduce((sum, invoice) => sum + invoice.total, 0),
      averageInvoiceValue: invoices.length > 0 
        ? invoices.reduce((sum, invoice) => sum + invoice.total, 0) / invoices.length 
        : 0,
    }
  },

  // Get recent invoices
  getRecentInvoices: (limit: number = 5) => {
    return useInvoiceStore.getState().invoices
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  },

  // Get overdue invoices
  getOverdueInvoices: () => {
    const now = new Date()
    return useInvoiceStore.getState().invoices.filter((invoice) =>
      invoice.status === 'sent' && new Date(invoice.due_date) < now
    )
  },

  // Get invoices by type
  getInvoicesByType: (type: string) => {
    return useInvoiceStore.getState().invoices.filter((invoice) => invoice.type === type)
  },

  // Get invoices by date range
  getInvoicesByDateRange: (startDate: string, endDate: string) => {
    return useInvoiceStore.getState().invoices.filter((invoice) => {
      const issueDate = new Date(invoice.issue_date)
      return issueDate >= new Date(startDate) && issueDate <= new Date(endDate)
    })
  },

  // Get top clients by invoice value
  getTopClientsByInvoiceValue: (limit: number = 10) => {
    const invoices = useInvoiceStore.getState().invoices
    const clientTotals = invoices.reduce((acc, invoice) => {
      const clientId = invoice.client_id
      acc[clientId] = (acc[clientId] || 0) + invoice.total
      return acc
    }, {} as Record<string, number>)

    return Object.entries(clientTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([clientId, total]) => ({
        clientId,
        total,
        client: invoices.find((i) => i.client_id === clientId)?.client,
      }))
  },

  // Get monthly revenue
  getMonthlyRevenue: (year: number) => {
    const invoices = useInvoiceStore.getState().invoices
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      count: 0,
    }))

    invoices.forEach((invoice) => {
      if (invoice.status === 'paid') {
        const date = new Date(invoice.paid_at || invoice.created_at)
        if (date.getFullYear() === year) {
          const month = date.getMonth()
          monthlyData[month].revenue += invoice.total
          monthlyData[month].count += 1
        }
      }
    })

    return monthlyData
  },

  // Get payment statistics
  getPaymentStats: () => {
    const invoices = useInvoiceStore.getState().invoices
    const payments = invoices.flatMap((invoice) => invoice.payments || [])
    
    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      averagePayment: payments.length > 0 
        ? payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length 
        : 0,
      paymentsByMethod: payments.reduce((acc, payment) => {
        acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  },
}

// Payment management functions
export const paymentHelpers = {
  // Record a payment
  recordPayment: async (invoiceId: string, paymentData: Partial<Payment>) => {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        invoice_id: invoiceId,
        status: paymentData.status || 'completed',
        paid_at: paymentData.paid_at || new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    // Update invoice status if fully paid
    const invoice = useInvoiceStore.getState().invoices.find((i) => i.id === invoiceId)
    if (invoice) {
      const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0) + payment.amount
      if (totalPaid >= invoice.total) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', invoiceId)
      }
    }

    return payment
  },

  // Get payments for an invoice
  getInvoicePayments: (invoiceId: string) => {
    const invoice = useInvoiceStore.getState().invoices.find((i) => i.id === invoiceId)
    return invoice?.payments || []
  },

  // Calculate remaining balance
  calculateRemainingBalance: (invoiceId: string) => {
    const invoice = useInvoiceStore.getState().invoices.find((i) => i.id === invoiceId)
    if (!invoice) return 0

    const totalPaid = (invoice.payments || []).reduce((sum, payment) => sum + payment.amount, 0)
    return Math.max(0, invoice.total - totalPaid)
  },

  // Get payment methods statistics
  getPaymentMethodStats: () => {
    const invoices = useInvoiceStore.getState().invoices
    const payments = invoices.flatMap((invoice) => invoice.payments || [])
    
    return payments.reduce((acc, payment) => {
      const method = payment.payment_method
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 }
      }
      acc[method].count += 1
      acc[method].total += payment.amount
      return acc
    }, {} as Record<string, { count: number; total: number }>)
  },
}

// Generate invoice number helper
function generateInvoiceNumber(lastNumber: string): string {
  const match = lastNumber.match(/INV-(\d+)/)
  if (match) {
    const nextNum = parseInt(match[1]) + 1
    return `INV-${nextNum.toString().padStart(4, '0')}`
  }
  return 'INV-0001'
}