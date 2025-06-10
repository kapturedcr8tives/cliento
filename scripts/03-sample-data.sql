-- Sample Data for Cliento CRM
-- Insert test data for development and demonstration

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@cliento.com', '$2b$10$example_hash_1', 'John', 'Admin', 'admin', '+1-555-0101', 'America/New_York'),
('550e8400-e29b-41d4-a716-446655440002', 'manager@cliento.com', '$2b$10$example_hash_2', 'Sarah', 'Manager', 'manager', '+1-555-0102', 'America/Los_Angeles'),
('550e8400-e29b-41d4-a716-446655440003', 'user@cliento.com', '$2b$10$example_hash_3', 'Mike', 'User', 'user', '+1-555-0103', 'America/Chicago');

-- Insert sample companies
INSERT INTO companies (id, name, domain, industry, size, website, phone, address, city, state, country, postal_code) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'techcorp.com', 'Technology', 'medium', 'https://techcorp.com', '+1-555-1001', '123 Tech Street', 'San Francisco', 'CA', 'USA', '94105'),
('660e8400-e29b-41d4-a716-446655440002', 'Global Manufacturing Inc', 'globalmanuf.com', 'Manufacturing', 'large', 'https://globalmanuf.com', '+1-555-1002', '456 Industrial Blvd', 'Detroit', 'MI', 'USA', '48201'),
('660e8400-e29b-41d4-a716-446655440003', 'StartupXYZ', 'startupxyz.io', 'Software', 'startup', 'https://startupxyz.io', '+1-555-1003', '789 Innovation Ave', 'Austin', 'TX', 'USA', '73301');

-- Insert sample contacts
INSERT INTO contacts (id, company_id, first_name, last_name, email, phone, job_title, department, is_primary) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Alice', 'Johnson', 'alice.johnson@techcorp.com', '+1-555-2001', 'CTO', 'Technology', true),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Bob', 'Smith', 'bob.smith@techcorp.com', '+1-555-2002', 'Project Manager', 'Technology', false),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'Carol', 'Davis', 'carol.davis@globalmanuf.com', '+1-555-2003', 'VP Operations', 'Operations', true),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'David', 'Wilson', 'david.wilson@startupxyz.io', '+1-555-2004', 'CEO', 'Executive', true);

-- Insert sample leads
INSERT INTO leads (id, company_id, contact_id, assigned_to, title, description, status, priority, source, value, probability, expected_close_date) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Enterprise CRM Implementation', 'Full CRM system implementation for TechCorp Solutions', 'qualified', 'high', 'Website', 150000.00, 75, '2024-03-15'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Manufacturing Process Optimization', 'Digital transformation project for manufacturing processes', 'proposal', 'high', 'Referral', 250000.00, 60, '2024-04-20'),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Startup MVP Development', 'Mobile app MVP development for StartupXYZ', 'negotiation', 'medium', 'Cold Outreach', 75000.00, 80, '2024-02-28');

-- Insert sample projects
INSERT INTO projects (id, lead_id, company_id, name, description, status, priority, start_date, end_date, budget, progress, project_manager_id) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'TechCorp CRM Implementation', 'Complete CRM system setup and customization', 'active', 'high', '2024-01-15', '2024-06-15', 150000.00, 35, '550e8400-e29b-41d4-a716-446655440002'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'StartupXYZ MVP', 'Mobile application MVP development', 'active', 'medium', '2024-02-01', '2024-05-01', 75000.00, 60, '550e8400-e29b-41d4-a716-446655440003');

-- Insert sample tasks
INSERT INTO tasks (id, project_id, assigned_to, title, description, status, priority, due_date, estimated_hours) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Database Schema Design', 'Design and implement the database schema', 'done', 'high', '2024-02-01', 40.0),
('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'User Interface Development', 'Develop the main user interface components', 'in_progress', 'high', '2024-03-01', 80.0),
('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Mobile App Wireframes', 'Create wireframes for mobile application', 'done', 'medium', '2024-02-15', 20.0),
('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'API Development', 'Develop REST API endpoints', 'in_progress', 'high', '2024-03-15', 60.0);

-- Insert sample proposals
INSERT INTO proposals (id, lead_id, title, description, status, total_amount, currency, valid_until, created_by) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'TechCorp CRM Implementation Proposal', 'Comprehensive proposal for CRM system implementation', 'accepted', 150000.00, 'USD', '2024-02-15', '550e8400-e29b-41d4-a716-446655440002'),
('bb0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', 'Manufacturing Optimization Proposal', 'Digital transformation proposal for manufacturing processes', 'sent', 250000.00, 'USD', '2024-03-01', '550e8400-e29b-41d4-a716-446655440003');

-- Insert sample proposal items
INSERT INTO proposal_items (proposal_id, name, description, quantity, unit_price, sort_order) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'CRM System Setup', 'Initial system configuration and setup', 1, 25000.00, 1),
('bb0e8400-e29b-41d4-a716-446655440001', 'Data Migration', 'Migration of existing customer data', 1, 15000.00, 2),
('bb0e8400-e29b-41d4-a716-446655440001', 'Custom Development', 'Custom features and integrations', 100, 800.00, 3),
('bb0e8400-e29b-41d4-a716-446655440001', 'Training and Support', 'User training and ongoing support', 1, 30000.00, 4);

-- Insert sample invoices
INSERT INTO invoices (id, invoice_number, project_id, company_id, status, subtotal, tax_rate, issue_date, due_date, created_by) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'INV-2024-001', '990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'sent', 50000.00, 0.08, '2024-02-01', '2024-03-01', '550e8400-e29b-41d4-a716-446655440002'),
('cc0e8400-e29b-41d4-a716-446655440002', 'INV-2024-002', '990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'paid', 25000.00, 0.08, '2024-02-15', '2024-03-15', '550e8400-e29b-41d4-a716-446655440003');

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, name, description, quantity, unit_price, sort_order) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'Project Setup', 'Initial project setup and configuration', 1, 25000.00, 1),
('cc0e8400-e29b-41d4-a716-446655440001', 'Development Phase 1', 'First phase of development work', 1, 25000.00, 2),
('cc0e8400-e29b-41d4-a716-446655440002', 'MVP Development', 'Mobile app MVP development milestone', 1, 25000.00, 1);

-- Insert sample activities
INSERT INTO activities (user_id, entity_type, entity_id, activity_type, title, description) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'lead', '880e8400-e29b-41d4-a716-446655440001', 'status_change', 'Lead Status Updated', 'Lead status changed from contacted to qualified'),
('550e8400-e29b-41d4-a716-446655440003', 'project', '990e8400-e29b-41d4-a716-446655440001', 'progress_update', 'Project Progress Updated', 'Project progress updated to 35%'),
('550e8400-e29b-41d4-a716-446655440002', 'proposal', 'bb0e8400-e29b-41d4-a716-446655440001', 'sent', 'Proposal Sent', 'Proposal sent to TechCorp Solutions'),
('550e8400-e29b-41d4-a716-446655440003', 'invoice', 'cc0e8400-e29b-41d4-a716-446655440002', 'payment_received', 'Payment Received', 'Payment received for invoice INV-2024-002');

-- Insert sample email templates
INSERT INTO email_templates (name, subject, body_html, template_type, is_active, created_by) VALUES
('Proposal Sent', 'Your Proposal from Cliento', '<h1>Thank you for your interest!</h1><p>Please find your proposal attached.</p>', 'proposal_sent', true, '550e8400-e29b-41d4-a716-446655440001'),
('Invoice Sent', 'Invoice from Cliento', '<h1>Invoice Ready</h1><p>Your invoice is ready for payment.</p>', 'invoice_sent', true, '550e8400-e29b-41d4-a716-446655440001'),
('Payment Reminder', 'Payment Reminder', '<h1>Payment Reminder</h1><p>This is a friendly reminder about your outstanding invoice.</p>', 'payment_reminder', true, '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'New Lead Assigned', 'You have been assigned a new lead: TechCorp Solutions', 'info', 'lead', '880e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', 'Task Due Soon', 'Task "API Development" is due in 2 days', 'warning', 'task', 'aa0e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440002', 'Payment Received', 'Payment received for invoice INV-2024-002', 'success', 'invoice', 'cc0e8400-e29b-41d4-a716-446655440002');
