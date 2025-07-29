import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Organization, AuthStore, RegisterData } from '@/types'

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    organization: null,
    isAuthenticated: false,
    isLoading: false,
    error: undefined,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw new Error(error.message)
        }

        if (data.user) {
          // Fetch user profile and organization
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          const { data: organization } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userProfile?.organization_id)
            .single()

          set({
            user: userProfile || data.user,
            organization,
            isAuthenticated: true,
            isLoading: false,
          })
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Login failed',
          isLoading: false,
        })
        throw error
      }
    },

    logout: async () => {
      set({ isLoading: true })
      
      try {
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          throw new Error(error.message)
        }

        set({
          user: null,
          organization: null,
          isAuthenticated: false,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Logout failed',
          isLoading: false,
        })
        throw error
      }
    },

    register: async (data: RegisterData) => {
      set({ isLoading: true, error: undefined })
      
      try {
        // Create organization first
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: data.organization_name,
            slug: data.organization_slug,
            subscription_tier: 'free',
            subscription_status: 'active',
            settings: {
              branding: {
                primary_color: '#2563eb',
                company_name: data.organization_name,
              },
              integrations: {},
              features: {
                advanced_analytics: false,
                workflow_automation: false,
                client_portal: false,
                api_access: false,
                white_label: false,
                custom_integrations: false,
              },
              security: {
                two_factor_required: false,
                session_timeout: 24,
                password_policy: {
                  min_length: 8,
                  require_uppercase: true,
                  require_lowercase: true,
                  require_numbers: true,
                  require_special_chars: false,
                },
              },
            },
          })
          .select()
          .single()

        if (orgError) {
          throw new Error(orgError.message)
        }

        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              organization_id: organization.id,
            },
          },
        })

        if (authError) {
          throw new Error(authError.message)
        }

        if (authData.user) {
          // Create user profile
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: data.email,
              full_name: data.full_name,
              role: 'org_admin',
              organization_id: organization.id,
              is_active: true,
              preferences: {
                theme: 'system',
                language: 'en',
                timezone: 'UTC',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                  project_updates: true,
                  invoice_reminders: true,
                  client_messages: true,
                },
              },
            })
            .select()
            .single()

          if (profileError) {
            throw new Error(profileError.message)
          }

          set({
            user: userProfile,
            organization,
            isAuthenticated: true,
            isLoading: false,
          })
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Registration failed',
          isLoading: false,
        })
        throw error
      }
    },

    updateProfile: async (data: Partial<User>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(data)
          .eq('id', get().user?.id)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set({
          user: updatedUser,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Profile update failed',
          isLoading: false,
        })
        throw error
      }
    },
  }))
)

// Initialize auth state on app load
export const initializeAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    // Fetch user profile and organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userProfile?.organization_id)
      .single()

    useAuthStore.setState({
      user: userProfile || session.user,
      organization,
      isAuthenticated: true,
    })
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userProfile?.organization_id)
        .single()

      useAuthStore.setState({
        user: userProfile || session.user,
        organization,
        isAuthenticated: true,
      })
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({
        user: null,
        organization: null,
        isAuthenticated: false,
      })
    }
  })
}