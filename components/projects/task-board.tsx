"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Circle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { Task, TaskStatus, TaskPriority, User as UserType } from "@/lib/types"

const TASK_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-gray-100 text-gray-800" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100 text-blue-800" },
  { id: "review", title: "Review", color: "bg-yellow-100 text-yellow-800" },
  { id: "done", title: "Done", color: "bg-green-100 text-green-800" },
]

interface TaskBoardProps {
  projectId: string
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    due_date: "",
    estimated_hours: "",
    assigned_to: ""
  })
  const { userData } = useAuth()

  useEffect(() => {
    if (userData?.workspace_id && projectId) {
      fetchTasks()
      fetchUsers()
    }
  }, [userData, projectId])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          project:projects(name)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("workspace_id", userData?.workspace_id)
        .eq("is_active", true)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId as TaskStatus

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", draggableId)

      if (error) throw error

      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === draggableId 
            ? { ...task, status: newStatus }
            : task
        )
      )

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: userData?.workspace_id,
        user_id: userData?.id,
        entity_type: "task",
        entity_id: draggableId,
        action: "status_changed",
        details: { new_status: newStatus }
      })
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        project_id: projectId,
        workspace_id: userData?.workspace_id,
        created_by: userData?.id,
        status: "todo" as TaskStatus,
        estimated_hours: newTask.estimated_hours ? Number.parseInt(newTask.estimated_hours) : null,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select(`
          *,
          project:projects(name)
        `)
        .single()

      if (error) throw error

      setTasks(prev => [data, ...prev])
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        estimated_hours: "",
        assigned_to: ""
      })
      setNewTaskOpen(false)

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: userData?.workspace_id,
        user_id: userData?.id,
        entity_type: "task",
        entity_id: data.id,
        action: "created",
        details: { title: data.title }
      })
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)

      if (error) throw error

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updates }
            : task
        )
      )

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: userData?.workspace_id,
        user_id: userData?.id,
        entity_type: "task",
        entity_id: taskId,
        action: "updated",
        details: updates
      })
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)

      if (error) throw error

      setTasks(prev => prev.filter(task => task.id !== taskId))

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: userData?.workspace_id,
        user_id: userData?.id,
        entity_type: "task",
        entity_id: taskId,
        action: "deleted"
      })
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case "high":
        return <Circle className="h-3 w-3 text-orange-500" />
      case "medium":
        return <Circle className="h-3 w-3 text-yellow-500" />
      case "low":
        return <Circle className="h-3 w-3 text-green-500" />
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId)
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_COLUMNS.map((column) => (
          <Card key={column.id}>
            <CardHeader>
              <CardTitle className="text-sm">{column.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
