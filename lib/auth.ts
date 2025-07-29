import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

// Enhanced authentication types
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer'
  organization_id: string
  avatar_url?: string
  phone?: string
  job_title?: string
  department?: string
  is_active: boolean
  is_verified: boolean
  last_login_at?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string
  industry?: string
  size?: string
  website?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  timezone: string
  currency: string
  language: string
  settings: Record<string, any>
  is_active: boolean
  subscription_plan: string
  subscription_expires_at?: string
  created_at: string
  updated_at: string
}

export interface UserPermission {
  id: string
  user_id: string
  resource: string
  action: string
  granted: boolean
  created_at: string
}

// Permission matrix for RBAC
export const PERMISSIONS = {
  // Lead permissions
  LEADS: {
    VIEW: 'leads:view',
    CREATE: 'leads:create',
    UPDATE: 'leads:update',
    DELETE: 'leads:delete',
    ASSIGN: 'leads:assign',
    EXPORT: 'leads:export'
  },
  // Contact permissions
  CONTACTS: {
    VIEW: 'contacts:view',
    CREATE: 'contacts:create',
    UPDATE: 'contacts:update',
    DELETE: 'contacts:delete',
    EXPORT: 'contacts:export'
  },
  // Opportunity permissions
  OPPORTUNITIES: {
    VIEW: 'opportunities:view',
    CREATE: 'opportunities:create',
    UPDATE: 'opportunities:update',
    DELETE: 'opportunities:delete',
    ASSIGN: 'opportunities:assign',
    EXPORT: 'opportunities:export'
  },
  // Project permissions
  PROJECTS: {
    VIEW: 'projects:view',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
    ASSIGN: 'projects:assign',
    EXPORT: 'projects:export'
  },
  // Task permissions
  TASKS: {
    VIEW: 'tasks:view',
    CREATE: 'tasks:create',
    UPDATE: 'tasks:update',
    DELETE: 'tasks:delete',
    ASSIGN: 'tasks:assign',
    EXPORT: 'tasks:export'
  },
  // Report permissions
  REPORTS: {
    VIEW: 'reports:view',
    CREATE: 'reports:create',
    UPDATE: 'reports:update',
    DELETE: 'reports:delete',
    SHARE: 'reports:share'
  },
  // User management permissions
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    ASSIGN_ROLES: 'users:assign_roles'
  },
  // Organization settings permissions
  SETTINGS: {
    VIEW: 'settings:view',
    UPDATE: 'settings:update',
    BILLING: 'settings:billing'
  }
} as const

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS).flatMap(permission => Object.values(permission)),
  admin: [
    ...Object.values(PERMISSIONS.LEADS),
    ...Object.values(PERMISSIONS.CONTACTS),
    ...Object.values(PERMISSIONS.OPPORTUNITIES),
    ...Object.values(PERMISSIONS.PROJECTS),
    ...Object.values(PERMISSIONS.TASKS),
    ...Object.values(PERMISSIONS.REPORTS),
    PERMISSIONS.USERS.VIEW,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.SETTINGS.VIEW,
    PERMISSIONS.SETTINGS.UPDATE
  ],
  manager: [
    PERMISSIONS.LEADS.VIEW,
    PERMISSIONS.LEADS.CREATE,
    PERMISSIONS.LEADS.UPDATE,
    PERMISSIONS.LEADS.ASSIGN,
    PERMISSIONS.CONTACTS.VIEW,
    PERMISSIONS.CONTACTS.CREATE,
    PERMISSIONS.CONTACTS.UPDATE,
    PERMISSIONS.OPPORTUNITIES.VIEW,
    PERMISSIONS.OPPORTUNITIES.CREATE,
    PERMISSIONS.OPPORTUNITIES.UPDATE,
    PERMISSIONS.OPPORTUNITIES.ASSIGN,
    PERMISSIONS.PROJECTS.VIEW,
    PERMISSIONS.PROJECTS.CREATE,
    PERMISSIONS.PROJECTS.UPDATE,
    PERMISSIONS.PROJECTS.ASSIGN,
    PERMISSIONS.TASKS.VIEW,
    PERMISSIONS.TASKS.CREATE,
    PERMISSIONS.TASKS.UPDATE,
    PERMISSIONS.TASKS.ASSIGN,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.REPORTS.CREATE
  ],
  user: [
    PERMISSIONS.LEADS.VIEW,
    PERMISSIONS.LEADS.CREATE,
    PERMISSIONS.LEADS.UPDATE,
    PERMISSIONS.CONTACTS.VIEW,
    PERMISSIONS.CONTACTS.CREATE,
    PERMISSIONS.CONTACTS.UPDATE,
    PERMISSIONS.OPPORTUNITIES.VIEW,
    PERMISSIONS.OPPORTUNITIES.CREATE,
    PERMISSIONS.OPPORTUNITIES.UPDATE,
    PERMISSIONS.PROJECTS.VIEW,
    PERMISSIONS.PROJECTS.CREATE,
    PERMISSIONS.PROJECTS.UPDATE,
    PERMISSIONS.TASKS.VIEW,
    PERMISSIONS.TASKS.CREATE,
    PERMISSIONS.TASKS.UPDATE,
    PERMISSIONS.REPORTS.VIEW
  ],
  viewer: [
    PERMISSIONS.LEADS.VIEW,
    PERMISSIONS.CONTACTS.VIEW,
    PERMISSIONS.OPPORTUNITIES.VIEW,
    PERMISSIONS.PROJECTS.VIEW,
    PERMISSIONS.TASKS.VIEW,
    PERMISSIONS.REPORTS.VIEW
  ]
} as const

// Authentication class with enhanced security
export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null
  private currentOrganization: Organization | null = null
  private userPermissions: UserPermission[] = []

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Enhanced sign in with security features
  async signIn(email: string, password: string): Promise<{ user: User; organization: Organization } | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        // Get user profile with organization
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select(`
            *,
            organizations (*)
          `)
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        this.currentUser = profile as User
        this.currentOrganization = profile.organizations as Organization

        // Load user permissions
        await this.loadUserPermissions()

        // Log successful login
        await this.logUserActivity('login', 'User logged in successfully')

        return {
          user: this.currentUser,
          organization: this.currentOrganization
        }
      }

      return null
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Enhanced sign up with organization creation
  async signUp(email: string, password: string, userData: {
    first_name: string
    last_name: string
    organization_name: string
    organization_slug: string
  }): Promise<{ user: User; organization: Organization } | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        // Create organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: userData.organization_name,
            slug: userData.organization_slug,
            settings: {
              features: {
                advanced_analytics: false,
                workflow_automation: false,
                custom_fields: false,
                api_access: false
              }
            }
          })
          .select()
          .single()

        if (orgError) throw orgError

        // Create user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            organization_id: org.id,
            role: 'admin', // First user is admin
            is_verified: false
          })
          .select()
          .single()

        if (profileError) throw profileError

        this.currentUser = profile as User
        this.currentOrganization = org as Organization

        // Load user permissions
        await this.loadUserPermissions()

        return {
          user: this.currentUser,
          organization: this.currentOrganization
        }
      }

      return null
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign out with session cleanup
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
      this.currentUser = null
      this.currentOrganization = null
      this.userPermissions = []
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Get current organization
  getCurrentOrganization(): Organization | null {
    return this.currentOrganization
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false

    // Super admin has all permissions
    if (this.currentUser.role === 'super_admin') return true

    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[this.currentUser.role as keyof typeof ROLE_PERMISSIONS] || []
    if (rolePermissions.includes(permission as any)) return true

    // Check custom user permissions
    return this.userPermissions.some(p => p.resource + ':' + p.action === permission && p.granted)
  }

  // Check if user can perform action on resource
  can(resource: string, action: string): boolean {
    return this.hasPermission(`${resource}:${action}`)
  }

  // Load user permissions from database
  private async loadUserPermissions(): Promise<void> {
    if (!this.currentUser) return

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', this.currentUser.id)

      if (error) throw error

      this.userPermissions = data || []
    } catch (error) {
      console.error('Error loading user permissions:', error)
    }
  }

  // Log user activity for audit trail
  private async logUserActivity(action: string, description: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.currentUser || !this.currentOrganization) return

    try {
      await supabase
        .from('audit_logs')
        .insert({
          organization_id: this.currentOrganization.id,
          user_id: this.currentUser.id,
          action,
          entity_type: 'user_activity',
          entity_id: this.currentUser.id,
          metadata: {
            description,
            ...metadata
          }
        })
    } catch (error) {
      console.error('Error logging user activity:', error)
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User | null> {
    if (!this.currentUser) return null

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single()

      if (error) throw error

      this.currentUser = data as User

      // Log profile update
      await this.logUserActivity('profile_update', 'User profile updated', { updated_fields: Object.keys(updates) })

      return this.currentUser
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // Change password with security validation
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: this.currentUser?.email || '',
        password: currentPassword
      })

      if (verifyError) throw new Error('Current password is incorrect')

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Log password change
      await this.logUserActivity('password_change', 'User password changed')
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  // Get user sessions for security monitoring
  async getUserSessions(): Promise<any[]> {
    if (!this.currentUser) return []

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get user sessions error:', error)
      return []
    }
  }

  // Revoke session for security
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      // Log session revocation
      await this.logUserActivity('session_revoked', 'User session revoked', { session_id: sessionId })
    } catch (error) {
      console.error('Revoke session error:', error)
      throw error
    }
  }

  // Get audit logs for user
  async getAuditLogs(limit = 50, offset = 0): Promise<any[]> {
    if (!this.currentUser || !this.currentOrganization) return []

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', this.currentOrganization.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get audit logs error:', error)
      return []
    }
  }

  // Initialize auth state
  async initialize(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Load user and organization data
        const { data: profile, error } = await supabase
          .from('users')
          .select(`
            *,
            organizations (*)
          `)
          .eq('id', session.user.id)
          .single()

        if (!error && profile) {
          this.currentUser = profile as User
          this.currentOrganization = profile.organizations as Organization
          await this.loadUserPermissions()
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()
