-- Enhanced AI and analytics tables
CREATE TABLE IF NOT EXISTS lead_scoring_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    model_config JSONB NOT NULL,
    training_data JSONB,
    accuracy_score DECIMAL(5,4),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    template_data JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    template_a_id UUID REFERENCES proposal_templates(id),
    template_b_id UUID REFERENCES proposal_templates(id),
    traffic_split DECIMAL(3,2) DEFAULT 0.5,
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    results JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL, -- 'completion_date', 'budget_overrun', 'risk_score'
    predicted_value JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    model_version VARCHAR(50),
    factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'square'
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'invoice_reminder', 'proposal_followup', 'project_update'
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    properties JSONB,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced lead scoring function with ML-like features
CREATE OR REPLACE FUNCTION calculate_advanced_lead_score(
    lead_id UUID
) RETURNS JSONB AS $$
DECLARE
    lead_data RECORD;
    score_breakdown JSONB := '{}';
    final_score INTEGER := 0;
    demographic_score INTEGER := 0;
    behavioral_score INTEGER := 0;
    firmographic_score INTEGER := 0;
    engagement_score INTEGER := 0;
BEGIN
    -- Get lead data
    SELECT * INTO lead_data FROM leads WHERE id = lead_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "Lead not found"}';
    END IF;
    
    -- Demographic scoring (30% weight)
    IF lead_data.email IS NOT NULL THEN
        -- Email domain analysis
        IF lead_data.email LIKE '%@gmail.com' OR lead_data.email LIKE '%@yahoo.com' THEN
            demographic_score := demographic_score + 10;
        ELSIF lead_data.email LIKE '%@company.com' OR lead_data.email LIKE '%.org' THEN
            demographic_score := demographic_score + 25;
        ELSE
            demographic_score := demographic_score + 20;
        END IF;
    END IF;
    
    -- Phone number presence
    IF lead_data.phone IS NOT NULL THEN
        demographic_score := demographic_score + 15;
    END IF;
    
    -- Firmographic scoring (25% weight)
    IF lead_data.company IS NOT NULL AND LENGTH(lead_data.company) > 0 THEN
        firmographic_score := firmographic_score + 30;
        
        -- Company size estimation (basic keyword matching)
        IF lead_data.company ILIKE '%enterprise%' OR lead_data.company ILIKE '%corporation%' THEN
            firmographic_score := firmographic_score + 20;
        ELSIF lead_data.company ILIKE '%inc%' OR lead_data.company ILIKE '%llc%' THEN
            firmographic_score := firmographic_score + 15;
        END IF;
    END IF;
    
    -- Behavioral scoring (25% weight)
    CASE lead_data.source
        WHEN 'Referral' THEN behavioral_score := behavioral_score + 40;
        WHEN 'LinkedIn' THEN behavioral_score := behavioral_score + 30;
        WHEN 'Website Contact Form' THEN behavioral_score := behavioral_score + 25;
        WHEN 'Cold Outreach' THEN behavioral_score := behavioral_score + 10;
        ELSE behavioral_score := behavioral_score + 15;
    END CASE;
    
    -- Engagement scoring (20% weight)
    IF lead_data.expected_value IS NOT NULL THEN
        IF lead_data.expected_value > 100000 THEN
            engagement_score := engagement_score + 50;
        ELSIF lead_data.expected_value > 50000 THEN
            engagement_score := engagement_score + 35;
        ELSIF lead_data.expected_value > 25000 THEN
            engagement_score := engagement_score + 25;
        ELSIF lead_data.expected_value > 10000 THEN
            engagement_score := engagement_score + 15;
        ELSE
            engagement_score := engagement_score + 5;
        END IF;
    END IF;
    
    -- Notes sentiment analysis (basic)
    IF lead_data.notes IS NOT NULL THEN
        IF lead_data.notes ILIKE '%urgent%' OR lead_data.notes ILIKE '%asap%' THEN
            engagement_score := engagement_score + 20;
        END IF;
        
        IF lead_data.notes ILIKE '%interested%' OR lead_data.notes ILIKE '%excited%' THEN
            engagement_score := engagement_score + 15;
        END IF;
        
        IF lead_data.notes ILIKE '%budget approved%' OR lead_data.notes ILIKE '%ready to start%' THEN
            engagement_score := engagement_score + 25;
        END IF;
    END IF;
    
    -- Calculate weighted final score
    final_score := (demographic_score * 30 + firmographic_score * 25 + behavioral_score * 25 + engagement_score * 20) / 100;
    
    -- Ensure score is within bounds
    final_score := GREATEST(0, LEAST(100, final_score));
    
    -- Build score breakdown
    score_breakdown := jsonb_build_object(
        'final_score', final_score,
        'demographic_score', demographic_score,
        'firmographic_score', firmographic_score,
        'behavioral_score', behavioral_score,
        'engagement_score', engagement_score,
        'factors', jsonb_build_array(
            CASE WHEN demographic_score > 20 THEN 'Strong demographic profile' ELSE NULL END,
            CASE WHEN firmographic_score > 30 THEN 'Established company' ELSE NULL END,
            CASE WHEN behavioral_score > 25 THEN 'High-quality source' ELSE NULL END,
            CASE WHEN engagement_score > 30 THEN 'Strong engagement signals' ELSE NULL END
        ) - 'null'
    );
    
    RETURN score_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Project risk prediction function
CREATE OR REPLACE FUNCTION predict_project_risks(
    project_id UUID
) RETURNS JSONB AS $$
DECLARE
    project_data RECORD;
    task_stats RECORD;
    risk_factors JSONB := '[]';
    risk_score INTEGER := 0;
    predictions JSONB;
BEGIN
    -- Get project data
    SELECT * INTO project_data FROM projects WHERE id = project_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "Project not found"}';
    END IF;
    
    -- Get task statistics
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') as overdue_tasks,
        AVG(EXTRACT(DAY FROM NOW() - created_at)) as avg_task_age,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tasks
    INTO task_stats
    FROM tasks 
    WHERE project_id = predict_project_risks.project_id;
    
    -- Calculate completion percentage
    DECLARE
        completion_percentage DECIMAL := 0;
    BEGIN
        IF task_stats.total_tasks > 0 THEN
            completion_percentage := (task_stats.completed_tasks::DECIMAL / task_stats.total_tasks) * 100;
        END IF;
    END;
    
    -- Risk factor analysis
    
    -- Overdue tasks risk
    IF task_stats.overdue_tasks > 0 THEN
        risk_score := risk_score + (task_stats.overdue_tasks * 10);
        risk_factors := risk_factors || jsonb_build_object(
            'type', 'overdue_tasks',
            'severity', 'high',
            'description', format('%s overdue tasks detected', task_stats.overdue_tasks),
            'impact', task_stats.overdue_tasks * 10
        );
    END IF;
    
    -- Project timeline risk
    IF project_data.end_date IS NOT NULL AND project_data.end_date < NOW() THEN
        risk_score := risk_score + 30;
        risk_factors := risk_factors || jsonb_build_object(
            'type', 'timeline_overrun',
            'severity', 'critical',
            'description', 'Project has exceeded planned end date',
            'impact', 30
        );
    END IF;
    
    -- Low progress risk
    IF completion_percentage < 25 AND project_data.start_date IS NOT NULL 
       AND EXTRACT(DAY FROM NOW() - project_data.start_date) > 30 THEN
        risk_score := risk_score + 25;
        risk_factors := risk_factors || jsonb_build_object(
            'type', 'low_progress',
            'severity', 'high',
            'description', 'Low completion rate after significant time',
            'impact', 25
        );
    END IF;
    
    -- High urgent task ratio
    IF task_stats.total_tasks > 0 AND (task_stats.urgent_tasks::DECIMAL / task_stats.total_tasks) > 0.3 THEN
        risk_score := risk_score + 15;
        risk_factors := risk_factors || jsonb_build_object(
            'type', 'high_urgency',
            'severity', 'medium',
            'description', 'High ratio of urgent tasks indicates poor planning',
            'impact', 15
        );
    END IF;
    
    -- No tasks defined
    IF task_stats.total_tasks = 0 THEN
        risk_score := risk_score + 20;
        risk_factors := risk_factors || jsonb_build_object(
            'type', 'no_tasks',
            'severity', 'medium',
            'description', 'No tasks defined for project',
            'impact', 20
        );
    END IF;
    
    -- Ensure risk score is within bounds
    risk_score := GREATEST(0, LEAST(100, risk_score));
    
    -- Build predictions object
    predictions := jsonb_build_object(
        'risk_score', risk_score,
        'completion_percentage', completion_percentage,
        'risk_factors', risk_factors,
        'recommendations', CASE 
            WHEN risk_score > 70 THEN jsonb_build_array(
                'Immediate intervention required',
                'Review project scope and timeline',
                'Consider additional resources'
            )
            WHEN risk_score > 40 THEN jsonb_build_array(
                'Monitor closely',
                'Address overdue tasks',
                'Review task priorities'
            )
            ELSE jsonb_build_array(
                'Project on track',
                'Continue current approach'
            )
        END,
        'predicted_completion_date', CASE 
            WHEN completion_percentage > 0 THEN 
                (NOW() + INTERVAL '1 day' * ((100 - completion_percentage) / completion_percentage * 
                EXTRACT(DAY FROM NOW() - project_data.start_date)))::DATE
            ELSE NULL
        END
    );
    
    RETURN predictions;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_lead_scoring_models_workspace ON lead_scoring_models(workspace_id);
CREATE INDEX idx_proposal_templates_workspace ON proposal_templates(workspace_id);
CREATE INDEX idx_proposal_ab_tests_workspace ON proposal_ab_tests(workspace_id);
CREATE INDEX idx_project_predictions_project ON project_predictions(project_id);
CREATE INDEX idx_analytics_events_workspace ON analytics_events(workspace_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Enable RLS
ALTER TABLE lead_scoring_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view workspace lead scoring models" ON lead_scoring_models
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Admins can manage lead scoring models" ON lead_scoring_models
    FOR ALL USING (workspace_id = get_user_workspace_id() AND user_has_role('admin'));

CREATE POLICY "Users can view workspace proposal templates" ON proposal_templates
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage proposal templates" ON proposal_templates
    FOR ALL USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can view workspace AB tests" ON proposal_ab_tests
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Admins can manage AB tests" ON proposal_ab_tests
    FOR ALL USING (workspace_id = get_user_workspace_id() AND user_has_role('admin'));

CREATE POLICY "Users can view project predictions" ON project_predictions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE workspace_id = get_user_workspace_id()
        )
    );

CREATE POLICY "System can create project predictions" ON project_predictions
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE workspace_id = get_user_workspace_id()
        )
    );

CREATE POLICY "Admins can view payment integrations" ON payment_integrations
    FOR SELECT USING (workspace_id = get_user_workspace_id() AND user_has_role('admin'));

CREATE POLICY "Admins can manage payment integrations" ON payment_integrations
    FOR ALL USING (workspace_id = get_user_workspace_id() AND user_has_role('admin'));

CREATE POLICY "Users can view workspace automation rules" ON invoice_automation_rules
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Admins can manage automation rules" ON invoice_automation_rules
    FOR ALL USING (workspace_id = get_user_workspace_id() AND user_has_role('admin'));

CREATE POLICY "Users can view workspace email templates" ON email_templates
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage email templates" ON email_templates
    FOR ALL USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can view workspace analytics events" ON analytics_events
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can create analytics events" ON analytics_events
    FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
