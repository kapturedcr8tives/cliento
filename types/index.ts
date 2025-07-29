// Core entity types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  organization_id?: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  is_active: boolean
  preferences?: UserPreferences
}

export type UserRole = 'super_admin' | 'org_admin' | 'user' | 'client'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: NotificationPreferences
  dashboard_layout?: DashboardLayout
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  project_updates: boolean
  invoice_reminders: boolean
  client_messages: boolean
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
  columns: number
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'list' | 'calendar'
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  subscription_tier: SubscriptionTier
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  trial_ends_at?: string
  created_at: string
  updated_at: string
  settings: OrganizationSettings
  billing_info?: BillingInfo
}

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise'

export interface OrganizationSettings {
  branding: BrandingSettings
  integrations: IntegrationSettings
  features: FeatureFlags
  security: SecuritySettings
}

export interface BrandingSettings {
  primary_color: string
  logo_url?: string
  favicon_url?: string
  custom_domain?: string
  company_name: string
  address?: string
  phone?: string
  email?: string
}

export interface IntegrationSettings {
  email_provider?: 'gmail' | 'outlook' | 'custom'
  payment_gateway?: 'stripe' | 'mpesa' | 'paypal'
  calendar_provider?: 'google' | 'outlook'
  storage_provider?: 'supabase' | 'aws' | 'google'
}

export interface FeatureFlags {
  advanced_analytics: boolean
  workflow_automation: boolean
  client_portal: boolean
  api_access: boolean
  white_label: boolean
  custom_integrations: boolean
}

export interface SecuritySettings {
  two_factor_required: boolean
  session_timeout: number
  ip_whitelist?: string[]
  password_policy: PasswordPolicy
}

export interface PasswordPolicy {
  min_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_numbers: boolean
  require_special_chars: boolean
}

export interface BillingInfo {
  plan: SubscriptionTier
  billing_cycle: 'monthly' | 'yearly'
  next_billing_date: string
  amount: number
  currency: string
  payment_method?: PaymentMethod
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  last4?: string
  brand?: string
  expiry_month?: number
  expiry_year?: number
}

// Client types
export interface Client {
  id: string
  organization_id: string
  name: string
  email: string
  phone?: string
  company?: string
  website?: string
  address?: Address
  status: ClientStatus
  source?: string
  tags: string[]
  notes?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  assigned_to?: string
  last_contact_at?: string
  total_revenue: number
  currency: string
  custom_fields: Record<string, any>
  contacts: ClientContact[]
  projects: Project[]
  invoices: Invoice[]
  proposals: Proposal[]
  contracts: Contract[]
}

export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'lead' | 'churned'

export interface Address {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface ClientContact {
  id: string
  client_id: string
  name: string
  email: string
  phone?: string
  role?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

// Project types
export interface Project {
  id: string
  organization_id: string
  client_id: string
  name: string
  description?: string
  status: ProjectStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  budget?: number
  currency: string
  progress: number
  created_at: string
  updated_at: string
  assigned_to?: string
  tags: string[]
  custom_fields: Record<string, any>
  tasks: Task[]
  time_entries: TimeEntry[]
  milestones: Milestone[]
  files: ProjectFile[]
  comments: ProjectComment[]
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Task {
  id: string
  project_id: string
  name: string
  description?: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  created_at: string
  updated_at: string
  tags: string[]
  subtasks: Subtask[]
  time_entries: TimeEntry[]
  comments: TaskComment[]
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Subtask {
  id: string
  task_id: string
  name: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  project_id?: string
  task_id?: string
  user_id: string
  description: string
  start_time: string
  end_time?: string
  duration?: number
  billable: boolean
  rate?: number
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description?: string
  due_date: string
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  name: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  created_at: string
}

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// Proposal types
export interface Proposal {
  id: string
  organization_id: string
  client_id: string
  title: string
  description?: string
  status: ProposalStatus
  template_id?: string
  content: ProposalContent
  pricing: ProposalPricing
  valid_until?: string
  created_at: string
  updated_at: string
  sent_at?: string
  viewed_at?: string
  accepted_at?: string
  rejected_at?: string
  created_by: string
  custom_fields: Record<string, any>
  attachments: ProposalAttachment[]
  comments: ProposalComment[]
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'

export interface ProposalContent {
  sections: ProposalSection[]
  styling: ProposalStyling
}

export interface ProposalSection {
  id: string
  type: 'text' | 'image' | 'video' | 'pricing_table' | 'timeline' | 'testimonials'
  content: any
  order: number
}

export interface ProposalStyling {
  theme: string
  primary_color: string
  font_family: string
  custom_css?: string
}

export interface ProposalPricing {
  currency: string
  items: ProposalItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_rate?: number
  discount_amount?: number
  total: number
}

export interface ProposalItem {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
}

export interface ProposalAttachment {
  id: string
  proposal_id: string
  name: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

export interface ProposalComment {
  id: string
  proposal_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// Contract types
export interface Contract {
  id: string
  organization_id: string
  client_id: string
  proposal_id?: string
  title: string
  description?: string
  type: ContractType
  status: ContractStatus
  template_id?: string
  content: ContractContent
  terms: ContractTerms
  parties: ContractParty[]
  signatures: ContractSignature[]
  created_at: string
  updated_at: string
  effective_date?: string
  expiry_date?: string
  terminated_at?: string
  created_by: string
  custom_fields: Record<string, any>
  attachments: ContractAttachment[]
  amendments: ContractAmendment[]
}

export type ContractType = 'service_agreement' | 'nda' | 'msa' | 'sow' | 'maintenance' | 'consulting'

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'completed' | 'terminated' | 'expired'

export interface ContractContent {
  sections: ContractSection[]
  styling: ContractStyling
}

export interface ContractSection {
  id: string
  type: 'text' | 'clause' | 'schedule' | 'attachment'
  content: any
  order: number
}

export interface ContractStyling {
  theme: string
  primary_color: string
  font_family: string
  custom_css?: string
}

export interface ContractTerms {
  start_date?: string
  end_date?: string
  auto_renewal: boolean
  renewal_period?: string
  termination_notice?: string
  payment_terms: string
  currency: string
  total_value?: number
  milestones: ContractMilestone[]
}

export interface ContractMilestone {
  id: string
  contract_id: string
  name: string
  description?: string
  due_date: string
  amount: number
  status: 'pending' | 'completed' | 'overdue'
  completed_at?: string
}

export interface ContractParty {
  id: string
  contract_id: string
  name: string
  email: string
  role: 'client' | 'vendor' | 'witness'
  signature_required: boolean
  signed_at?: string
}

export interface ContractSignature {
  id: string
  contract_id: string
  party_id: string
  signature_data: string
  signed_at: string
  ip_address?: string
  user_agent?: string
}

export interface ContractAttachment {
  id: string
  contract_id: string
  name: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

export interface ContractAmendment {
  id: string
  contract_id: string
  version: number
  changes: string
  created_by: string
  created_at: string
  approved_at?: string
}

// Invoice types
export interface Invoice {
  id: string
  organization_id: string
  client_id: string
  project_id?: string
  contract_id?: string
  invoice_number: string
  title: string
  description?: string
  status: InvoiceStatus
  type: InvoiceType
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_rate?: number
  discount_amount?: number
  total: number
  currency: string
  exchange_rate?: number
  notes?: string
  terms?: string
  created_at: string
  updated_at: string
  sent_at?: string
  paid_at?: string
  created_by: string
  custom_fields: Record<string, any>
  payments: Payment[]
  attachments: InvoiceAttachment[]
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded'

export type InvoiceType = 'one_time' | 'recurring' | 'milestone' | 'retainer'

export interface InvoiceItem {
  id: string
  invoice_id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
  tax_rate?: number
  tax_amount?: number
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  currency: string
  payment_method: PaymentMethodType
  transaction_id?: string
  status: PaymentStatus
  paid_at: string
  created_at: string
  updated_at: string
  notes?: string
}

export type PaymentMethodType = 'stripe' | 'mpesa' | 'paypal' | 'bank_transfer' | 'cash' | 'check'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface InvoiceAttachment {
  id: string
  invoice_id: string
  name: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

// Lead types
export interface Lead {
  id: string
  organization_id: string
  name: string
  email: string
  phone?: string
  company?: string
  website?: string
  source: string
  status: LeadStatus
  score: number
  assigned_to?: string
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
  last_contact_at?: string
  custom_fields: Record<string, any>
  activities: LeadActivity[]
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'

export interface LeadActivity {
  id: string
  lead_id: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'task'
  title: string
  description?: string
  created_by: string
  created_at: string
  scheduled_at?: string
  completed_at?: string
}

// Analytics types
export interface Analytics {
  revenue: RevenueAnalytics
  clients: ClientAnalytics
  projects: ProjectAnalytics
  performance: PerformanceAnalytics
  trends: TrendAnalytics
}

export interface RevenueAnalytics {
  total_revenue: number
  monthly_revenue: number
  growth_rate: number
  outstanding_amount: number
  average_invoice_value: number
  revenue_by_period: RevenueByPeriod[]
}

export interface RevenueByPeriod {
  period: string
  revenue: number
  invoices: number
  growth: number
}

export interface ClientAnalytics {
  total_clients: number
  active_clients: number
  new_clients_this_month: number
  client_retention_rate: number
  average_client_value: number
  clients_by_status: ClientStatusCount[]
}

export interface ClientStatusCount {
  status: ClientStatus
  count: number
  percentage: number
}

export interface ProjectAnalytics {
  total_projects: number
  active_projects: number
  completed_projects: number
  average_project_duration: number
  projects_by_status: ProjectStatusCount[]
}

export interface ProjectStatusCount {
  status: ProjectStatus
  count: number
  percentage: number
}

export interface PerformanceAnalytics {
  team_productivity: TeamProductivity
  task_completion: TaskCompletion
  time_tracking: TimeTracking
}

export interface TeamProductivity {
  tasks_completed: number
  tasks_overdue: number
  average_task_duration: number
  productivity_score: number
}

export interface TaskCompletion {
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  average_completion_time: number
}

export interface TimeTracking {
  total_hours: number
  billable_hours: number
  utilization_rate: number
  average_hourly_rate: number
}

export interface TrendAnalytics {
  revenue_trend: TrendData[]
  client_growth: TrendData[]
  project_completion: TrendData[]
}

export interface TrendData {
  date: string
  value: number
  change: number
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
  read_at?: string
}

export type NotificationType = 
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'project_milestone'
  | 'task_assigned'
  | 'client_message'
  | 'proposal_viewed'
  | 'contract_signed'
  | 'system_alert'

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  validation?: any
}

export interface FormConfig {
  fields: FormField[]
  submit_label: string
  cancel_label?: string
}

// Modal types
export interface ModalConfig {
  id: string
  title: string
  content: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  onClose?: () => void
  onConfirm?: () => void
  confirmLabel?: string
  cancelLabel?: string
  showClose?: boolean
}

// Filter types
export interface FilterOption {
  label: string
  value: string
  count?: number
}

export interface FilterConfig {
  field: string
  label: string
  type: 'select' | 'multiselect' | 'date_range' | 'text' | 'number_range'
  options?: FilterOption[]
  placeholder?: string
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Search types
export interface SearchResult<T> {
  data: T[]
  total: number
  query: string
  filters: Record<string, any>
  sort: SortConfig
}

// Export types
export interface ExportConfig {
  format: 'csv' | 'pdf' | 'excel'
  fields: string[]
  filters?: Record<string, any>
  filename?: string
}

// Webhook types
export interface Webhook {
  id: string
  organization_id: string
  name: string
  url: string
  events: WebhookEvent[]
  secret?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WebhookEvent = 
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'client.created'
  | 'client.updated'
  | 'project.created'
  | 'project.completed'
  | 'proposal.sent'
  | 'proposal.accepted'
  | 'contract.signed'

// Audit types
export interface AuditLog {
  id: string
  organization_id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  stack?: string
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  error?: string
  data?: any
}

// Store types
export interface AuthStore {
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
  error?: string
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  organization_name: string
  organization_slug: string
}

export interface ClientStore {
  clients: Client[]
  selectedClient: Client | null
  isLoading: boolean
  error?: string
  fetchClients: (filters?: Record<string, any>) => Promise<void>
  fetchClient: (id: string) => Promise<void>
  createClient: (data: Partial<Client>) => Promise<Client>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
}

export interface ProjectStore {
  projects: Project[]
  selectedProject: Project | null
  isLoading: boolean
  error?: string
  fetchProjects: (filters?: Record<string, any>) => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (data: Partial<Project>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export interface InvoiceStore {
  invoices: Invoice[]
  selectedInvoice: Invoice | null
  isLoading: boolean
  error?: string
  fetchInvoices: (filters?: Record<string, any>) => Promise<void>
  fetchInvoice: (id: string) => Promise<void>
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice>
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  sendInvoice: (id: string) => Promise<void>
}

export interface ProposalStore {
  proposals: Proposal[]
  selectedProposal: Proposal | null
  isLoading: boolean
  error?: string
  fetchProposals: (filters?: Record<string, any>) => Promise<void>
  fetchProposal: (id: string) => Promise<void>
  createProposal: (data: Partial<Proposal>) => Promise<Proposal>
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<void>
  deleteProposal: (id: string) => Promise<void>
  sendProposal: (id: string) => Promise<void>
}

export interface ContractStore {
  contracts: Contract[]
  selectedContract: Contract | null
  isLoading: boolean
  error?: string
  fetchContracts: (filters?: Record<string, any>) => Promise<void>
  fetchContract: (id: string) => Promise<void>
  createContract: (data: Partial<Contract>) => Promise<Contract>
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>
  deleteContract: (id: string) => Promise<void>
  sendContract: (id: string) => Promise<void>
}

export interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error?: string
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

export interface ModalStore {
  modals: ModalConfig[]
  openModal: (config: ModalConfig) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
}

export interface AnalyticsStore {
  analytics: Analytics | null
  isLoading: boolean
  error?: string
  fetchAnalytics: (period?: string) => Promise<void>
  exportReport: (config: ExportConfig) => Promise<void>
}

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invoice, 'id'>>
      }
      proposals: {
        Row: Proposal
        Insert: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Proposal, 'id'>>
      }
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contract, 'id'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      client_status: ClientStatus
      project_status: ProjectStatus
      task_status: TaskStatus
      invoice_status: InvoiceStatus
      proposal_status: ProposalStatus
      contract_status: ContractStatus
      lead_status: LeadStatus
      subscription_tier: SubscriptionTier
    }
  }
}