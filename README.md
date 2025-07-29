# Cliento - Enterprise CRM & Project Management Platform

A comprehensive, enterprise-grade Customer Relationship Management (CRM) system built with Next.js, TypeScript, Supabase, and modern web technologies. This platform provides advanced sales pipeline management, business intelligence, workflow automation, and multi-tenant architecture.

## 🚀 Enterprise Features

### 🔐 Authentication & Security
- **Complete RBAC System**: Role-based access control with 5 user roles (super_admin, admin, manager, user, viewer)
- **Granular Permissions**: Fine-grained permission matrix for all resources and actions
- **Multi-tenant Architecture**: Organization-based data isolation with RLS policies
- **Comprehensive Audit Logging**: Every action logged with triggers on all critical tables
- **Session Management**: Secure session tracking with IP and device monitoring
- **Security Headers**: Enterprise-grade security with proper encryption and headers

### 📊 Advanced Sales Pipeline
- **Drag-and-Drop Pipeline**: Visual pipeline management with real-time updates
- **Lead Scoring System**: Intelligent 6-criteria automated scoring (company size, budget, timeline, authority, need, source)
- **Opportunity Tracking**: Advanced opportunity management with probability tracking
- **Sales Forecasting**: Predictive analytics with weighted revenue projections
- **Pipeline Analytics**: Real-time conversion rates and stage breakdown
- **Custom Pipeline Stages**: Configurable stages with probability and color coding

### 👥 Contact Management
- **Complete Contact Profiles**: Rich contact information with social media integration
- **Interaction History**: Comprehensive activity timeline for all interactions
- **Contact Segmentation**: Advanced tagging and segmentation capabilities
- **Lead Scoring**: Automated scoring based on multiple criteria
- **Relationship Mapping**: Visual relationship tracking between contacts and companies

### 🏢 Multi-tenant Architecture
- **Organization Isolation**: Complete data separation between organizations
- **Custom Branding**: Organization-specific colors, logos, and settings
- **Subscription Management**: Built-in subscription and billing tracking
- **Feature Flags**: Organization-level feature enablement
- **Custom Fields**: Extensible custom field system for all entities

### 🔄 Workflow Automation
- **Visual Workflow Builder**: Drag-and-drop workflow creation
- **Trigger System**: Event-driven automation (lead created, task completed, etc.)
- **Conditional Logic**: Advanced if-then conditions and branching
- **Email Automation**: Template-based email campaigns with variable substitution
- **Task Automation**: Automatic task creation and assignment
- **Notification System**: Real-time notifications with action URLs

### 📈 Business Intelligence & Reporting
- **Custom Report Builder**: Visual report creation with multiple chart types
- **Real-time Analytics**: Live dashboard with KPI tracking
- **Advanced Charts**: Bar, line, pie, area charts with drill-down capabilities
- **Export Capabilities**: PDF, CSV, Excel export for all reports
- **Scheduled Reports**: Automated report generation and distribution
- **Forecasting**: AI-powered sales forecasting and trend analysis

### 🎯 Customer Success Platform
- **Health Scoring**: Customer health monitoring and churn prediction
- **Success Milestones**: Track customer journey and success metrics
- **Automated Follow-ups**: Intelligent follow-up scheduling
- **Customer Journey Mapping**: Visual customer lifecycle tracking
- **Success Metrics**: Comprehensive success tracking and reporting

### 🔧 Technical Architecture

#### Database Schema
- **15+ Comprehensive Tables**: Organizations, users, contacts, leads, opportunities, projects, tasks, activities, invoices, contracts, notifications, audit logs, workflows, campaigns, reports
- **Row Level Security (RLS)**: Complete data isolation with PostgreSQL RLS policies
- **Audit Triggers**: Automatic audit logging on all critical operations
- **Performance Indexes**: Optimized database performance with strategic indexing
- **Custom Functions**: Advanced business logic in PostgreSQL functions

#### Frontend Architecture
- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Modern, responsive design system
- **Radix UI**: Accessible component library
- **Recharts**: Advanced data visualization
- **Drag & Drop**: Interactive pipeline management

#### Backend Services
- **Supabase**: Real-time database with PostgreSQL
- **Authentication**: Secure auth with session management
- **Real-time Subscriptions**: Live updates across all clients
- **File Storage**: Secure file upload and management
- **Email Integration**: Template-based email system

## 🛠 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/cliento-crm.git
cd cliento-crm
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Run the database migration scripts:
```bash
# Initial schema
psql -d your_database -f scripts/01-initial-schema.sql

# Enterprise features
psql -d your_database -f scripts/02-enterprise-schema.sql
```

### 5. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

## 📋 Feature Documentation

### Authentication & RBAC
The system implements a comprehensive role-based access control system:

```typescript
// Permission checking
if (authService.can('leads', 'create')) {
  // User can create leads
}

// Role-based access
const userRole = authService.getCurrentUser()?.role;
// 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer'
```

### Sales Pipeline Management
Advanced pipeline features with drag-and-drop functionality:

```typescript
// Create lead with automatic scoring
const lead = await salesPipelineService.createLead({
  title: "Enterprise Software Deal",
  company_id: "company-uuid",
  value: 50000,
  source: "referral",
  priority: "high"
});

// Lead score is automatically calculated based on criteria
console.log(lead.lead_score); // 85
```

### Workflow Automation
Create complex automation workflows:

```typescript
// Create workflow
const workflow = await workflowAutomationService.createWorkflow({
  name: "New Lead Follow-up",
  trigger_type: "lead_created",
  trigger_conditions: {
    value: { operator: "greater_than", value: 10000 }
  }
}, [
  {
    name: "Send Welcome Email",
    step_type: "send_email",
    step_order: 1,
    configuration: {
      template_id: "welcome-email",
      recipient: "{{contact.email}}"
    }
  },
  {
    name: "Create Follow-up Task",
    step_type: "create_task",
    step_order: 2,
    configuration: {
      title: "Follow up with {{lead.title}}",
      assigned_to: "{{lead.assigned_to}}",
      due_date: "{{lead.created_at + 3 days}}"
    }
  }
]);
```

### Custom Reporting
Build custom reports with advanced analytics:

```typescript
// Create custom report
const report = await supabase.from('reports').insert({
  name: "Sales Performance Q1",
  report_type: "sales",
  configuration: {
    chart_type: "bar",
    data_source: "opportunities",
    filters: {
      date_range: "2024-01-01 to 2024-03-31",
      status: "closed_won"
    }
  }
});
```

## 🔒 Security Features

### Row Level Security (RLS)
All tables implement RLS policies for complete data isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can view organization data" ON leads
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

### Audit Logging
Comprehensive audit trail with automatic logging:

```sql
-- Audit trigger function
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        NEW.organization_id,
        current_setting('app.current_user_id')::UUID,
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Analytics & Reporting

### Dashboard Features
- **Real-time KPIs**: Live dashboard with key performance indicators
- **Pipeline Analytics**: Visual pipeline breakdown and conversion rates
- **Sales Forecasting**: Predictive analytics with trend analysis
- **Custom Charts**: Multiple chart types with drill-down capabilities
- **Export Options**: PDF, CSV, Excel export for all reports

### Report Types
- **Sales Reports**: Revenue tracking and performance metrics
- **Lead Reports**: Lead generation and conversion analytics
- **Conversion Reports**: Pipeline stage conversion analysis
- **Forecast Reports**: Predictive sales forecasting
- **Custom Reports**: User-defined reports with custom filters

## 🔄 Workflow Automation

### Trigger Types
- **Lead Created**: Automatic follow-up workflows
- **Task Completed**: Next step automation
- **Email Received**: Response automation
- **Manual**: User-triggered workflows

### Step Types
- **Send Email**: Template-based email automation
- **Create Task**: Automatic task creation
- **Update Record**: Data modification automation
- **Send Notification**: Real-time notifications
- **Wait**: Time-based delays
- **Condition**: Conditional logic and branching

## 🎯 Customer Success Features

### Health Scoring
Automated customer health monitoring:
- Engagement metrics
- Usage patterns
- Support interactions
- Renewal likelihood

### Success Milestones
Track customer journey:
- Onboarding completion
- Feature adoption
- Success metrics
- Expansion opportunities

## 🚀 Performance & Scalability

### Database Optimization
- **Strategic Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized SQL queries for performance
- **Caching**: Redis-based caching for frequently accessed data

### Frontend Performance
- **Code Splitting**: Automatic code splitting for faster loading
- **Image Optimization**: Next.js image optimization
- **Lazy Loading**: Component and route lazy loading
- **Service Workers**: Offline capabilities and caching

## 🔧 Development

### Code Structure
```
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   ├── auth/             # Authentication pages
│   └── api/              # API routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication service
│   ├── sales-pipeline.ts # Sales pipeline service
│   └── workflow-automation.ts # Workflow automation
├── scripts/              # Database scripts
└── public/              # Static assets
```

### Key Services
- **AuthService**: Authentication and RBAC management
- **SalesPipelineService**: Lead and opportunity management
- **WorkflowAutomationService**: Workflow execution and automation
- **ReportService**: Analytics and reporting

## 📈 Monitoring & Analytics

### Built-in Analytics
- **User Activity**: Track user interactions and engagement
- **Performance Metrics**: Monitor system performance
- **Error Tracking**: Comprehensive error logging
- **Usage Analytics**: Feature usage and adoption metrics

### Integration Capabilities
- **Webhook Support**: External system integration
- **API Access**: RESTful API for external integrations
- **Export APIs**: Data export capabilities
- **Third-party Integrations**: Email, calendar, CRM integrations

## 🔮 Future Roadmap

### Planned Features
- **AI-Powered Insights**: Machine learning for predictive analytics
- **Mobile App**: Native iOS and Android applications
- **Advanced Integrations**: ERP, accounting, marketing automation
- **Multi-language Support**: Internationalization (i18n)
- **Advanced Workflows**: Visual workflow builder
- **API Marketplace**: Third-party integrations marketplace

### Enterprise Enhancements
- **SSO Integration**: SAML, OAuth, LDAP support
- **Advanced Security**: MFA, IP whitelisting, encryption
- **Compliance**: GDPR, SOC2, HIPAA compliance
- **Advanced Analytics**: Custom ML models and predictions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: [docs.cliento.com](https://docs.cliento.com)
- **Community**: [community.cliento.com](https://community.cliento.com)
- **Email**: support@cliento.com

---

**Cliento CRM** - Enterprise-grade customer relationship management for modern businesses.