import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config } from '../config/config';
import { UserRole, LeadStage, AutomationTrigger, WhatsAppProvider, MessageDirection, ActivityType } from '../types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data
    await cleanDatabase();

    // Create builder
    const builder = await createBuilder();

    // Create users
    const users = await createUsers(builder.id);

    // Create projects
    const projects = await createProjects(builder.id);

    // Create message templates
    const templates = await createMessageTemplates(builder.id);

    // Create automation sequences
    const sequences = await createAutomationSequences(builder.id, templates);

    // Create WhatsApp configuration
    await createWhatsAppConfig(builder.id);

    // Create sample leads
    await createSampleLeads(builder.id, projects, users);

    // Create activities for leads
    await createSampleActivities(users, projects);

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Seeding Summary:
- Builder: ${builder.name}
- Users: ${users.length} created
- Projects: ${projects.length} created
- Templates: ${templates.length} created
- Sequences: ${sequences.length} created
- Leads: 10 sample leads created
- Activities: ${projects.length * 2} sample activities created

🚀 Login Credentials:
Email: admin@xavira.demo
Password: Xavira@123

🎯 Demo Mode: ${config.demo.enabled ? 'ENABLED' : 'DISABLED'}

📱 API Documentation: http://localhost:3001/api-docs
🏠 Health Check: http://localhost:3001/health
    `);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');

  // Delete in order of dependencies
  await prisma.activity.deleteMany({});
  await prisma.messageLog.deleteMany({});
  await prisma.sequenceExecution.deleteMany({});
  await prisma.automationStep.deleteMany({});
  await prisma.automationSequence.deleteMany({});
  await prisma.messageTemplate.deleteMany({});
  await prisma.whatsappConfig.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.builder.deleteMany({});

  console.log('✅ Database cleaned');
}

async function createBuilder() {
  console.log('🏢 Creating builder...');

  const builder = await prisma.builder.create({
    data: {
      name: 'Xavira Demo Properties',
      subdomain: 'demo',
    },
  });

  console.log(`✅ Created builder: ${builder.name}`);
  return builder;
}

async function createUsers(builderId: string) {
  console.log('👥 Creating users...');

  const passwordHash = await bcrypt.hash('Xavira@123', 12);

  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@xavira.demo',
        passwordHash,
        role: UserRole.ADMIN,
        builderId,
      },
    }),

    // Manager user
    prisma.user.create({
      data: {
        name: 'Manager User',
        email: 'manager@xavira.demo',
        passwordHash,
        role: UserRole.MANAGER,
        builderId,
      },
    }),

    // Agent users
    prisma.user.createMany({
      data: [
        {
          name: 'Agent One',
          email: 'agent1@xavira.demo',
          passwordHash,
          role: UserRole.AGENT,
          builderId,
        },
        {
          name: 'Agent Two',
          email: 'agent2@xavira.demo',
          passwordHash,
          role: UserRole.AGENT,
          builderId,
        },
      ],
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createProjects(builderId: string) {
  console.log('🏗️ Creating projects...');

  const projects = await prisma.project.createMany({
    data: [
      {
        builderId,
        name: 'Sunrise Apartments',
        city: 'Mumbai',
        description: 'Luxury residential apartments with modern amenities',
        isActive: true,
      },
      {
        builderId,
        name: 'Business Plaza',
        city: 'Bangalore',
        description: 'Premium commercial spaces for growing businesses',
        isActive: true,
      },
      {
        builderId,
        name: 'Garden Villas',
        city: 'Pune',
        description: 'Exclusive villas with private gardens and pools',
        isActive: true,
      },
    ],
  });

  console.log(`✅ Created ${projects.length} projects`);
  return projects;
}

async function createMessageTemplates(builderId: string) {
  console.log('📝 Creating message templates...');

  const templates = await prisma.messageTemplate.createMany({
    data: [
      {
        builderId,
        name: 'Welcome Message',
        content: 'Hi {{name}}, thanks for your interest in {{project}}! I\'m {{agent}} from Xavira Properties. When would be a good time to discuss your requirements?',
        variables: ['name', 'project', 'agent'],
        isActive: true,
      },
      {
        builderId,
        name: '24 Hour Follow-up',
        content: 'Hi {{name}}, just wanted to follow up on your inquiry about {{project}}. Do you have any specific questions I can help answer?',
        variables: ['name', 'project'],
        isActive: true,
      },
      {
        builderId,
        name: '72 Hour Follow-up',
        content: 'Hi {{name}}, I hope you\'re doing well. We have some exciting new information about {{project}} that might interest you. Would you like to schedule a call?',
        variables: ['name', 'project'],
        isActive: true,
      },
      {
        builderId,
        name: 'Site Visit Invitation',
        content: 'Hi {{name}}, would you be available for a site visit to {{project}} this weekend? We can show you around and answer all your questions in person.',
        variables: ['name', 'project'],
        isActive: true,
      },
    ],
  });

  console.log(`✅ Created ${templates.length} templates`);
  return templates;
}

async function createAutomationSequences(builderId: string, templates: any[]) {
  console.log('🤖 Creating automation sequences...');

  const sequences = await prisma.automationSequence.createMany({
    data: [
      {
        builderId,
        name: 'Default New Lead Sequence',
        description: 'Automated follow-up for new leads',
        triggerEvent: AutomationTrigger.LEAD_CREATED,
        steps: [
          {
            delayHours: 0,
            messageTemplateId: templates[0].id,
            order: 1,
            businessHoursOnly: false,
          },
          {
            delayHours: 24,
            messageTemplateId: templates[1].id,
            order: 2,
            businessHoursOnly: false,
          },
          {
            delayHours: 72,
            messageTemplateId: templates[2].id,
            order: 3,
            businessHoursOnly: false,
          },
        ],
        isActive: true,
      },
      {
        builderId,
        name: 'Hot Lead Fast Follow-up',
        description: 'Rapid follow-up for hot leads',
        triggerEvent: AutomationTrigger.STAGE_CHANGED,
        triggerStage: LeadStage.HOT,
        steps: [
          {
            delayHours: 1,
            messageTemplateId: templates[3].id,
            order: 1,
            businessHoursOnly: false,
          },
          {
            delayHours: 12,
            messageTemplateId: templates[1].id,
            order: 2,
            businessHoursOnly: false,
          },
        ],
        isActive: true,
      },
    ],
  });

  // Create automation steps
  for (const sequence of sequences) {
    await prisma.automationStep.createMany({
      data: sequence.steps.map((step, index) => ({
        sequenceId: sequence.id,
        messageTemplateId: step.messageTemplateId,
        delayHours: step.delayHours,
        order: step.order,
        businessHoursOnly: step.businessHoursOnly,
      })),
    });
  }

  console.log(`✅ Created ${sequences.length} sequences`);
  return sequences;
}

async function createWhatsAppConfig(builderId: string) {
  console.log('📱 Creating WhatsApp configuration...');

  const config = await prisma.whatsappConfig.create({
    data: {
      builderId,
      provider: WhatsAppProvider.MOCK,
      phoneNumber: '+1234567890',
      isActive: true,
    },
  });

  console.log(`✅ Created WhatsApp config: ${config.provider}`);
  return config;
}

async function createSampleLeads(builderId: string, projects: any[], users: any[]) {
  console.log('👥 Creating sample leads...');

  const leads = await prisma.lead.createMany({
    data: [
      // Lead 1: New from website
      {
        builderId,
        projectId: projects[0].id,
        name: 'Rahul Sharma',
        phone: '+919876543210',
        email: 'rahul.sharma@email.com',
        source: 'website',
        stage: LeadStage.NEW,
        assignedTo: users[2].id, // Agent One
        meta: {
          budget: '50-70 Lakhs',
          timeline: 'Within 3 months',
          preferences: ['2BHK', 'Parking', 'Gym'],
        },
        notes: 'Initial contact made, prospect interested in 2BHK',
      },

      // Lead 2: Hot from Facebook
      {
        builderId,
        projectId: projects[1].id,
        name: 'Priya Patel',
        phone: '+919876543211',
        email: 'priya.patel@email.com',
        source: 'facebook',
        stage: LeadStage.HOT,
        assignedTo: users[2].id, // Agent One
        lastContactedAt: new Date('2024-01-15T10:30:00Z'),
        nextFollowUpAt: new Date('2024-01-16T10:30:00Z'),
        meta: {
          budget: '2-3 Crore',
          timeline: 'Immediate',
          requirements: ['Office space', 'Parking', 'Prime location'],
        },
        notes: 'Highly interested, budget confirmed, ready for site visit',
      },

      // Lead 3: Visiting from referral
      {
        builderId,
        projectId: projects[2].id,
        name: 'Amit Kumar',
        phone: '+919876543212',
        email: 'amit.kumar@email.com',
        source: 'referral',
        stage: LeadStage.VISITING,
        assignedTo: users[3].id, // Agent Two
        lastContactedAt: new Date('2024-01-14T14:00:00Z'),
        meta: {
          budget: '4-5 Crore',
          timeline: 'Within 6 months',
          preferences: ['4BHK', 'Private garden', 'Swimming pool'],
        },
        notes: 'Site visit scheduled for this weekend',
      },

      // Lead 4: New from Instagram
      {
        builderId,
        projectId: projects[0].id,
        name: 'Neha Singh',
        phone: '+919876543213',
        email: 'neha.singh@email.com',
        source: 'instagram',
        stage: LeadStage.NEW,
        assignedTo: users[2].id, // Agent One
        meta: {
          budget: '40-50 Lakhs',
          timeline: '3-6 months',
          preferences: ['3BHK', 'Balcony'],
        },
        notes: 'Looking for family apartment, prefers garden facing',
      },

      // Lead 5: Contacted from email
      {
        builderId,
        projectId: projects[1].id,
        name: 'Sanjay Kumar',
        phone: '+919876543214',
        email: 'sanjay.kumar@email.com',
        source: 'email',
        stage: LeadStage.CONTACTED,
        assignedTo: users[3].id, // Agent Two
        lastContactedAt: new Date('2024-01-12T11:00:00Z'),
        nextFollowUpAt: new Date('2024-01-13T11:00:00Z'),
        meta: {
          budget: '1-2 Crore',
          timeline: 'Within 1 month',
          requirements: ['Small office'],
        },
        notes: 'Discussed requirements, interested in 1BHK commercial space',
      },

      // Lead 6: Booked from Google
      {
        builderId,
        projectId: projects[2].id,
        name: 'Deepak Reddy',
        phone: '+919876543215',
        email: 'deepak.reddy@email.com',
        source: 'google',
        stage: LeadStage.BOOKED,
        assignedTo: users[2].id, // Agent Two
        lastContactedAt: new Date('2024-01-10T16:00:00Z'),
        meta: {
          budget: '5-6 Crore',
          timeline: 'Ready to buy',
          requirements: ['4BHK + Study', 'Gated community'],
        },
        notes: 'Site visit completed, booking confirmed, payment discussions in progress',
      },

      // Lead 7: New from phone call
      {
        builderId,
        projectId: projects[0].id,
        name: 'Anjali Nair',
        phone: '+919876543216',
        source: 'phone',
        stage: LeadStage.NEW,
        assignedTo: users[2].id, // Agent One
        meta: {
          budget: '30-40 Lakhs',
          timeline: '2-3 months',
          preferences: ['2BHK', 'Parking'],
        },
        notes: 'Called in response to newspaper advertisement',
      },

      // Lead 8: Hot from WhatsApp
      {
        builderId,
        projectId: projects[1].id,
        name: 'Rohit Sharma',
        phone: '+919876543217',
        source: 'whatsapp',
        stage: LeadStage.HOT,
        assignedTo: users[2].id, // Agent One
        lastContactedAt: new Date('2024-01-11T09:15:00Z'),
        meta: {
          budget: '3-4 Crore',
          timeline: 'Immediate',
          requirements: ['Commercial space', 'Ground floor'],
        },
        notes: 'Very interested, visited property virtually, wants to schedule site visit',
      },

      // Lead 9: Lost from manual
      {
        builderId,
        projectId: projects[0].id,
        name: 'Pankaj Tripathi',
        phone: '+919876543218',
        source: 'manual',
        stage: LeadStage.LOST,
        assignedTo: users[2].id, // Agent One
        meta: {
          budget: '25-30 Lakhs',
          timeline: '3-4 months',
          reasons: ['Budget too high', 'Location not preferred'],
        },
        notes: 'Budget too high for current project options, looking for alternatives',
      },

      // Lead 10: New from other
      {
        builderId,
        projectId: projects[2].id,
        name: 'Vikram Mehta',
        phone: '+919876543219',
        source: 'other',
        stage: LeadStage.NEW,
        assignedTo: users[3].id, // Agent Two
        meta: {
          budget: '50-70 Lakhs',
          timeline: 'Within 3 months',
          requirements: ['4BHK', 'Parking', 'Club house'],
        },
        notes: 'Walk-in inquiry, interested in premium villa options',
      },
    ],
  });

  console.log(`✅ Created ${leads.length} sample leads`);
  return leads;
}

async function createSampleActivities(users: any[], projects: any[]) {
  console.log('📝 Creating sample activities...');

  const activities = [];
  const now = new Date();

  // Sample activities for each lead (create based on lead stage and assigned user)
  const sampleActivities = [
    // Lead 1 activities
    { leadId: '1', userId: users[2].id, type: ActivityType.NOTE, note: 'Initial contact made, prospect interested in 2BHK', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { leadId: '1', userId: users[2].id, type: ActivityType.WHATSAPP, note: 'Sent welcome message via automation', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { leadId: '1', userId: users[2].id, type: ActivityType.CALL, note: 'Phone call - discussed requirements in detail', createdAt: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
    { leadId: '1', userId: users[2].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from NEW to CONTACTED', createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000), metadata: { oldStage: 'NEW', newStage: 'CONTACTED' } },

    // Lead 2 activities
    { leadId: '2', userId: users[2].id, type: ActivityType.NOTE, note: 'Highly interested, budget confirmed, ready for site visit', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { leadId: '2', userId: users[2].id, type: ActivityType.WHATSAPP, note: 'Sent project brochure via WhatsApp', createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
    { leadId: '2', userId: users[2].id, type: ActivityType.ASSIGNMENT, note: 'Assigned to Agent One', createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), metadata: { assignedBy: 'Admin User', assignedTo: 'Agent One' } },

    // Lead 3 activities
    { leadId: '3', userId: users[3].id, type: ActivityType.NOTE, note: 'Site visit scheduled for this weekend', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { leadId: '3', userId: users[3].id, type: ActivityType.ASSIGNMENT, note: 'Assigned to Agent Two', createdAt: new Date(now.getTime() - 23 * 60 * 60 * 1000), metadata: { assignedBy: 'Admin User', assignedTo: 'Agent Two' } },

    // Lead 4 activities
    { leadId: '4', userId: users[3].id, type: ActivityType.CALL, note: 'Discussed requirements, interested in 1BHK commercial space', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { leadId: '4', userId: users[3].id, type: ActivityType.EMAIL, note: 'Sent commercial space brochures and pricing', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { leadId: '4', userId: users[3].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from NEW to CONTACTED', createdAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'NEW', newStage: 'CONTACTED' } },

    // Lead 5 activities
    { leadId: '5', userId: users[2].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from CONTACTED to HOT', createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'CONTACTED', newStage: 'HOT' } },
    { leadId: '5', userId: users[2].id, type: ActivityType.WHATSAPP, note: 'Sent price list and floor plans', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },

    // Lead 6 activities
    { leadId: '6', userId: users[2].id, type: ActivityType.STAGE_CHANGE, note: 'Site visit completed, booking confirmed', createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'VISITING', newStage: 'BOOKED' } },

    // Lead 7 activities (multiple recent activities)
    { leadId: '7', userId: users[2].id, type: ActivityType.NOTE, note: 'Sent welcome message via automation', createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000) },
    { leadId: '7', userId: users[2].id, type: ActivityType.WHATSAPP, note: 'Prospect responded positively', createdAt: new Date(now.getTime() - 0.25 * 24 * 60 * 60 * 1000) },
    { leadId: '7', userId: users[2].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from NEW to CONTACTED', createdAt: new Date(now.getTime() - 0.2 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'NEW', newStage: 'CONTACTED' } },
    { leadId: '7', userId: users[2].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from CONTACTED to HOT', createdAt: new Date(now.getTime() - 0.1 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'CONTACTED', newStage: 'HOT' } },

    // Lead 8 activities
    { leadId: '8', userId: users[3].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from NEW to CONTACTED', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'NEW', newStage: 'CONTACTED' } },
    { leadId: '8', userId: users[3].id, type: ActivityType.NOTE, note: 'Budget too high for current project options', createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
    { leadId: '8', userId: users[3].id, type: ActivityType.STAGE_CHANGE, note: 'Moved from CONTACTED to LOST', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'CONTACTED', newStage: 'LOST', reason: 'Budget too high' } },

    // Lead 9 activities
    { leadId: '9', userId: users[2].id, type: ActivityType.STAGE_CHANGE, note: 'Site visit scheduled', createdAt: new Date(now.getTime() - 0.1 * 24 * 60 * 60 * 1000), metadata: { oldStage: 'HOT', newStage: 'VISITING' } },
    { leadId: '9', userId: users[2].id, type: ActivityType.NOTE, note: 'Prospect wants to schedule site visit this weekend', createdAt: new Date(now.getTime() - 0.05 * 24 * 60 * 60 * 1000) },

    // Lead 10 activities
    { leadId: '10', userId: users[3].id, type: ActivityType.NOTE, note: 'Walk-in inquiry, interested in premium villa options', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { leadId: '10', userId: users[3].id, type: ActivityType.ASSIGNMENT, note: 'Assigned to Agent Two', createdAt: new Date(now.getTime() - 0.9 * 24 * 60 * 60 * 1000), metadata: { assignedBy: 'Admin User', assignedTo: 'Agent Two' } },
  ];

  await prisma.activity.createMany({
    data: sampleActivities.map((activity, index) => ({
      leadId: activity.leadId,
      userId: activity.userId,
      type: activity.type,
      note: activity.note,
      metadata: activity.metadata || null,
      createdAt: activity.createdAt,
    })),
  });

  console.log(`✅ Created ${sampleActivities.length} sample activities`);
}

// Only run seed if called directly
if (require.main === module) {
  main()
    .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

export default main;