-- Enterprise CRM Database Schema
-- Advanced features for enterprise-grade CRM

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ORGANIZATION & MULTI-TENANCY
-- ============================================================================

-- Organizations table for multi-tenant architecture
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50) CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    website VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    logo_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED USER MANAGEMENT WITH RBAC
-- ============================================================================

-- Enhanced users table with organization support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer')),
    avatar_url TEXT,
    phone VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions for granular access control
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource, action)
);

-- User sessions for security tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADVANCED CONTACT MANAGEMENT
-- ============================================================================

-- Enhanced contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    linkedin_url TEXT,
    twitter_url TEXT,
    facebook_url TEXT,
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    birthday DATE,
    notes TEXT,
    tags TEXT[],
    lead_score INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    contact_frequency VARCHAR(50) DEFAULT 'monthly',
    preferred_contact_method VARCHAR(50) DEFAULT 'email',
    social_media_handles JSONB,
    custom_fields JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact interactions for comprehensive history
CREATE TABLE contact_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('email', 'call', 'meeting', 'note', 'task', 'social', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    outcome VARCHAR(100),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADVANCED SALES PIPELINE
-- ============================================================================

-- Sales pipeline stages
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced leads table with advanced scoring
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    pipeline_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source VARCHAR(100),
    source_details JSONB,
    value DECIMAL(12, 2),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    lost_reason TEXT,
    tags TEXT[],
    lead_score INTEGER DEFAULT 0,
    lead_score_factors JSONB,
    custom_fields JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead scoring criteria
CREATE TABLE lead_scoring_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria_type VARCHAR(50) NOT NULL CHECK (criteria_type IN ('company_size', 'industry', 'budget', 'timeline', 'authority', 'need')),
    field_name VARCHAR(100),
    condition_type VARCHAR(50) CHECK (condition_type IN ('equals', 'contains', 'greater_than', 'less_than', 'in_list')),
    condition_value TEXT,
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table for advanced sales tracking
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    pipeline_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12, 2) NOT NULL,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    close_reason TEXT,
    loss_reason TEXT,
    competitor VARCHAR(100),
    tags TEXT[],
    custom_fields JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROJECT & TASK MANAGEMENT
-- ============================================================================

-- Enhanced projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_members UUID[],
    tags TEXT[],
    custom_fields JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    start_date DATE,
    completed_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2) DEFAULT 0,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependencies UUID[],
    tags TEXT[],
    custom_fields JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW AUTOMATION
-- ============================================================================

-- Workflow definitions
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('lead_created', 'lead_updated', 'contact_created', 'task_completed', 'email_received', 'manual')),
    trigger_conditions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow steps
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('send_email', 'create_task', 'update_record', 'send_notification', 'wait', 'condition')),
    step_order INTEGER NOT NULL,
    configuration JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_entity_type VARCHAR(50) NOT NULL,
    trigger_entity_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    current_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    execution_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'urgent')),
    entity_type VARCHAR(50),
    entity_id UUID,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates for notifications
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOGGING SYSTEM
-- ============================================================================

-- Comprehensive audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REPORTING & ANALYTICS
-- ============================================================================

-- Custom reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('sales', 'leads', 'projects', 'tasks', 'revenue', 'custom')),
    configuration JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report schedules
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    recipients TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CUSTOM FIELDS SYSTEM
-- ============================================================================

-- Custom field definitions
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lead', 'contact', 'company', 'project', 'task')),
    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'email', 'phone', 'date', 'select', 'multiselect', 'checkbox', 'url')),
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    is_unique BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_rules JSONB,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom field values
CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(custom_field_id, entity_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_workflows_organization_id ON workflows(organization_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_reports_organization_id ON reports(organization_id);
CREATE INDEX idx_custom_fields_organization_id ON custom_fields(organization_id);

-- User and assignment indexes
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX idx_projects_project_manager_id ON projects(project_manager_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Status and date indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_expected_close_date ON leads(expected_close_date);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Pipeline and stage indexes
CREATE INDEX idx_leads_pipeline_stage_id ON leads(pipeline_stage_id);
CREATE INDEX idx_opportunities_pipeline_stage_id ON opportunities(pipeline_stage_id);

-- Audit and notification indexes
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            organization_id,
            user_id,
            action,
            entity_type,
            entity_id,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            NEW.organization_id,
            current_setting('app.current_user_id')::UUID,
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW),
            inet_client_addr(),
            current_setting('app.user_agent', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            organization_id,
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            NEW.organization_id,
            current_setting('app.current_user_id')::UUID,
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            inet_client_addr(),
            current_setting('app.user_agent', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            organization_id,
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            ip_address,
            user_agent
        ) VALUES (
            OLD.organization_id,
            current_setting('app.current_user_id')::UUID,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            inet_client_addr(),
            current_setting('app.user_agent', true)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_leads_changes AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER audit_opportunities_changes AFTER INSERT OR UPDATE OR DELETE ON opportunities FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER audit_contacts_changes AFTER INSERT OR UPDATE OR DELETE ON contacts FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER audit_projects_changes AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER audit_tasks_changes AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for organization-scoped tables
CREATE POLICY "Users can view organization data" ON contacts
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view organization data" ON leads
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view organization data" ON opportunities
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view organization data" ON projects
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view organization data" ON tasks
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view own notifications" ON notifications
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can view organization audit logs" ON audit_logs
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view organization reports" ON reports
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY "Users can view organization workflows" ON workflows
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER := 0;
    criteria RECORD;
BEGIN
    FOR criteria IN 
        SELECT * FROM lead_scoring_criteria 
        WHERE organization_id = (
            SELECT organization_id FROM leads WHERE id = lead_id
        ) AND is_active = true
    LOOP
        -- Add scoring logic based on criteria
        total_score := total_score + criteria.points;
    END LOOP;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update lead score
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_score := calculate_lead_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lead score
CREATE TRIGGER trigger_update_lead_score
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        organization_id,
        user_id,
        title,
        message,
        type,
        entity_type,
        entity_id,
        action_url
    ) VALUES (
        (SELECT organization_id FROM users WHERE id = p_user_id),
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_entity_type,
        p_entity_id,
        p_action_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default pipeline stages
INSERT INTO pipeline_stages (organization_id, name, description, color, probability, sort_order) VALUES
(NULL, 'New Lead', 'Initial contact or lead creation', '#3B82F6', 10, 1),
(NULL, 'Qualified', 'Lead has been qualified', '#10B981', 25, 2),
(NULL, 'Proposal', 'Proposal sent to prospect', '#F59E0B', 50, 3),
(NULL, 'Negotiation', 'In negotiation phase', '#EF4444', 75, 4),
(NULL, 'Closed Won', 'Deal successfully closed', '#059669', 100, 5),
(NULL, 'Closed Lost', 'Deal lost', '#6B7280', 0, 6);

-- Insert default lead scoring criteria
INSERT INTO lead_scoring_criteria (organization_id, name, description, criteria_type, field_name, condition_type, condition_value, points) VALUES
(NULL, 'Large Company', 'Company size is large or enterprise', 'company_size', 'size', 'in_list', 'large,enterprise', 20),
(NULL, 'High Budget', 'Budget is over $50k', 'budget', 'value', 'greater_than', '50000', 15),
(NULL, 'Urgent Timeline', 'Timeline is within 3 months', 'timeline', 'expected_close_date', 'less_than', '3 months', 10),
(NULL, 'Decision Maker', 'Contact is C-level or VP', 'authority', 'job_title', 'contains', 'CEO,CTO,VP,Director', 25),
(NULL, 'High Need', 'Clear pain point identified', 'need', 'description', 'contains', 'problem,issue,challenge', 15),
(NULL, 'Referral Source', 'Lead came from referral', 'source', 'source', 'equals', 'referral', 10);