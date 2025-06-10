-- Add AI-related columns and functions
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_insights JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS ai_generated_content TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS predicted_completion_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100);

-- Create AI scoring function for leads
CREATE OR REPLACE FUNCTION calculate_lead_score(
    lead_email TEXT,
    lead_company TEXT,
    lead_source TEXT,
    expected_value DECIMAL
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Base score
    score := 50;
    
    -- Email domain scoring
    IF lead_email LIKE '%@gmail.com' OR lead_email LIKE '%@yahoo.com' THEN
        score := score - 10;
    ELSIF lead_email LIKE '%@company.com' OR lead_email LIKE '%.org' THEN
        score := score + 15;
    END IF;
    
    -- Company presence
    IF lead_company IS NOT NULL AND LENGTH(lead_company) > 0 THEN
        score := score + 20;
    END IF;
    
    -- Source quality
    CASE lead_source
        WHEN 'Referral' THEN score := score + 25;
        WHEN 'LinkedIn' THEN score := score + 15;
        WHEN 'Website Contact Form' THEN score := score + 10;
        WHEN 'Cold Outreach' THEN score := score - 5;
        ELSE score := score + 5;
    END CASE;
    
    -- Expected value impact
    IF expected_value > 50000 THEN
        score := score + 20;
    ELSIF expected_value > 25000 THEN
        score := score + 10;
    ELSIF expected_value > 10000 THEN
        score := score + 5;
    END IF;
    
    -- Ensure score is within bounds
    score := GREATEST(0, LEAST(100, score));
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate lead scores
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ai_score := calculate_lead_score(
        NEW.email,
        NEW.company,
        NEW.source,
        NEW.expected_value
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_score
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score();

-- Create project risk assessment function
CREATE OR REPLACE FUNCTION calculate_project_risk(
    project_id UUID
) RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    overdue_tasks INTEGER;
    total_tasks INTEGER;
    budget_used DECIMAL;
    days_overdue INTEGER;
BEGIN
    -- Get task statistics
    SELECT 
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done'),
        COUNT(*)
    INTO overdue_tasks, total_tasks
    FROM tasks 
    WHERE project_id = calculate_project_risk.project_id;
    
    -- Calculate overdue task percentage
    IF total_tasks > 0 THEN
        risk_score := risk_score + (overdue_tasks * 100 / total_tasks);
    END IF;
    
    -- Check project timeline
    SELECT EXTRACT(DAY FROM NOW() - end_date)
    INTO days_overdue
    FROM projects 
    WHERE id = project_id AND end_date < NOW();
    
    IF days_overdue > 0 THEN
        risk_score := risk_score + LEAST(30, days_overdue);
    END IF;
    
    -- Ensure score is within bounds
    risk_score := GREATEST(0, LEAST(100, risk_score));
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Create activity tracking table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_workspace_id ON activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- Enable RLS on activity logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace activity logs" ON activity_logs
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can create activity logs" ON activity_logs
    FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
