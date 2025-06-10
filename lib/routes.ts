export const routes = {
  // Authentication routes
  auth: {
    signin: "/auth/signin",
    signup: "/auth/signup",
  },

  // Main dashboard routes
  dashboard: {
    home: "/dashboard",
    clients: {
      list: "/dashboard/clients",
      new: "/dashboard/clients/new",
      detail: (id: string) => `/dashboard/clients/${id}`,
      edit: (id: string) => `/dashboard/clients/${id}/edit`,
    },
    projects: {
      list: "/dashboard/projects",
      new: "/dashboard/projects/new",
      detail: (id: string) => `/dashboard/projects/${id}`,
      edit: (id: string) => `/dashboard/projects/${id}/edit`,
    },
    tasks: {
      list: "/dashboard/tasks",
      new: "/dashboard/tasks/new",
      detail: (id: string) => `/dashboard/tasks/${id}`,
      edit: (id: string) => `/dashboard/tasks/${id}/edit`,
    },
    leads: {
      list: "/dashboard/leads",
      new: "/dashboard/leads/new",
      detail: (id: string) => `/dashboard/leads/${id}`,
      edit: (id: string) => `/dashboard/leads/${id}/edit`,
    },
    proposals: {
      list: "/dashboard/proposals",
      new: "/dashboard/proposals/new",
      detail: (id: string) => `/dashboard/proposals/${id}`,
      edit: (id: string) => `/dashboard/proposals/${id}/edit`,
    },
    invoices: {
      list: "/dashboard/invoices",
      new: "/dashboard/invoices/new",
      detail: (id: string) => `/dashboard/invoices/${id}`,
      edit: (id: string) => `/dashboard/invoices/${id}/edit`,
    },
    reports: "/dashboard/reports",
    settings: "/dashboard/settings",
  },
} as const

export type Routes = typeof routes

// Navigation configuration for sidebar and mobile nav
export const navigationConfig = [
  {
    name: "Dashboard",
    href: routes.dashboard.home,
    icon: "Home",
    description: "Overview and quick actions",
  },
  {
    name: "Clients",
    href: routes.dashboard.clients.list,
    icon: "Users",
    description: "Manage client relationships",
    subRoutes: [
      { name: "All Clients", href: routes.dashboard.clients.list },
      { name: "Add Client", href: routes.dashboard.clients.new },
    ],
  },
  {
    name: "Projects",
    href: routes.dashboard.projects.list,
    icon: "FolderOpen",
    description: "Track and manage projects",
    subRoutes: [
      { name: "All Projects", href: routes.dashboard.projects.list },
      { name: "New Project", href: routes.dashboard.projects.new },
    ],
  },
  {
    name: "Tasks",
    href: routes.dashboard.tasks.list,
    icon: "CheckSquare",
    description: "Manage tasks and todos",
    subRoutes: [
      { name: "All Tasks", href: routes.dashboard.tasks.list },
      { name: "Add Task", href: routes.dashboard.tasks.new },
    ],
  },
  {
    name: "Leads",
    href: routes.dashboard.leads.list,
    icon: "UserPlus",
    description: "Track sales pipeline",
    subRoutes: [
      { name: "All Leads", href: routes.dashboard.leads.list },
      { name: "Add Lead", href: routes.dashboard.leads.new },
    ],
  },
  {
    name: "Proposals",
    href: routes.dashboard.proposals.list,
    icon: "FileText",
    description: "Create and track proposals",
    subRoutes: [
      { name: "All Proposals", href: routes.dashboard.proposals.list },
      { name: "New Proposal", href: routes.dashboard.proposals.new },
    ],
  },
  {
    name: "Invoices",
    href: routes.dashboard.invoices.list,
    icon: "Receipt",
    description: "Manage billing and payments",
    subRoutes: [
      { name: "All Invoices", href: routes.dashboard.invoices.list },
      { name: "New Invoice", href: routes.dashboard.invoices.new },
    ],
  },
  {
    name: "Reports",
    href: routes.dashboard.reports,
    icon: "BarChart3",
    description: "Analytics and insights",
  },
] as const

// Quick actions configuration
export const quickActionsConfig = [
  {
    name: "Add New Client",
    href: routes.dashboard.clients.new,
    icon: "Users",
    description: "Create a new client profile",
    color: "blue",
  },
  {
    name: "Create Project",
    href: routes.dashboard.projects.new,
    icon: "FolderOpen",
    description: "Start a new project",
    color: "green",
  },
  {
    name: "Add Task",
    href: routes.dashboard.tasks.new,
    icon: "CheckSquare",
    description: "Create a new task",
    color: "orange",
  },
  {
    name: "Generate Invoice",
    href: routes.dashboard.invoices.new,
    icon: "DollarSign",
    description: "Create a new invoice",
    color: "emerald",
  },
  {
    name: "Add Lead",
    href: routes.dashboard.leads.new,
    icon: "UserPlus",
    description: "Add a new lead",
    color: "purple",
  },
  {
    name: "New Proposal",
    href: routes.dashboard.proposals.new,
    icon: "FileText",
    description: "Create a proposal",
    color: "indigo",
  },
] as const
