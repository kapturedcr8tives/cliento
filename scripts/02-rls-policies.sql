-- Enable Row Level Security on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's workspace
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT workspace_id 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = required_role OR role = 'admin'
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspaces policies
CREATE POLICY "Users can view their workspace" ON workspaces
    FOR SELECT USING (id = get_user_workspace_id());

CREATE POLICY "Admins can update their workspace" ON workspaces
    FOR UPDATE USING (id = get_user_workspace_id() AND user_has_role('admin'));

-- Users policies
CREATE POLICY "Users can view workspace members" ON users
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage workspace users" ON users
    FOR ALL USING (workspace_id = get_user_workspace_id() AND user_has_role('admin'));

-- Clients policies
CREATE POLICY "Users can view workspace clients" ON clients
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage clients" ON clients
    FOR ALL USING (workspace_id = get_user_workspace_id());

-- Projects policies
CREATE POLICY "Users can view workspace projects" ON projects
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage projects" ON projects
    FOR ALL USING (workspace_id = get_user_workspace_id());

-- Tasks policies
CREATE POLICY "Users can view workspace tasks" ON tasks
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage tasks" ON tasks
    FOR ALL USING (workspace_id = get_user_workspace_id());

-- Leads policies
CREATE POLICY "Users can view workspace leads" ON leads
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage leads" ON leads
    FOR ALL USING (workspace_id = get_user_workspace_id());

-- Proposals policies
CREATE POLICY "Users can view workspace proposals" ON proposals
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage proposals" ON proposals
    FOR ALL USING (workspace_id = get_user_workspace_id());

-- Invoices policies
CREATE POLICY "Users can view workspace invoices" ON invoices
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Finance users can manage invoices" ON invoices
    FOR ALL USING (workspace_id = get_user_workspace_id() AND (user_has_role('finance') OR user_has_role('admin')));

-- Invoice items policies
CREATE POLICY "Users can view invoice items" ON invoice_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()
        )
    );

CREATE POLICY "Finance users can manage invoice items" ON invoice_items
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE workspace_id = get_user_workspace_id()
        ) AND (user_has_role('finance') OR user_has_role('admin'))
    );

-- Comments policies
CREATE POLICY "Users can view workspace comments" ON comments
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (workspace_id = get_user_workspace_id() AND created_by = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- File uploads policies
CREATE POLICY "Users can view workspace files" ON file_uploads
    FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can delete their uploaded files" ON file_uploads
    FOR DELETE USING (workspace_id = get_user_workspace_id() AND uploaded_by = auth.uid());
