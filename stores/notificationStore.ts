import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Notification, NotificationStore } from '@/types'

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: undefined,

    fetchNotifications: async () => {
      set({ isLoading: true, error: undefined })
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', useAuthStore.getState().user?.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          throw new Error(error.message)
        }

        const unreadCount = data?.filter((notification) => !notification.read).length || 0

        set({
          notifications: data || [],
          unreadCount,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch notifications',
          isLoading: false,
        })
        throw error
      }
    },

    markAsRead: async (id: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', id)

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true, read_at: new Date().toISOString() } : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to mark notification as read',
        })
        throw error
      }
    },

    markAllAsRead: async () => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('user_id', useAuthStore.getState().user?.id)
          .eq('read', false)

        if (error) {
          throw new Error(error.message)
        }

        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
            read_at: new Date().toISOString(),
          })),
          unreadCount: 0,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
        })
        throw error
      }
    },

    deleteNotification: async (id: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error(error.message)
        }

        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          return {
            notifications: state.notifications.filter((notification) => notification.id !== id),
            unreadCount: notification?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
          }
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete notification',
        })
        throw error
      }
    },

    addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      }

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }))
    },

    clearError: () => {
      set({ error: undefined })
    },
  }))
)

// Helper functions for notification operations
export const notificationHelpers = {
  // Create a notification
  createNotification: async (
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return notification
  },

  // Get notifications by type
  getNotificationsByType: (type: string) => {
    return useNotificationStore.getState().notifications.filter((notification) => notification.type === type)
  },

  // Get unread notifications
  getUnreadNotifications: () => {
    return useNotificationStore.getState().notifications.filter((notification) => !notification.read)
  },

  // Get recent notifications
  getRecentNotifications: (limit: number = 10) => {
    return useNotificationStore.getState().notifications.slice(0, limit)
  },

  // Get notification statistics
  getNotificationStats: () => {
    const notifications = useNotificationStore.getState().notifications
    
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      read: notifications.filter((n) => n.read).length,
      byType: notifications.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  },

  // Format notification message
  formatNotificationMessage: (notification: Notification) => {
    const timeAgo = getTimeAgo(new Date(notification.created_at))
    return {
      ...notification,
      timeAgo,
      isRecent: new Date(notification.created_at).getTime() > Date.now() - 5 * 60 * 1000, // 5 minutes
    }
  },

  // Get notification icon
  getNotificationIcon: (type: string) => {
    const icons = {
      invoice_paid: '💰',
      invoice_overdue: '⚠️',
      project_milestone: '🎯',
      task_assigned: '📋',
      client_message: '💬',
      proposal_viewed: '👁️',
      contract_signed: '✍️',
      system_alert: '🔔',
    }
    return icons[type as keyof typeof icons] || '📢'
  },

  // Get notification color
  getNotificationColor: (type: string) => {
    const colors = {
      invoice_paid: 'text-green-600 bg-green-50',
      invoice_overdue: 'text-red-600 bg-red-50',
      project_milestone: 'text-blue-600 bg-blue-50',
      task_assigned: 'text-orange-600 bg-orange-50',
      client_message: 'text-purple-600 bg-purple-50',
      proposal_viewed: 'text-indigo-600 bg-indigo-50',
      contract_signed: 'text-emerald-600 bg-emerald-50',
      system_alert: 'text-gray-600 bg-gray-50',
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50'
  },
}

// Time ago helper
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} month${months > 1 ? 's' : ''} ago`
  }
}

// Notification hooks
export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearError,
  } = useNotificationStore()

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearError,
    helpers: notificationHelpers,
  }
}

// Real-time notification subscription
export const subscribeToNotifications = (userId: string) => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newNotification = payload.new as Notification
        useNotificationStore.getState().addNotification(newNotification)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const updatedNotification = payload.new as Notification
        useNotificationStore.setState((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === updatedNotification.id ? updatedNotification : notification
          ),
        }))
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Notification templates
export const notificationTemplates = {
  invoicePaid: (invoiceNumber: string, amount: number) => ({
    type: 'invoice_paid' as const,
    title: 'Invoice Paid',
    message: `Invoice ${invoiceNumber} has been paid for $${amount.toFixed(2)}`,
    data: { invoiceNumber, amount },
  }),

  invoiceOverdue: (invoiceNumber: string, daysOverdue: number) => ({
    type: 'invoice_overdue' as const,
    title: 'Invoice Overdue',
    message: `Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
    data: { invoiceNumber, daysOverdue },
  }),

  projectMilestone: (projectName: string, milestoneName: string) => ({
    type: 'project_milestone' as const,
    title: 'Project Milestone',
    message: `Milestone "${milestoneName}" completed for project "${projectName}"`,
    data: { projectName, milestoneName },
  }),

  taskAssigned: (taskName: string, projectName: string) => ({
    type: 'task_assigned' as const,
    title: 'Task Assigned',
    message: `You have been assigned task "${taskName}" in project "${projectName}"`,
    data: { taskName, projectName },
  }),

  clientMessage: (clientName: string, messagePreview: string) => ({
    type: 'client_message' as const,
    title: 'Client Message',
    message: `New message from ${clientName}: ${messagePreview}`,
    data: { clientName, messagePreview },
  }),

  proposalViewed: (proposalTitle: string, clientName: string) => ({
    type: 'proposal_viewed' as const,
    title: 'Proposal Viewed',
    message: `Proposal "${proposalTitle}" was viewed by ${clientName}`,
    data: { proposalTitle, clientName },
  }),

  contractSigned: (contractTitle: string, clientName: string) => ({
    type: 'contract_signed' as const,
    title: 'Contract Signed',
    message: `Contract "${contractTitle}" has been signed by ${clientName}`,
    data: { contractTitle, clientName },
  }),

  systemAlert: (title: string, message: string) => ({
    type: 'system_alert' as const,
    title,
    message,
    data: { title, message },
  }),
}