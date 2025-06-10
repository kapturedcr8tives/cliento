export interface User {
  id: string
  email: string
  full_name?: string
  role: "admin" | "user"
  workspace_id?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: "active" | "inactive"
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: "planning" | "active" | "on_hold" | "completed"
  priority: "low" | "medium" | "high" | "urgent"
  budget?: number
  start_date?: string
  end_date?: string
  client_id: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  due_date?: string
  project_id?: string
  assigned_to?: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: string
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
  value?: number
  notes?: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  title: string
  description?: string
  amount: number
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected"
  client_id: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  due_date: string
  client_id: string
  project_id?: string
  workspace_id: string
  created_at: string
  updated_at: string
}
