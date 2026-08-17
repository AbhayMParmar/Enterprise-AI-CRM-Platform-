import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Deal } from '../models/Deal';
import { Company } from '../models/Company';
import { Task } from '../models/Task';
import { Event } from '../models/Event';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { KpiSetting } from '../models/KpiSetting';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('[SEED] Initiating CRM Demo Data Seeding process...');

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@aicrm.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Super12!';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aicrm.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12!';

    // 1. Ensure SuperAdmin user exists
    let superAdmin = await User.findOne({ email: superAdminEmail.toLowerCase() });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Admin',
        email: superAdminEmail.toLowerCase(),
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        isVerified: true,
      });
      console.log(`[SEED] Created default SuperAdmin user: ${superAdminEmail}`);
    } else if (superAdmin.accountStatus !== 'ACTIVE') {
      superAdmin.accountStatus = 'ACTIVE';
      await superAdmin.save();
    }

    // 2. Ensure default Company exists
    let demoCompany = await Company.findOne({ companyName: 'Acme Enterprise Solutions' });
    if (!demoCompany) {
      demoCompany = await Company.create({
        companyName: 'Acme Enterprise Solutions',
        ownerId: superAdmin._id,
        businessEmail: adminEmail.toLowerCase(),
        status: 'ACTIVE',
        joinCode: 'ACME2026',
        joinCodeActive: true,
        joinCodeGeneratedAt: new Date(),
        subscription: {
          plan: 'premium',
          status: 'active',
          billingCycle: 'monthly',
          amountPaid: 299,
          aiFeaturesEnabled: true,
          currentAiUsage: 0,
        },
      });
      console.log(`[SEED] Created default demo company: Acme Enterprise Solutions`);
    }

    // 3. Ensure System Admin user exists
    let adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'COMPANY_OWNER',
        companyId: demoCompany._id,
        accountStatus: 'ACTIVE',
        isVerified: true,
        companies: [{ companyId: demoCompany._id as any, role: 'COMPANY_OWNER' }],
      });
      console.log(`[SEED] Created default Admin user: ${adminEmail}`);
    }

    // =========================================================================
    // TARGET DEMO ACCOUNT: abhi@gmail.com & NovaSphere Technologies
    // =========================================================================

    const targetEmail = 'abhi@gmail.com';
    const targetPassword = 'Abhi@123';

    let abhiUser = await User.findOne({ email: targetEmail.toLowerCase() });
    if (!abhiUser) {
      abhiUser = await User.create({
        name: 'Abhi Patel',
        email: targetEmail.toLowerCase(),
        password: targetPassword,
        role: 'COMPANY_OWNER',
        accountStatus: 'ACTIVE',
        isVerified: true,
        phone: '+91 98765 43210',
        company: 'NovaSphere Technologies',
        jobTitle: 'Chief Executive Officer',
      });
      console.log(`[SEED] Created target demo user: ${targetEmail}`);
    } else {
      // Ensure existing user credentials & status match requested specifications
      let updated = false;
      const isMatch = await abhiUser.comparePassword(targetPassword);
      if (!isMatch) {
        abhiUser.password = targetPassword;
        updated = true;
      }
      if (abhiUser.accountStatus !== 'ACTIVE') {
        abhiUser.accountStatus = 'ACTIVE';
        updated = true;
      }
      if (!abhiUser.isVerified) {
        abhiUser.isVerified = true;
        updated = true;
      }
      if (abhiUser.role !== 'COMPANY_OWNER') {
        abhiUser.role = 'COMPANY_OWNER';
        updated = true;
      }
      if (updated) {
        await abhiUser.save();
        console.log(`[SEED] Updated target demo user ${targetEmail} status & credentials.`);
      }
    }

    // Ensure NovaSphere Technologies Company exists for abhi@gmail.com
    let novaSphere = await Company.findOne({ ownerId: abhiUser._id });
    if (!novaSphere) {
      novaSphere = await Company.findOne({ businessEmail: targetEmail.toLowerCase() });
    }
    if (!novaSphere) {
      novaSphere = await Company.findOne({ companyName: 'NovaSphere Technologies' });
    }

    if (!novaSphere) {
      novaSphere = await Company.create({
        companyName: 'NovaSphere Technologies',
        ownerId: abhiUser._id,
        businessEmail: targetEmail.toLowerCase(),
        phone: '+91 98765 43210',
        industry: 'Software & Technology',
        companySize: '51-200',
        website: 'https://example.com',
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        status: 'ACTIVE',
        joinCode: 'NOVASPHERE2026',
        joinCodeActive: true,
        joinCodeGeneratedAt: new Date(),
        subscription: {
          plan: 'premium',
          status: 'active',
          billingCycle: 'yearly',
          amountPaid: 499,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-01-01'),
          renewalDate: new Date('2027-01-01'),
          autoRenew: true,
          aiFeaturesEnabled: true,
          currentAiUsage: 45,
          usageLimits: {
            maxSalesManagers: 10,
            maxSalesReps: 50,
            maxUsers: 100,
            maxLeads: 10000,
            maxCustomers: 5000,
            maxDeals: 5000,
            aiQueryLimit: 5000,
          },
        },
      });
      console.log(`[SEED] Created company NovaSphere Technologies for ${targetEmail}`);
    } else {
      // Refresh company parameters
      novaSphere.status = 'ACTIVE';
      novaSphere.companyName = 'NovaSphere Technologies';
      novaSphere.industry = 'Software & Technology';
      novaSphere.companySize = '51-200';
      novaSphere.city = 'Ahmedabad';
      novaSphere.state = 'Gujarat';
      novaSphere.country = 'India';
      novaSphere.subscription.plan = 'premium';
      novaSphere.subscription.status = 'active';
      novaSphere.subscription.aiFeaturesEnabled = true;
      await novaSphere.save();
    }

    // Associate abhiUser with NovaSphere companyId
    if (!abhiUser.companyId || !abhiUser.companyId.equals(novaSphere._id)) {
      abhiUser.companyId = novaSphere._id as any;
      abhiUser.companies = [{ companyId: novaSphere._id as any, role: 'COMPANY_OWNER' as any }];
      abhiUser.subscription = {
        plan: 'premium',
        status: 'active',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
      };
      await abhiUser.save();
    }

    // 4. Seed Sales Representatives for NovaSphere Technologies
    const repsDef = [
      { name: 'Aarav Sales', email: 'aarav.sales@example.com', role: 'SALES_REPRESENTATIVE', phone: '+91 90000 00001' },
      { name: 'Riya Sales', email: 'riya.sales@example.com', role: 'SALES_REPRESENTATIVE', phone: '+91 90000 00002' },
      { name: 'Kabir Sales', email: 'kabir.sales@example.com', role: 'SALES_REPRESENTATIVE', phone: '+91 90000 00003' },
      { name: 'Neha Sales', email: 'neha.sales@example.com', role: 'SALES_MANAGER', phone: '+91 90000 00004' },
    ];

    const salesReps: Record<string, any> = {
      'Abhi Patel': abhiUser,
    };

    for (const rep of repsDef) {
      let rUser = await User.findOne({ email: rep.email.toLowerCase() });
      if (!rUser) {
        rUser = await User.create({
          name: rep.name,
          email: rep.email.toLowerCase(),
          password: 'Password123!',
          role: rep.role as any,
          companyId: novaSphere._id,
          accountStatus: 'ACTIVE',
          isVerified: true,
          phone: rep.phone,
          company: 'NovaSphere Technologies',
          companies: [{ companyId: novaSphere._id as any, role: rep.role as any }],
        });
      } else {
        rUser.companyId = novaSphere._id as any;
        rUser.accountStatus = 'ACTIVE';
        rUser.isVerified = true;
        await rUser.save();
      }
      salesReps[rep.name] = rUser;
    }

    // Clean existing demo collections for NovaSphere companyId to guarantee idempotency
    await Customer.deleteMany({ companyId: novaSphere._id });
    await Deal.deleteMany({ companyId: novaSphere._id });
    await Task.deleteMany({ companyId: novaSphere._id });
    await Event.deleteMany({ companyId: novaSphere._id });
    await ActivityLog.deleteMany({ companyId: novaSphere._id });
    await Notification.deleteMany({ companyId: novaSphere._id });

    // 5. Seed 15 Fictional Customers / Leads
    const customersData = [
      {
        name: 'Aarav Mehta',
        company: 'NovaTech Solutions',
        email: 'aarav.mehta@example.com',
        phone: '+91 90000 10001',
        status: 'Proposal' as const,
        value: 25000,
        assignedTo: salesReps['Aarav Sales']._id,
        tags: ['Technology', 'Enterprise', 'Inbound'],
        notes: [
          { content: 'Initial discovery call completed. Client requested custom AI email generator demo.', createdBy: salesReps['Aarav Sales']._id, createdAt: new Date(Date.now() - 7 * 86400000) },
          { content: 'Sent detailed RFP response for Enterprise CRM deployment.', createdBy: salesReps['Aarav Sales']._id, createdAt: new Date(Date.now() - 3 * 86400000) },
        ],
      },
      {
        name: 'Riya Shah',
        company: 'BrightCore Systems',
        email: 'riya.shah@example.com',
        phone: '+91 90000 10002',
        status: 'Contacted' as const,
        value: 18500,
        assignedTo: salesReps['Riya Sales']._id,
        tags: ['Software', 'AI Automation', 'High Priority'],
        notes: [
          { content: 'Evaluated AI Copilot auto-reply feature and meeting summarizer for 15 sales reps.', createdBy: salesReps['Riya Sales']._id, createdAt: new Date(Date.now() - 5 * 86400000) },
        ],
      },
      {
        name: 'Kabir Patel',
        company: 'Vertex Digital',
        email: 'kabir.patel@example.com',
        phone: '+91 90000 10003',
        status: 'Proposal' as const,
        value: 32000,
        assignedTo: salesReps['Kabir Sales']._id,
        tags: ['IT Services', 'CRM Upgrade'],
        notes: [
          { content: 'Submitted formal proposal for 30 user seats with AI Meeting Summary add-on.', createdBy: salesReps['Kabir Sales']._id, createdAt: new Date(Date.now() - 4 * 86400000) },
        ],
      },
      {
        name: 'Ananya Sharma',
        company: 'CloudPulse Labs',
        email: 'ananya.sharma@example.com',
        phone: '+91 90000 10004',
        status: 'Negotiation' as const,
        value: 45000,
        assignedTo: salesReps['Neha Sales']._id,
        tags: ['Cloud', 'Enterprise', 'SOC2 Required'],
        notes: [
          { content: 'Discussed security compliance and custom SLA requirements. Procurement review underway.', createdBy: salesReps['Neha Sales']._id, createdAt: new Date(Date.now() - 2 * 86400000) },
        ],
      },
      {
        name: 'Vikram Malhotra',
        company: 'Apex Dynamics',
        email: 'vikram.malhotra@example.com',
        phone: '+91 90000 10005',
        status: 'Lead' as const,
        value: 15000,
        assignedTo: salesReps['Aarav Sales']._id,
        tags: ['Enterprise Software', 'Website Lead'],
        notes: [
          { content: 'Filled out contact form on website requesting pricing brochure.', createdBy: salesReps['Aarav Sales']._id, createdAt: new Date(Date.now() - 1 * 86400000) },
        ],
      },
      {
        name: 'Priya Nair',
        company: 'Zenith Retail Corp',
        email: 'priya.nair@example.com',
        phone: '+91 90000 10006',
        status: 'Won' as const,
        value: 60000,
        assignedTo: salesReps['Riya Sales']._id,
        tags: ['E-Commerce', 'Closed Won', 'VIP'],
        notes: [
          { content: 'Contract executed! Paid initial annual license fee.', createdBy: salesReps['Riya Sales']._id, createdAt: new Date(Date.now() - 30 * 86400000) },
        ],
      },
      {
        name: 'Rohan Verma',
        company: 'Nexus Systems',
        email: 'rohan.verma@example.com',
        phone: '+91 90000 10007',
        status: 'Negotiation' as const,
        value: 28000,
        assignedTo: salesReps['Kabir Sales']._id,
        tags: ['Telecommunications', 'Mid-Market'],
        notes: [
          { content: 'Final legal contract redlines submitted to compliance officer.', createdBy: salesReps['Kabir Sales']._id, createdAt: new Date(Date.now() - 6 * 86400000) },
        ],
      },
      {
        name: 'Sneha Kulkarni',
        company: 'Quantum Data',
        email: 'sneha.kulkarni@example.com',
        phone: '+91 90000 10008',
        status: 'Won' as const,
        value: 52000,
        assignedTo: salesReps['Neha Sales']._id,
        tags: ['Data Analytics', 'Closed Won'],
        notes: [
          { content: 'Onboarding session completed with key account managers.', createdBy: salesReps['Neha Sales']._id, createdAt: new Date(Date.now() - 10 * 86400000) },
        ],
      },
      {
        name: 'Devendra Joshi',
        company: 'CyberShield Global',
        email: 'devendra.joshi@example.com',
        phone: '+91 90000 10009',
        status: 'Lost' as const,
        value: 22000,
        assignedTo: salesReps['Aarav Sales']._id,
        tags: ['Cybersecurity', 'Budget Frozen'],
        notes: [
          { content: 'Lead postponed software upgrades until next fiscal year.', createdBy: salesReps['Aarav Sales']._id, createdAt: new Date(Date.now() - 14 * 86400000) },
        ],
      },
      {
        name: 'Meera Deshmukh',
        company: 'Synergy BioTech',
        email: 'meera.deshmukh@example.com',
        phone: '+91 90000 10010',
        status: 'Lead' as const,
        value: 12000,
        assignedTo: salesReps['Riya Sales']._id,
        tags: ['Biotechnology', 'Webinar Lead'],
        notes: [
          { content: 'Attended Q3 Product Webinar on AI Sales Workflows.', createdBy: salesReps['Riya Sales']._id, createdAt: new Date(Date.now() - 8 * 86400000) },
        ],
      },
      {
        name: 'Aditya Singhania',
        company: 'BlueHorizon Energy',
        email: 'aditya.singhania@example.com',
        phone: '+91 90000 10011',
        status: 'Contacted' as const,
        value: 38000,
        assignedTo: salesReps['Kabir Sales']._id,
        tags: ['CleanTech', 'Referral'],
        notes: [
          { content: 'Introductory phone call completed. Demo scheduled for next week.', createdBy: salesReps['Kabir Sales']._id, createdAt: new Date(Date.now() - 4 * 86400000) },
        ],
      },
      {
        name: 'Tanvi Rao',
        company: 'OmniStream Media',
        email: 'tanvi.rao@example.com',
        phone: '+91 90000 10012',
        status: 'Proposal' as const,
        value: 29500,
        assignedTo: salesReps['Neha Sales']._id,
        tags: ['Digital Media', 'Inbound'],
        notes: [
          { content: 'Delivered custom pricing estimate and workflow integration guide.', createdBy: salesReps['Neha Sales']._id, createdAt: new Date(Date.now() - 3 * 86400000) },
        ],
      },
      {
        name: 'Siddharth Roy',
        company: 'Elevate Financial',
        email: 'siddharth.roy@example.com',
        phone: '+91 90000 10013',
        status: 'Won' as const,
        value: 75000,
        assignedTo: salesReps['Aarav Sales']._id,
        tags: ['FinTech', 'Closed Won', 'High Value'],
        notes: [
          { content: '3-Year Enterprise SaaS Agreement signed. Implementation started.', createdBy: salesReps['Aarav Sales']._id, createdAt: new Date(Date.now() - 25 * 86400000) },
        ],
      },
      {
        name: 'Pooja Hegde',
        company: 'Vantage Logistics',
        email: 'pooja.hegde@example.com',
        phone: '+91 90000 10014',
        status: 'Contacted' as const,
        value: 19000,
        assignedTo: salesReps['Riya Sales']._id,
        tags: ['Supply Chain', 'LinkedIn Campaign'],
        notes: [
          { content: 'Connected on LinkedIn. Sent case study on CRM logistics automation.', createdBy: salesReps['Riya Sales']._id, createdAt: new Date(Date.now() - 5 * 86400000) },
        ],
      },
      {
        name: 'Varun Kapoor',
        company: 'Strata Cloud Solutions',
        email: 'varun.kapoor@example.com',
        phone: '+91 90000 10015',
        status: 'Lead' as const,
        value: 14000,
        assignedTo: salesReps['Kabir Sales']._id,
        tags: ['IT Infrastructure', 'Direct Inquiry'],
        notes: [
          { content: 'Inquired about Google OAuth and role-based permissions.', createdBy: salesReps['Kabir Sales']._id, createdAt: new Date(Date.now() - 2 * 86400000) },
        ],
      },
    ];

    const customerDocs = await Customer.insertMany(
      customersData.map((c) => ({
        ...c,
        companyId: novaSphere._id,
      }))
    );
    console.log(`[SEED] Inserted ${customerDocs.length} demo customers for NovaSphere Technologies.`);

    // Map customer name to Customer Document
    const customerMap: Record<string, any> = {};
    customerDocs.forEach((c) => {
      customerMap[c.name] = c;
    });

    // 6. Seed 12 Realistic Enterprise Deals for Sales Pipeline Kanban
    const dealsData = [
      {
        title: 'Enterprise CRM Implementation',
        customer: customerMap['Aarav Mehta']._id,
        value: 25000,
        stage: 'Lead' as const,
        probability: 10,
        expectedCloseDate: new Date('2026-09-30'),
        assignedTo: salesReps['Aarav Sales']._id,
      },
      {
        title: 'AI Sales Automation Package',
        customer: customerMap['Riya Shah']._id,
        value: 18500,
        stage: 'Contacted' as const,
        probability: 25,
        expectedCloseDate: new Date('2026-10-15'),
        assignedTo: salesReps['Riya Sales']._id,
      },
      {
        title: 'Customer Support CRM Upgrade',
        customer: customerMap['Kabir Patel']._id,
        value: 32000,
        stage: 'Proposal' as const,
        probability: 50,
        expectedCloseDate: new Date('2026-09-25'),
        assignedTo: salesReps['Kabir Sales']._id,
      },
      {
        title: 'Multi-Tenant Cloud Infrastructure',
        customer: customerMap['Ananya Sharma']._id,
        value: 45000,
        stage: 'Negotiation' as const,
        probability: 75,
        expectedCloseDate: new Date('2026-09-10'),
        assignedTo: salesReps['Neha Sales']._id,
      },
      {
        title: 'Global Analytics Platform Expansion',
        customer: customerMap['Priya Nair']._id,
        value: 60000,
        stage: 'Won' as const,
        probability: 100,
        expectedCloseDate: new Date('2026-08-01'),
        assignedTo: salesReps['Riya Sales']._id,
        createdAt: new Date('2026-06-15'),
      },
      {
        title: 'Cybersecurity Intelligence Suite',
        customer: customerMap['Devendra Joshi']._id,
        value: 22000,
        stage: 'Lost' as const,
        probability: 0,
        expectedCloseDate: new Date('2026-07-20'),
        assignedTo: salesReps['Aarav Sales']._id,
      },
      {
        title: 'OmniChannel Marketing Integration',
        customer: customerMap['Tanvi Rao']._id,
        value: 29500,
        stage: 'Proposal' as const,
        probability: 50,
        expectedCloseDate: new Date('2026-10-05'),
        assignedTo: salesReps['Neha Sales']._id,
      },
      {
        title: 'Enterprise Financial Suite',
        customer: customerMap['Siddharth Roy']._id,
        value: 75000,
        stage: 'Won' as const,
        probability: 100,
        expectedCloseDate: new Date('2026-08-10'),
        assignedTo: salesReps['Aarav Sales']._id,
        createdAt: new Date('2026-07-20'),
      },
      {
        title: 'AI Copilot & Lead Scoring Engine',
        customer: customerMap['Vikram Malhotra']._id,
        value: 15000,
        stage: 'Lead' as const,
        probability: 10,
        expectedCloseDate: new Date('2026-11-01'),
        assignedTo: salesReps['Aarav Sales']._id,
      },
      {
        title: 'CleanTech Automated Pipeline',
        customer: customerMap['Aditya Singhania']._id,
        value: 38000,
        stage: 'Contacted' as const,
        probability: 25,
        expectedCloseDate: new Date('2026-10-20'),
        assignedTo: salesReps['Kabir Sales']._id,
      },
      {
        title: 'Supply Chain Data Synchronization',
        customer: customerMap['Rohan Verma']._id,
        value: 28000,
        stage: 'Negotiation' as const,
        probability: 75,
        expectedCloseDate: new Date('2026-09-18'),
        assignedTo: salesReps['Kabir Sales']._id,
      },
      {
        title: 'Custom Predictive AI Dashboard',
        customer: customerMap['Sneha Kulkarni']._id,
        value: 52000,
        stage: 'Won' as const,
        probability: 100,
        expectedCloseDate: new Date('2026-08-15'),
        assignedTo: salesReps['Neha Sales']._id,
        createdAt: new Date('2026-08-10'),
      },
    ];

    const dealDocs = await Deal.insertMany(
      dealsData.map((d) => ({
        ...d,
        companyId: novaSphere._id,
        notes: [
          { content: `Initial deal creation in ${d.stage} stage with value $${d.value.toLocaleString()}`, createdBy: d.assignedTo, createdAt: new Date() },
        ],
      }))
    );
    console.log(`[SEED] Inserted ${dealDocs.length} demo deals for NovaSphere Technologies.`);

    const dealMap: Record<string, any> = {};
    dealDocs.forEach((d) => {
      dealMap[d.title] = d;
    });

    // 7. Seed Tasks & Calendar Events (Including Meeting Summaries context)
    const tasksData = [
      {
        title: 'Prepare product demo deck for BrightCore Systems',
        description: 'Customize slides to showcase AI email generation and automated meeting summaries for 15 sales reps.',
        dueDate: new Date(Date.now() + 3 * 86400000),
        priority: 'High' as const,
        status: 'Pending' as const,
        assignedTo: salesReps['Riya Sales']._id,
        customer: customerMap['Riya Shah']._id,
        deal: dealMap['AI Sales Automation Package']._id,
        createdBy: abhiUser._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Follow up on pricing approval with NovaTech Solutions',
        description: 'Check if Aarav Mehta received internal sign-off on the 20-user Premium CRM license proposal.',
        dueDate: new Date(Date.now() + 5 * 86400000),
        priority: 'High' as const,
        status: 'In Progress' as const,
        assignedTo: salesReps['Aarav Sales']._id,
        customer: customerMap['Aarav Mehta']._id,
        deal: dealMap['Enterprise CRM Implementation']._id,
        createdBy: abhiUser._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Send contract redlines to CloudPulse Labs',
        description: 'Review SOC2 compliance clause with legal department before sending updated contract.',
        dueDate: new Date(Date.now() + 2 * 86400000),
        priority: 'Medium' as const,
        status: 'Pending' as const,
        assignedTo: salesReps['Neha Sales']._id,
        customer: customerMap['Ananya Sharma']._id,
        deal: dealMap['Multi-Tenant Cloud Infrastructure']._id,
        createdBy: abhiUser._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Schedule technical onboarding for Elevate Financial',
        description: 'Coordinate with customer success team to set up SSO and data migration.',
        dueDate: new Date(Date.now() - 1 * 86400000),
        priority: 'Medium' as const,
        status: 'Completed' as const,
        assignedTo: salesReps['Aarav Sales']._id,
        customer: customerMap['Siddharth Roy']._id,
        deal: dealMap['Enterprise Financial Suite']._id,
        createdBy: abhiUser._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Draft custom AI Copilot proposal for Vertex Digital',
        description: 'Provide breakdown of AI query limits and user license packages for Kabir Patel.',
        dueDate: new Date(Date.now() + 4 * 86400000),
        priority: 'High' as const,
        status: 'In Progress' as const,
        assignedTo: salesReps['Kabir Sales']._id,
        customer: customerMap['Kabir Patel']._id,
        deal: dealMap['Customer Support CRM Upgrade']._id,
        createdBy: abhiUser._id,
        companyId: novaSphere._id,
      },
    ];

    await Task.insertMany(tasksData);

    const eventsData = [
      {
        title: 'Client CRM Requirements Discussion',
        description: 'The client (NovaTech Solutions) is interested in the Premium CRM plan and requires approximately 20 user accounts. They are interested in AI-generated follow-up emails and sales automation. The client requested a product demonstration next week. They will review the pricing internally and provide feedback by Friday.',
        type: 'Meeting' as const,
        location: 'Google Meet',
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() - 86400000 + 3600000),
        customer: customerMap['Aarav Mehta']._id,
        deal: dealMap['Enterprise CRM Implementation']._id,
        createdBy: salesReps['Aarav Sales']._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Enterprise Cloud Migration Sync with CloudPulse Labs',
        description: 'Met with Ananya Sharma, VP of Tech at CloudPulse Labs. Discussed multi-tenant architecture migration and security compliance (SOC2, GDPR). The team needs custom role-based access control and high availability SLA guarantees. Agreed to submit a detailed architectural proposal by Wednesday. Decision maker review scheduled for next Monday.',
        type: 'Demo' as const,
        location: 'Zoom Video',
        startTime: new Date(Date.now() - 2 * 86400000),
        endTime: new Date(Date.now() - 2 * 86400000 + 3600000),
        customer: customerMap['Ananya Sharma']._id,
        deal: dealMap['Multi-Tenant Cloud Infrastructure']._id,
        createdBy: salesReps['Neha Sales']._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Q4 Sales Automation & AI Copilot Review with BrightCore Systems',
        description: 'Conducted discovery session with Riya Shah from BrightCore Systems. They are currently managing 500+ active leads manually and experiencing response delays. Evaluated AI Copilot auto-reply feature and meeting summarizer. Requested sample ROI model for 15 sales reps. Follow-up meeting set for next Tuesday at 2 PM.',
        type: 'Call' as const,
        location: 'MS Teams',
        startTime: new Date(Date.now() - 3 * 86400000),
        endTime: new Date(Date.now() - 3 * 86400000 + 2700000),
        customer: customerMap['Riya Shah']._id,
        deal: dealMap['AI Sales Automation Package']._id,
        createdBy: salesReps['Riya Sales']._id,
        companyId: novaSphere._id,
      },
      {
        title: 'Executive Briefing & Contract Finalization with Elevate Financial',
        description: 'Reviewed final terms with Siddharth Roy from Elevate Financial. Negotiated 3-year enterprise license with dedicated SLA support. Contract signed successfully for $75,000 ARR.',
        type: 'Meeting' as const,
        location: 'HQ Boardroom',
        startTime: new Date(Date.now() - 7 * 86400000),
        endTime: new Date(Date.now() - 7 * 86400000 + 5400000),
        customer: customerMap['Siddharth Roy']._id,
        deal: dealMap['Enterprise Financial Suite']._id,
        createdBy: abhiUser._id,
        companyId: novaSphere._id,
      },
    ];

    await Event.insertMany(eventsData);

    // 8. Seed Realistic Activity Logs Timeline with varied timestamps
    const nowMs = Date.now();
    const activityLogsData = [
      {
        userId: abhiUser._id,
        companyId: novaSphere._id,
        action: 'USER_LOGIN',
        details: { message: 'Abhi Patel logged into Executive Dashboard' },
        createdAt: new Date(nowMs - 2 * 60000), // 2 min ago
      },
      {
        userId: salesReps['Aarav Sales']._id,
        companyId: novaSphere._id,
        action: 'CUSTOMER_UPDATE',
        details: { text: 'Follow-up call completed with Aarav Mehta (NovaTech Solutions)' },
        createdAt: new Date(nowMs - 10 * 60000), // 10 min ago
      },
      {
        userId: salesReps['Riya Sales']._id,
        companyId: novaSphere._id,
        action: 'TASK_CREATE',
        details: { text: 'Product demo scheduled for BrightCore Systems' },
        createdAt: new Date(nowMs - 25 * 60000), // 25 min ago
      },
      {
        userId: salesReps['Kabir Sales']._id,
        companyId: novaSphere._id,
        action: 'DEAL_STAGE_UPDATE',
        details: { text: 'Proposal sent to Kabir Patel (Vertex Digital - $32,000)' },
        createdAt: new Date(nowMs - 60 * 60000), // 1 hour ago
      },
      {
        userId: salesReps['Neha Sales']._id,
        companyId: novaSphere._id,
        action: 'CUSTOMER_NOTE_ADD',
        details: { text: 'Customer meeting completed with Ananya Sharma (CloudPulse Labs)' },
        createdAt: new Date(nowMs - 2 * 3600000), // 2 hours ago
      },
      {
        userId: salesReps['Neha Sales']._id,
        companyId: novaSphere._id,
        action: 'DEAL_STAGE_UPDATE',
        details: { text: 'Deal stage updated to Negotiation for Multi-Tenant Cloud Infrastructure' },
        createdAt: new Date(nowMs - 3 * 3600000), // 3 hours ago
      },
      {
        userId: abhiUser._id,
        companyId: novaSphere._id,
        action: 'INVITE_SEND',
        details: { text: 'New lead assigned: Ananya Sharma to Neha Sales' },
        createdAt: new Date(nowMs - 5 * 3600000), // 5 hours ago
      },
      {
        userId: salesReps['Riya Sales']._id,
        companyId: novaSphere._id,
        action: 'DEAL_STAGE_UPDATE',
        details: { text: 'Deal marked as Won: Global Analytics Platform Expansion ($60,000)' },
        createdAt: new Date(nowMs - 8 * 3600000), // 8 hours ago
      },
      {
        userId: salesReps['Kabir Sales']._id,
        companyId: novaSphere._id,
        action: 'TASK_CREATE',
        details: { text: 'Follow-up reminder created for CleanTech Automated Pipeline' },
        createdAt: new Date(nowMs - 12 * 3600000), // 12 hours ago
      },
      {
        userId: salesReps['Neha Sales']._id,
        companyId: novaSphere._id,
        action: 'AI_EMAIL_GENERATE',
        details: { text: 'Email sent: Pricing quote delivered to Tanvi Rao (OmniStream Media)' },
        createdAt: new Date(nowMs - 28 * 3600000), // Yesterday
      },
      {
        userId: salesReps['Neha Sales']._id,
        companyId: novaSphere._id,
        action: 'DEAL_STAGE_UPDATE',
        details: { text: 'Deal stage updated to Proposal for OmniChannel Marketing Integration' },
        createdAt: new Date(nowMs - 32 * 3600000), // Yesterday
      },
      {
        userId: salesReps['Neha Sales']._id,
        companyId: novaSphere._id,
        action: 'DEAL_CREATE',
        details: { text: 'New sales opportunity created: Custom Predictive AI Dashboard ($52,000)' },
        createdAt: new Date(nowMs - 2 * 86400000), // 2 days ago
      },
      {
        userId: salesReps['Aarav Sales']._id,
        companyId: novaSphere._id,
        action: 'DEAL_STAGE_UPDATE',
        details: { text: 'Deal marked as Won: Enterprise Financial Suite ($75,000)' },
        createdAt: new Date(nowMs - 3 * 86400000), // 3 days ago
      },
      {
        userId: abhiUser._id,
        companyId: novaSphere._id,
        action: 'AI_NOTE_SUMMARIZE',
        details: { text: 'Executive briefing conducted with Siddharth Roy (Elevate Financial)' },
        createdAt: new Date(nowMs - 4 * 86400000), // 4 days ago
      },
      {
        userId: salesReps['Aarav Sales']._id,
        companyId: novaSphere._id,
        action: 'CUSTOMER_CREATE',
        details: { text: 'Initial discovery call completed with Vikram Malhotra (Apex Dynamics)' },
        createdAt: new Date(nowMs - 5 * 86400000), // 5 days ago
      },
    ];

    await ActivityLog.insertMany(activityLogsData);

    // 9. Seed Notifications for abhi@gmail.com
    const notificationsData = [
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'deal' as const,
        title: 'Deal Marked as Won!',
        message: 'Siddharth Roy closed Elevate Financial contract worth $75,000.',
        link: '/deals',
        isRead: false,
        createdAt: new Date(nowMs - 15 * 60000),
      },
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'task' as const,
        title: 'Follow-up Reminder Due',
        message: 'Prepare product demo deck for BrightCore Systems.',
        link: '/tasks',
        isRead: false,
        createdAt: new Date(nowMs - 45 * 60000),
      },
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'info' as const,
        title: 'New Lead Assigned',
        message: 'Ananya Sharma (CloudPulse Labs) assigned to Neha Sales.',
        link: '/leads',
        isRead: true,
        createdAt: new Date(nowMs - 2 * 3600000),
      },
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'success' as const,
        title: 'Proposal Approved',
        message: 'Vertex Digital reviewed and approved the $32,000 proposal.',
        link: '/deals',
        isRead: true,
        createdAt: new Date(nowMs - 5 * 3600000),
      },
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'warning' as const,
        title: 'Deal Approaching Expected Close Date',
        message: 'Multi-Tenant Cloud Infrastructure ($45,000) expected to close in 5 days.',
        link: '/deals',
        isRead: false,
        createdAt: new Date(nowMs - 12 * 3600000),
      },
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'info' as const,
        title: 'Customer Requested Demo',
        message: 'Aarav Mehta requested AI feature demonstration for NovaTech Solutions.',
        link: '/leads',
        isRead: false,
        createdAt: new Date(nowMs - 24 * 3600000),
      },
      {
        user: abhiUser._id,
        companyId: novaSphere._id,
        type: 'deal' as const,
        title: 'New Enterprise Opportunity Created',
        message: 'Custom Predictive AI Dashboard ($52,000) added to pipeline.',
        link: '/deals',
        isRead: true,
        createdAt: new Date(nowMs - 48 * 3600000),
      },
    ];

    await Notification.insertMany(notificationsData);

    // 10. Ensure KpiSetting is zeroed out so dashboard metrics calculate dynamically from seeded Deals
    await KpiSetting.deleteMany({});
    await KpiSetting.create({
      closedRevenue: 0,
      activePipeline: 0,
      winRate: 0,
      avgDealSize: 0,
    });

    console.log('[SEED] ✅ Demo Data Seeding completed successfully!');
    console.log(`[SEED] Account: ${targetEmail} | Password: ${targetPassword} | Company: NovaSphere Technologies`);
  } catch (error: any) {
    console.error('[SEED] ❌ Seeding error:', error.message, error.stack);
  }
};

export default seedDatabase;

