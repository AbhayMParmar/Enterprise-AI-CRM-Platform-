import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Deal } from '../models/Deal';
import { Company } from '../models/Company';

export const seedDatabase = async (): Promise<void> => {
  try {
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
      console.log(`[SEED] Created default demo company: Acme Enterprise Solutions (Join Code: ACME2026)`);
    }

    // 3. Ensure System Admin user exists and is active with companyId
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
        companies: [{ companyId: demoCompany._id, role: 'COMPANY_OWNER' }],
      });
      console.log(`[SEED] Created default Admin user: ${adminEmail}`);
    } else {
      let needsSave = false;
      if (adminUser.accountStatus !== 'ACTIVE') {
        adminUser.accountStatus = 'ACTIVE';
        needsSave = true;
      }
      if (!adminUser.companyId) {
        adminUser.companyId = demoCompany._id as any;
        adminUser.companies = [{ companyId: demoCompany._id as any, role: 'COMPANY_OWNER' as any }];
        needsSave = true;
      }
      if (needsSave) {
        await adminUser.save();
        console.log(`[SEED] Updated default Admin user status to ACTIVE with companyId.`);
      }
    }

    // 2. Seed Default Customer Contacts if empty
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      const adminUser = await User.findOne({ email: 'admin@aicrm.com' });

      const sampleCustomers = [
        {
          name: 'Robert Stark',
          email: 'robert@starkindustries.com',
          company: 'Stark Industries',
          phone: '+1 (555) 019-2831',
          status: 'Proposal',
          value: 185000,
          assignedTo: adminUser?._id,
          tags: ['Enterprise', 'Tech', 'High Value'],
          notes: [{ content: 'Initial discovery call completed. Proposal deck delivered.', createdBy: adminUser?._id }],
        },
        {
          name: 'Diana Prince',
          email: 'diana@themyscira.org',
          company: 'Global Defense Systems',
          phone: '+1 (555) 082-9912',
          status: 'Negotiation',
          value: 92000,
          assignedTo: adminUser?._id,
          tags: ['Government', 'Security'],
          notes: [{ content: 'Contract redlines under review with legal team.', createdBy: adminUser?._id }],
        },
        {
          name: 'Wayne Tech Group',
          email: 'bruce@waynentech.com',
          company: 'Wayne Enterprises',
          phone: '+1 (555) 012-[384]',
          status: 'Won',
          value: 340000,
          assignedTo: adminUser?._id,
          tags: ['VIP', 'Closed Won'],
          notes: [{ content: 'Contract signed. Onboarding scheduled for next week.', createdBy: adminUser?._id }],
        },
      ];

      const createdCustomers = await Customer.insertMany(sampleCustomers);

      // 3. Seed Default Deals for Kanban Pipeline
      const sampleDeals = [
        {
          title: 'Stark Enterprise AI CRM System',
          customer: createdCustomers[0]._id,
          value: 185000,
          stage: 'Proposal' as const,
          probability: 50,
          assignedTo: adminUser?._id,
        },
        {
          title: 'Global Defense Cloud Infrastructure',
          customer: createdCustomers[1]._id,
          value: 92000,
          stage: 'Negotiation' as const,
          probability: 75,
          assignedTo: adminUser?._id,
        },
        {
          title: 'Wayne Enterprises Multi-Cloud Contract',
          customer: createdCustomers[2]._id,
          value: 340000,
          stage: 'Won' as const,
          probability: 100,
          assignedTo: adminUser?._id,
        },
        {
          title: 'Apex Pilot Platform Integration',
          customer: createdCustomers[0]._id,
          value: 45000,
          stage: 'Lead' as const,
          probability: 10,
          assignedTo: adminUser?._id,
        },
      ];

      await Deal.insertMany(sampleDeals);
    }
  } catch (error: any) {
    console.error('Seeding default data encountered an error:', error.message);
  }
};

export default seedDatabase;
