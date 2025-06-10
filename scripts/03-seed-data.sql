-- Insert demo workspace
INSERT INTO workspaces (id, name, slug, primary_color) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Agency', 'demo-agency', '#3b82f6');

-- Insert demo users (these will be created when users sign up)
-- The actual user records will be created via triggers when auth.users are created

-- Insert demo clients
INSERT INTO clients (id, workspace_id, name, email, company, phone, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'John Smith', 'john@acmecorp.com', 'Acme Corporation', '+1-555-0123', NOW()),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Sarah Johnson', 'sarah@techstart.io', 'TechStart Inc', '+1-555-0124', NOW()),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Mike Davis', 'mike@globalventures.com', 'Global Ventures', '+1-555-0125', NOW());

-- Insert demo projects
INSERT INTO projects (id, workspace_id, client_id, name, description, status, budget, start_date, end_date, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Website Redesign', 'Complete redesign of company website with modern UI/UX', 'active', 25000.00, '2024-01-15', '2024-03-15', NOW()),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'Native iOS and Android app for customer engagement', 'planning', 45000.00, '2024-02-01', '2024-06-01', NOW()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'Brand Identity', 'Complete brand identity package including logo and guidelines', 'completed', 15000.00, '2023-11-01', '2023-12-15', NOW());

-- Insert demo tasks
INSERT INTO tasks (id, workspace_id, project_id, title, description, status, priority, due_date, estimated_hours, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Design Homepage Mockup', 'Create high-fidelity mockup for the new homepage design', 'in_progress', 'high', '2024-01-25 17:00:00', 16, NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Implement Responsive Layout', 'Code the responsive layout for all device sizes', 'todo', 'medium', '2024-02-01 17:00:00', 24, NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 'User Research', 'Conduct user interviews and create personas', 'done', 'high', '2024-01-20 17:00:00', 20, NOW());

-- Insert demo leads
INSERT INTO leads (id, workspace_id, name, email, company, status, expected_value, ai_score, source, notes, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'Emma Wilson', 'emma@retailplus.com', 'RetailPlus', 'qualified', 35000.00, 85, 'Website Contact Form', 'Interested in e-commerce platform development', NOW()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'David Chen', 'david@financetech.co', 'FinanceTech Co', 'proposal', 60000.00, 92, 'Referral', 'Need comprehensive fintech solution', NOW()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'Lisa Rodriguez', 'lisa@healthcareplus.org', 'HealthcarePlus', 'contacted', 28000.00, 78, 'LinkedIn', 'Healthcare management system requirements', NOW());

-- Insert demo proposals
INSERT INTO proposals (id, workspace_id, client_id, title, content, total_amount, status, valid_until, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Website Redesign Proposal', 'Comprehensive website redesign including UX research, design, and development phases.', 25000.00, 'accepted', '2024-02-15', NOW()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development Proposal', 'Native mobile application development for iOS and Android platforms.', 45000.00, 'sent', '2024-02-28', NOW());

-- Insert demo invoices
INSERT INTO invoices (id, workspace_id, client_id, project_id, invoice_number, title, subtotal, tax_rate, tax_amount, total_amount, status, due_date, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'INV-2024-001', 'Website Redesign - Phase 1', 10000.00, 8.25, 825.00, 10825.00, 'sent', '2024-02-15', NOW()),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'INV-2024-002', 'Brand Identity Package', 15000.00, 8.25, 1237.50, 16237.50, 'paid', '2024-01-15', NOW());

-- Insert demo invoice items
INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'UX Research and Analysis', 1, 5000.00, 5000.00),
('550e8400-e29b-41d4-a716-446655440050', 'Homepage Design Mockups', 1, 3000.00, 3000.00),
('550e8400-e29b-41d4-a716-446655440050', 'Responsive Layout Implementation', 1, 2000.00, 2000.00),
('550e8400-e29b-41d4-a716-446655440051', 'Logo Design', 1, 5000.00, 5000.00),
('550e8400-e29b-41d4-a716-446655440051', 'Brand Guidelines Document', 1, 3000.00, 3000.00),
('550e8400-e29b-41d4-a716-446655440051', 'Business Card Design', 1, 1000.00, 1000.00),
('550e8400-e29b-41d4-a716-446655440051', 'Letterhead Design', 1, 1000.00, 1000.00),
('550e8400-e29b-41d4-a716-446655440051', 'Brand Asset Package', 1, 5000.00, 5000.00);
