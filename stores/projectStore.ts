import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Project, Task, TimeEntry, Milestone, ProjectStore } from '@/types'

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector((set, get) => ({
    projects: [],
    selectedProject: null,
    isLoading: false,
    error: undefined,

    fetchProjects: async (filters?: Record<string, any>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:clients(*),
            tasks (*),
            time_entries (*),
            milestones (*),
            files (*),
            comments (*)
          `)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (key === 'search') {
                query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`)
              } else if (key === 'status') {
                query = query.eq(key, value)
              } else if (key === 'client_id') {
                query = query.eq(key, value)
              } else if (key === 'assigned_to') {
                query = query.eq(key, value)
              } else if (key === 'priority') {
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
          projects: data || [],
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch projects',
          isLoading: false,
        })
        throw error
      }
    },

    fetchProject: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:clients(*),
            tasks (*),
            time_entries (*),
            milestones (*),
            files (*),
            comments (*)
          `)
          .eq('id', id)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set({
          selectedProject: data,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch project',
          isLoading: false,
        })
        throw error
      }
    },

    createProject: async (data: Partial<Project>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            ...data,
            organization_id: useAuthStore.getState().organization?.id,
            status: data.status || 'planning',
            priority: data.priority || 'medium',
            progress: data.progress || 0,
            currency: data.currency || 'USD',
            tags: data.tags || [],
            custom_fields: data.custom_fields || {},
            tasks: data.tasks || [],
            time_entries: data.time_entries || [],
            milestones: data.milestones || [],
            files: data.files || [],
            comments: data.comments || [],
          })
          .select(`
            *,
            client:clients(*),
            tasks (*),
            time_entries (*),
            milestones (*),
            files (*),
            comments (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          projects: [newProject, ...state.projects],
          selectedProject: newProject,
          isLoading: false,
        }))

        return newProject
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create project',
          isLoading: false,
        })
        throw error
      }
    },

    updateProject: async (id: string, data: Partial<Project>) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data: updatedProject, error } = await supabase
          .from('projects')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            client:clients(*),
            tasks (*),
            time_entries (*),
            milestones (*),
            files (*),
            comments (*)
          `)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? updatedProject : project
          ),
          selectedProject: state.selectedProject?.id === id ? updatedProject : state.selectedProject,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update project',
          isLoading: false,
        })
        throw error
      }
    },

    deleteProject: async (id: string) => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete project',
          isLoading: false,
        })
        throw error
      }
    },
  }))
)

// Helper functions for project operations
export const projectHelpers = {
  // Get project by ID
  getProjectById: (id: string) => {
    return useProjectStore.getState().projects.find((project) => project.id === id)
  },

  // Get projects by status
  getProjectsByStatus: (status: string) => {
    return useProjectStore.getState().projects.filter((project) => project.status === status)
  },

  // Get projects by client
  getProjectsByClient: (clientId: string) => {
    return useProjectStore.getState().projects.filter((project) => project.client_id === clientId)
  },

  // Get projects by assigned user
  getProjectsByAssignee: (userId: string) => {
    return useProjectStore.getState().projects.filter((project) => project.assigned_to === userId)
  },

  // Search projects
  searchProjects: (query: string) => {
    const projects = useProjectStore.getState().projects
    const searchTerm = query.toLowerCase()
    
    return projects.filter((project) =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description?.toLowerCase().includes(searchTerm)
    )
  },

  // Get project statistics
  getProjectStats: () => {
    const projects = useProjectStore.getState().projects
    
    return {
      total: projects.length,
      planning: projects.filter((p) => p.status === 'planning').length,
      active: projects.filter((p) => p.status === 'active').length,
      onHold: projects.filter((p) => p.status === 'on_hold').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      cancelled: projects.filter((p) => p.status === 'cancelled').length,
      totalBudget: projects.reduce((sum, project) => sum + (project.budget || 0), 0),
      averageProgress: projects.length > 0 
        ? projects.reduce((sum, project) => sum + project.progress, 0) / projects.length 
        : 0,
    }
  },

  // Get recent projects
  getRecentProjects: (limit: number = 5) => {
    return useProjectStore.getState().projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  },

  // Get overdue projects
  getOverdueProjects: () => {
    const now = new Date()
    return useProjectStore.getState().projects.filter((project) =>
      project.end_date && new Date(project.end_date) < now && project.status !== 'completed'
    )
  },

  // Get projects by priority
  getProjectsByPriority: (priority: string) => {
    return useProjectStore.getState().projects.filter((project) => project.priority === priority)
  },

  // Get projects with low progress
  getProjectsWithLowProgress: (threshold: number = 25) => {
    return useProjectStore.getState().projects.filter((project) =>
      project.progress < threshold && project.status === 'active'
    )
  },

  // Get projects by tag
  getProjectsByTag: (tag: string) => {
    return useProjectStore.getState().projects.filter((project) =>
      project.tags?.includes(tag)
    )
  },

  // Get all unique tags
  getAllTags: () => {
    const projects = useProjectStore.getState().projects
    const allTags = projects.flatMap((project) => project.tags || [])
    return [...new Set(allTags)]
  },

  // Calculate project progress
  calculateProjectProgress: (projectId: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    if (!project || !project.tasks || project.tasks.length === 0) return 0
    
    const completedTasks = project.tasks.filter((task) => task.status === 'done').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  },

  // Get project timeline
  getProjectTimeline: (projectId: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    if (!project) return []
    
    const timeline = []
    
    if (project.start_date) {
      timeline.push({
        date: project.start_date,
        type: 'start',
        label: 'Project Started',
      })
    }
    
    if (project.milestones) {
      project.milestones.forEach((milestone) => {
        timeline.push({
          date: milestone.due_date,
          type: 'milestone',
          label: milestone.name,
          completed: milestone.completed,
        })
      })
    }
    
    if (project.end_date) {
      timeline.push({
        date: project.end_date,
        type: 'end',
        label: 'Project Due',
      })
    }
    
    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },

  // Get project time tracking summary
  getProjectTimeSummary: (projectId: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    if (!project || !project.time_entries) return { total: 0, billable: 0, nonBillable: 0 }
    
    const timeEntries = project.time_entries
    const total = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billable = timeEntries
      .filter((entry) => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const nonBillable = total - billable
    
    return { total, billable, nonBillable }
  },

  // Get project cost summary
  getProjectCostSummary: (projectId: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    if (!project) return { budget: 0, spent: 0, remaining: 0 }
    
    const budget = project.budget || 0
    const timeSummary = projectHelpers.getProjectTimeSummary(projectId)
    const spent = timeSummary.billable * (project.hourly_rate || 0)
    const remaining = budget - spent
    
    return { budget, spent, remaining }
  },
}

// Task management functions
export const taskHelpers = {
  // Create a new task
  createTask: async (projectId: string, taskData: Partial<Task>) => {
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        project_id: projectId,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        subtasks: taskData.subtasks || [],
        time_entries: taskData.time_entries || [],
        comments: taskData.comments || [],
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return newTask
  },

  // Update a task
  updateTask: async (taskId: string, taskData: Partial<Task>) => {
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return updatedTask
  },

  // Delete a task
  deleteTask: async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw new Error(error.message)
  },

  // Get tasks by status
  getTasksByStatus: (projectId: string, status: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    return project?.tasks?.filter((task) => task.status === status) || []
  },

  // Get tasks by assignee
  getTasksByAssignee: (projectId: string, userId: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    return project?.tasks?.filter((task) => task.assigned_to === userId) || []
  },

  // Get overdue tasks
  getOverdueTasks: (projectId: string) => {
    const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
    const now = new Date()
    return project?.tasks?.filter((task) =>
      task.due_date && new Date(task.due_date) < now && task.status !== 'done'
    ) || []
  },
}

// Time tracking functions
export const timeTrackingHelpers = {
  // Start time tracking
  startTimeTracking: async (projectId: string, taskId: string, description: string) => {
    const { data: timeEntry, error } = await supabase
      .from('time_entries')
      .insert({
        project_id: projectId,
        task_id: taskId,
        user_id: useAuthStore.getState().user?.id,
        description,
        start_time: new Date().toISOString(),
        billable: true,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return timeEntry
  },

  // Stop time tracking
  stopTimeTracking: async (timeEntryId: string) => {
    const endTime = new Date()
    const { data: timeEntry, error } = await supabase
      .from('time_entries')
      .update({
        end_time: endTime.toISOString(),
        duration: endTime.getTime() - new Date(timeEntry.start_time).getTime(),
      })
      .eq('id', timeEntryId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return timeEntry
  },

  // Get time entries for a project
  getTimeEntries: async (projectId: string) => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('start_time', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  // Get time entries for a task
  getTaskTimeEntries: async (taskId: string) => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },
}