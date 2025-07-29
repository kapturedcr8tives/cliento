import { supabase } from './supabase'
import { authService } from './auth'

// Workflow automation types
export interface Workflow {
  id: string
  organization_id: string
  name: string
  description?: string
  trigger_type: 'lead_created' | 'lead_updated' | 'contact_created' | 'task_completed' | 'email_received' | 'manual'
  trigger_conditions: Record<string, any>
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  workflow_id: string
  name: string
  step_type: 'send_email' | 'create_task' | 'update_record' | 'send_notification' | 'wait' | 'condition'
  step_order: number
  configuration: Record<string, any>
  is_active: boolean
  created_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  trigger_entity_type: string
  trigger_entity_id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  current_step_id?: string
  execution_data: Record<string, any>
  started_at: string
  completed_at?: string
  error_message?: string
}

export interface EmailTemplate {
  id: string
  organization_id: string
  name: string
  subject: string
  body: string
  variables: Record<string, any>
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// Workflow automation service
export class WorkflowAutomationService {
  private static instance: WorkflowAutomationService

  private constructor() {}

  static getInstance(): WorkflowAutomationService {
    if (!WorkflowAutomationService.instance) {
      WorkflowAutomationService.instance = new WorkflowAutomationService()
    }
    return WorkflowAutomationService.instance
  }

  // Get workflows
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_steps (*)
        `)
        .eq('organization_id', authService.getCurrentOrganization()?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching workflows:', error)
      return []
    }
  }

  // Create workflow
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>, steps: Omit<WorkflowStep, 'id' | 'workflow_id' | 'created_at'>[]): Promise<Workflow | null> {
    try {
      // Create workflow
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          ...workflow,
          organization_id: authService.getCurrentOrganization()?.id,
          created_by: authService.getCurrentUser()?.id
        })
        .select()
        .single()

      if (workflowError) throw workflowError

      // Create workflow steps
      if (steps.length > 0) {
        const stepsWithWorkflowId = steps.map(step => ({
          ...step,
          workflow_id: workflowData.id
        }))

        const { error: stepsError } = await supabase
          .from('workflow_steps')
          .insert(stepsWithWorkflowId)

        if (stepsError) throw stepsError
      }

      return workflowData
    } catch (error) {
      console.error('Error creating workflow:', error)
      return null
    }
  }

  // Update workflow
  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating workflow:', error)
      return null
    }
  }

  // Delete workflow
  async deleteWorkflow(id: string): Promise<void> {
    try {
      // Delete workflow steps first
      await supabase
        .from('workflow_steps')
        .delete()
        .eq('workflow_id', id)

      // Delete workflow
      await supabase
        .from('workflows')
        .delete()
        .eq('id', id)
    } catch (error) {
      console.error('Error deleting workflow:', error)
      throw error
    }
  }

  // Get workflow steps
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('is_active', true)
        .order('step_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching workflow steps:', error)
      return []
    }
  }

  // Add workflow step
  async addWorkflowStep(step: Omit<WorkflowStep, 'id' | 'created_at'>): Promise<WorkflowStep | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .insert(step)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding workflow step:', error)
      return null
    }
  }

  // Update workflow step
  async updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating workflow step:', error)
      return null
    }
  }

  // Delete workflow step
  async deleteWorkflowStep(id: string): Promise<void> {
    try {
      await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', id)
    } catch (error) {
      console.error('Error deleting workflow step:', error)
      throw error
    }
  }

  // Execute workflow
  async executeWorkflow(workflowId: string, triggerData: {
    entity_type: string
    entity_id: string
    data: Record<string, any>
  }): Promise<WorkflowExecution | null> {
    try {
      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          trigger_entity_type: triggerData.entity_type,
          trigger_entity_id: triggerData.entity_id,
          status: 'running',
          execution_data: triggerData.data
        })
        .select()
        .single()

      if (executionError) throw executionError

      // Get workflow steps
      const steps = await this.getWorkflowSteps(workflowId)
      if (steps.length === 0) {
        await this.updateExecutionStatus(execution.id, 'completed')
        return execution
      }

      // Execute steps
      await this.executeSteps(execution.id, steps, triggerData.data)

      return execution
    } catch (error) {
      console.error('Error executing workflow:', error)
      return null
    }
  }

  // Execute workflow steps
  private async executeSteps(executionId: string, steps: WorkflowStep[], context: Record<string, any>): Promise<void> {
    try {
      for (const step of steps) {
        // Update current step
        await this.updateExecutionCurrentStep(executionId, step.id)

        // Execute step
        const result = await this.executeStep(step, context)
        
        if (!result.success) {
          await this.updateExecutionStatus(executionId, 'failed', result.error)
          return
        }

        // Update context with step result
        context = { ...context, ...result.data }
      }

      // Mark execution as completed
      await this.updateExecutionStatus(executionId, 'completed')
    } catch (error) {
      console.error('Error executing workflow steps:', error)
      await this.updateExecutionStatus(executionId, 'failed', error.message)
    }
  }

  // Execute single step
  private async executeStep(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      switch (step.step_type) {
        case 'send_email':
          return await this.executeSendEmail(step, context)

        case 'create_task':
          return await this.executeCreateTask(step, context)

        case 'update_record':
          return await this.executeUpdateRecord(step, context)

        case 'send_notification':
          return await this.executeSendNotification(step, context)

        case 'wait':
          return await this.executeWait(step, context)

        case 'condition':
          return await this.executeCondition(step, context)

        default:
          return { success: false, error: `Unknown step type: ${step.step_type}` }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Execute send email step
  private async executeSendEmail(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const { template_id, recipient, subject, body } = step.configuration

      // Get email template
      const template = await this.getEmailTemplate(template_id)
      if (!template) {
        return { success: false, error: 'Email template not found' }
      }

      // Replace variables in template
      const processedSubject = this.replaceVariables(template.subject, context)
      const processedBody = this.replaceVariables(template.body, context)

      // Send email (implement your email service here)
      // await emailService.send(recipient, processedSubject, processedBody)

      return { 
        success: true, 
        data: { 
          email_sent: true, 
          recipient, 
          subject: processedSubject 
        } 
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Execute create task step
  private async executeCreateTask(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const { title, description, assigned_to, due_date, project_id } = step.configuration

      const taskData = {
        title: this.replaceVariables(title, context),
        description: this.replaceVariables(description, context),
        assigned_to,
        due_date: due_date ? new Date(due_date) : null,
        project_id,
        organization_id: authService.getCurrentOrganization()?.id,
        created_by: authService.getCurrentUser()?.id
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (error) throw error

      return { 
        success: true, 
        data: { 
          task_created: true, 
          task_id: data.id 
        } 
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Execute update record step
  private async executeUpdateRecord(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const { table, record_id, updates } = step.configuration

      const processedUpdates = Object.keys(updates).reduce((acc, key) => {
        acc[key] = this.replaceVariables(updates[key], context)
        return acc
      }, {} as Record<string, any>)

      const { error } = await supabase
        .from(table)
        .update(processedUpdates)
        .eq('id', record_id)

      if (error) throw error

      return { 
        success: true, 
        data: { 
          record_updated: true, 
          table, 
          record_id 
        } 
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Execute send notification step
  private async executeSendNotification(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const { user_id, title, message, type, action_url } = step.configuration

      const notificationData = {
        organization_id: authService.getCurrentOrganization()?.id,
        user_id,
        title: this.replaceVariables(title, context),
        message: this.replaceVariables(message, context),
        type: type || 'info',
        action_url: action_url ? this.replaceVariables(action_url, context) : null
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) throw error

      return { 
        success: true, 
        data: { 
          notification_sent: true, 
          notification_id: data.id 
        } 
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Execute wait step
  private async executeWait(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const { duration_minutes } = step.configuration

      // For now, we'll simulate waiting
      // In a real implementation, you might use a job queue or setTimeout
      await new Promise(resolve => setTimeout(resolve, duration_minutes * 60 * 1000))

      return { 
        success: true, 
        data: { 
          waited_minutes: duration_minutes 
        } 
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Execute condition step
  private async executeCondition(step: WorkflowStep, context: Record<string, any>): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const { condition, operator, value } = step.configuration

      const contextValue = this.getNestedValue(context, condition)
      let result = false

      switch (operator) {
        case 'equals':
          result = contextValue == value
          break
        case 'not_equals':
          result = contextValue != value
          break
        case 'greater_than':
          result = contextValue > value
          break
        case 'less_than':
          result = contextValue < value
          break
        case 'contains':
          result = String(contextValue).includes(String(value))
          break
        case 'not_contains':
          result = !String(contextValue).includes(String(value))
          break
        default:
          return { success: false, error: `Unknown operator: ${operator}` }
      }

      return { 
        success: true, 
        data: { 
          condition_result: result 
        } 
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get email templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', authService.getCurrentOrganization()?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching email templates:', error)
      return []
    }
  }

  // Get single email template
  async getEmailTemplate(id: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching email template:', error)
      return null
    }
  }

  // Create email template
  async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...template,
          organization_id: authService.getCurrentOrganization()?.id,
          created_by: authService.getCurrentUser()?.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating email template:', error)
      return null
    }
  }

  // Update email template
  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating email template:', error)
      return null
    }
  }

  // Get workflow executions
  async getWorkflowExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    try {
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId || '')
        .order('started_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching workflow executions:', error)
      return []
    }
  }

  // Update execution status
  private async updateExecutionStatus(executionId: string, status: string, errorMessage?: string): Promise<void> {
    try {
      await supabase
        .from('workflow_executions')
        .update({
          status,
          completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
          error_message: errorMessage
        })
        .eq('id', executionId)
    } catch (error) {
      console.error('Error updating execution status:', error)
    }
  }

  // Update execution current step
  private async updateExecutionCurrentStep(executionId: string, stepId: string): Promise<void> {
    try {
      await supabase
        .from('workflow_executions')
        .update({ current_step_id: stepId })
        .eq('id', executionId)
    } catch (error) {
      console.error('Error updating execution current step:', error)
    }
  }

  // Replace variables in template
  private replaceVariables(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(context, key)
      return value !== undefined ? String(value) : match
    })
  }

  // Get nested value from object
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Trigger workflow by event
  async triggerWorkflow(triggerType: string, entityType: string, entityId: string, data: Record<string, any>): Promise<void> {
    try {
      // Find matching workflows
      const workflows = await this.getWorkflows()
      const matchingWorkflows = workflows.filter(workflow => 
        workflow.trigger_type === triggerType && 
        workflow.is_active
      )

      // Execute matching workflows
      for (const workflow of matchingWorkflows) {
        // Check trigger conditions
        if (this.evaluateTriggerConditions(workflow.trigger_conditions, data)) {
          await this.executeWorkflow(workflow.id, {
            entity_type: entityType,
            entity_id: entityId,
            data
          })
        }
      }
    } catch (error) {
      console.error('Error triggering workflow:', error)
    }
  }

  // Evaluate trigger conditions
  private evaluateTriggerConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true
    }

    for (const [field, condition] of Object.entries(conditions)) {
      const value = this.getNestedValue(data, field)
      
      if (condition.operator === 'equals' && value !== condition.value) {
        return false
      }
      if (condition.operator === 'not_equals' && value === condition.value) {
        return false
      }
      if (condition.operator === 'contains' && !String(value).includes(String(condition.value))) {
        return false
      }
      if (condition.operator === 'greater_than' && value <= condition.value) {
        return false
      }
      if (condition.operator === 'less_than' && value >= condition.value) {
        return false
      }
    }

    return true
  }
}

// Export singleton instance
export const workflowAutomationService = WorkflowAutomationService.getInstance()