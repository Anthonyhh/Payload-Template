import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getPayload } from 'payload'
import config from '../payload.config'

// Helper to build a minimal Lexical richText node from plain text
function richTextFromParagraph(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
          direction: 'ltr',
        },
      ],
      direction: 'ltr',
    },
  }
}

// Helper: build richText from multiple paragraphs
function richTextFromParagraphs(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
        direction: 'ltr',
      })),
      direction: 'ltr',
    },
  }
}

// -----------------------------------------------------------------------
// STEP 1: Update Hero Section Global
// -----------------------------------------------------------------------
async function seedHeroSection(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Updating hero-section global ---')
  await payload.updateGlobal({
    slug: 'hero-section',
    data: {
      badge: {
        text: 'AI Automation Specialists',
        icon: 'sparkles',
      },
      headline: 'We Build AI Systems That Save UK Businesses £50K+ Per Year',
      subheadline:
        'Practical AI automation for UK SMEs and mid-market — from first workflow to Fractional CAIO. Start with a £97 audit, or book a call.',
      primaryCta: {
        text: 'Get Your Free AI Audit',
        action: 'scrollTo',
        target: '/ai-readiness-audit',
      },
      secondaryCta: {
        text: 'See How It Works',
        target: '/#services',
      },
      visualType: 'aiWorkflow',
    },
  })
  console.log('  Hero section updated')
}

// -----------------------------------------------------------------------
// STEP 2: Seed 6 Services
// -----------------------------------------------------------------------
async function seedServices(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Seeding services ---')

  const servicesData = [
    {
      title: 'AI Strategy',
      description:
        'A 90-day roadmap with 3 prioritised automations your team can implement immediately. Stop wondering where AI fits — know exactly what to build first.',
      icon: 'brain' as const,
      features: [
        { feature: '£50K+ annual savings identified' },
        { feature: '90-day implementation roadmap' },
        { feature: 'No in-house AI team required' },
      ],
      ctaText: 'Get Your AI Roadmap',
      ctaLink: '/services/ai-strategy',
      order: 1,
      isActive: true,
    },
    {
      title: 'AI Workflow Automation',
      description:
        'We automate the manual processes costing you £50K+ per year. Invoice approvals, scheduling, reporting, data entry — gone.',
      icon: 'zap' as const,
      features: [
        { feature: 'Invoice processing 5 days → 4 hours' },
        { feature: '40+ hours/week reclaimed' },
        { feature: 'ROI in 90 days guaranteed' },
      ],
      ctaText: 'Automate Your Workflows',
      ctaLink: '/services/ai-workflow-automation',
      order: 2,
      isActive: true,
    },
    {
      title: 'Agentic AI Systems',
      description:
        'Autonomous agents that handle multi-step business processes end-to-end, escalating to humans only when genuinely needed.',
      icon: 'bot' as const,
      features: [
        { feature: '24/7 autonomous operations' },
        { feature: 'Human escalation when needed' },
        { feature: 'Scales without additional headcount' },
      ],
      ctaText: 'Deploy AI Agents',
      ctaLink: '/services/agentic-ai',
      order: 3,
      isActive: true,
    },
    {
      title: 'Prompt Engineering',
      description:
        'Custom prompts and AI pipelines that cut your team\'s generation time by 60% while maintaining quality and brand voice.',
      icon: 'sparkles' as const,
      features: [
        { feature: '60% faster content generation' },
        { feature: 'Consistent brand voice at scale' },
        { feature: 'Works with your existing tools' },
      ],
      ctaText: 'Optimise Your AI Output',
      ctaLink: '/services/prompt-engineering',
      order: 4,
      isActive: true,
    },
    {
      title: 'Data & ML Solutions',
      description:
        'Turn your operational data into predictions that reduce costs, forecast demand, and identify opportunities before your competitors.',
      icon: 'database' as const,
      features: [
        { feature: 'Demand forecasting accuracy >90%' },
        { feature: 'Real-time operational dashboards' },
        { feature: 'Predictive maintenance alerts' },
      ],
      ctaText: 'Unlock Your Data',
      ctaLink: '/services/data-ml',
      order: 5,
      isActive: true,
    },
    {
      title: 'Fractional CAIO',
      description:
        'A Chief AI Integration Officer on your leadership team at a fraction of the cost — setting AI strategy, managing vendors, and leading implementation.',
      icon: 'workflow' as const,
      features: [
        { feature: '£5-17K/mo vs £200K+ full-time salary' },
        { feature: 'Direct access, no account managers' },
        { feature: 'Strategy + delivery in one role' },
      ],
      ctaText: 'Talk to Anthony',
      ctaLink: '/services/fractional-caio',
      order: 6,
      isActive: true,
    },
  ]

  for (const service of servicesData) {
    const existing = await payload.find({
      collection: 'services',
      where: { title: { equals: service.title } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'services', data: service })
      console.log(`  Service created: ${service.title}`)
    } else {
      await payload.update({
        collection: 'services',
        id: existing.docs[0].id,
        data: service,
      })
      console.log(`  Service updated: ${service.title}`)
    }
  }
}

// -----------------------------------------------------------------------
// STEP 3: Seed 10 Solutions
// -----------------------------------------------------------------------
async function seedSolutions(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Seeding solutions ---')

  const solutionsData = [
    {
      title: 'Manufacturing Automation',
      description: richTextFromParagraphs([
        '£180K average annual savings. UK manufacturers are losing thousands every week to manual production scheduling, quality reporting, and supplier communications.',
        'We automate production planning cycles from 2 weeks to 4 hours, deploy computer vision quality control that catches 99.2% of defects, and connect your supply chain so purchase orders generate themselves. Your team focuses on the floor, not the spreadsheets.',
      ]),
      benefits: [
        { benefit: '£180K average annual savings' },
        { benefit: 'Production planning: 2 weeks → 4 hours' },
        { benefit: 'Defect detection rate: 85% → 99.2%' },
        { benefit: 'Unplanned downtime cut from 18% to 5%' },
      ],
      order: 1,
      isActive: true,
    },
    {
      title: 'Financial Services Automation',
      description: richTextFromParagraphs([
        '£95K average annual savings. Compliance reporting, client onboarding, and trade processing are consuming your team. The £180K in regulatory fines last year was preventable.',
        'We automate your 47 monthly regulatory reports down to 10 hours of oversight, cut client onboarding from 14 days to 2 days, and achieve 99.9% straight-through trade processing. Compliance becomes your competitive advantage, not your bottleneck.',
      ]),
      benefits: [
        { benefit: '£95K average annual savings' },
        { benefit: 'Regulatory reporting: 200 hours → 10 hours/month' },
        { benefit: 'Client onboarding: 14 days → 2 days' },
        { benefit: '99.8% compliance rate achieved' },
      ],
      order: 2,
      isActive: true,
    },
    {
      title: 'Healthcare Workflow Automation',
      description: richTextFromParagraphs([
        '£75K average annual savings. Clinicians spending 60% of their time on paperwork instead of patients is a crisis — not just for your budget, but for care quality.',
        'We automate patient scheduling across your facilities, deploy voice-to-text clinical documentation that cuts admin time by 70%, and streamline insurance verification from 48 hours to minutes. Your clinicians get 2+ hours back every day.',
      ]),
      benefits: [
        { benefit: '£75K average annual savings' },
        { benefit: 'Clinician admin time cut by 70%' },
        { benefit: 'No-show rate: 25% → 8%' },
        { benefit: 'Claim denial rate: 18% → 3%' },
      ],
      order: 3,
      isActive: true,
    },
    {
      title: 'Legal & Solicitor Automation',
      description: richTextFromParagraphs([
        '40 hours per week reclaimed per fee earner. Contract review, matter management, and client billing are eating your most expensive resource: qualified solicitors\' time.',
        'We deploy AI contract review that flags issues in minutes not days, automate matter management workflows, and connect your billing system so invoices generate themselves. Fee earners bill more, not less, when we remove the admin burden.',
      ]),
      benefits: [
        { benefit: '40 hours/week reclaimed per fee earner' },
        { benefit: 'Contract review time cut by 80%' },
        { benefit: 'Automated matter management and billing' },
        { benefit: 'Scales client capacity without new hires' },
      ],
      order: 4,
      isActive: true,
    },
    {
      title: 'Accountancy Firm Automation',
      description: richTextFromParagraphs([
        '3x more clients, same headcount. Bookkeeping, tax preparation, and client reporting are commodities. Your value is in the advice — not the data entry.',
        'We automate your bookkeeping workflows, connect bank feeds to auto-categorise transactions, generate draft tax returns for review, and produce client-ready management accounts at the click of a button. The firms winning new clients are the ones with capacity to take them on.',
      ]),
      benefits: [
        { benefit: '3x more clients, same team size' },
        { benefit: 'Bookkeeping automation saves 15 hours/client/month' },
        { benefit: 'Automated client reporting and tax prep' },
        { benefit: 'Faster turnaround = better client retention' },
      ],
      order: 5,
      isActive: true,
    },
    {
      title: 'Retail & eCommerce Automation',
      description: richTextFromParagraphs([
        '£125K average annual savings. Manual inventory management, demand forecasting, and supplier reordering are costing you in stockouts, overstock, and missed sales.',
        'We automate demand forecasting with >90% accuracy, connect your inventory system so reorder triggers fire automatically, and streamline supplier communications end-to-end. Your operations run leaner and your margins improve without adding headcount.',
      ]),
      benefits: [
        { benefit: '£125K average annual savings' },
        { benefit: 'Demand forecasting accuracy >90%' },
        { benefit: 'Stockout rate cut by 80%' },
        { benefit: 'Automated supplier reordering and comms' },
      ],
      order: 6,
      isActive: true,
    },
    {
      title: 'Construction & Property Automation',
      description: richTextFromParagraphs([
        'Project delays cut by 35%. Manual project scheduling, materials tracking, and site reporting are adding weeks to your timelines and thousands to your costs.',
        'We automate project scheduling with real-time resource visibility, connect materials tracking so shortages surface before they cause delays, and generate site reports automatically. Your project managers manage projects, not paperwork.',
      ]),
      benefits: [
        { benefit: 'Project delays cut by 35%' },
        { benefit: 'Automated materials tracking and reordering' },
        { benefit: 'Real-time site reporting without manual input' },
        { benefit: 'Resource scheduling optimised across projects' },
      ],
      order: 7,
      isActive: true,
    },
    {
      title: 'Customer Service Automation',
      description: richTextFromParagraphs([
        '85% of tickets resolved without a human agent. Your customer service team is spending 80% of their time answering the same 20 questions. That is not sustainable as you scale.',
        'We deploy AI triage that categorises and routes tickets instantly, FAQ handling that resolves common queries in under 3 minutes, and escalation logic that brings a human in only when genuinely needed. Your team handles the complex cases. The AI handles the rest, 24/7.',
      ]),
      benefits: [
        { benefit: '85% tickets resolved without human agent' },
        { benefit: 'Average response time: 4 hours → 3 minutes' },
        { benefit: '24/7 coverage with no extra headcount' },
        { benefit: 'Customer satisfaction up 22 percentage points' },
      ],
      order: 8,
      isActive: true,
    },
    {
      title: 'Document Processing Automation',
      description: richTextFromParagraphs([
        'Processing time cut from days to minutes. Whether it is invoices, contracts, application forms, or compliance documents — manual data extraction is your bottleneck.',
        'We deploy OCR and AI extraction that pulls structured data from any document format, routes it to the right system, and archives it with a full audit trail. What takes your team days, our system handles in minutes — with higher accuracy and full traceability.',
      ]),
      benefits: [
        { benefit: 'Document processing: days → minutes' },
        { benefit: '99%+ data extraction accuracy' },
        { benefit: 'Automatic routing and archiving' },
        { benefit: 'Full audit trail for compliance' },
      ],
      order: 9,
      isActive: true,
    },
    {
      title: 'Sales & Lead Generation Automation',
      description: richTextFromParagraphs([
        '3x pipeline from the same team size. Your sales team is spending 70% of their time on prospecting, data entry, and admin instead of selling. That is the real pipeline problem.',
        'We deploy AI lead scoring that surfaces your hottest prospects first, automate outreach sequences personalised to each prospect\'s industry and pain points, and enrich your CRM automatically so reps have full context before every call. More conversations. More conversions. Same team.',
      ]),
      benefits: [
        { benefit: '3x pipeline from same team size' },
        { benefit: 'AI lead scoring prioritises highest-value prospects' },
        { benefit: 'Automated personalised outreach sequences' },
        { benefit: 'CRM enrichment and data hygiene automated' },
      ],
      order: 10,
      isActive: true,
    },
  ]

  for (const solution of solutionsData) {
    const existing = await payload.find({
      collection: 'solutions',
      where: { title: { equals: solution.title } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'solutions', data: solution })
      console.log(`  Solution created: ${solution.title}`)
    } else {
      await payload.update({
        collection: 'solutions',
        id: existing.docs[0].id,
        data: solution,
      })
      console.log(`  Solution updated: ${solution.title}`)
    }
  }
}

// -----------------------------------------------------------------------
// STEP 4: Seed 3 Case Studies (as blog-posts with category: case-studies)
// -----------------------------------------------------------------------
async function seedCaseStudies(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Seeding case studies ---')

  const caseStudies = [
    {
      title: 'Manufacturing Excellence: £3.2M Annual Savings at Precision Engineering Solutions',
      slug: 'precision-engineering-manufacturing',
      excerpt:
        'How FlowState IT helped Precision Engineering Solutions achieve £3.2M annual savings through smart factory automation across 4 UK manufacturing sites.',
      content: richTextFromParagraphs([
        'Client: Precision Engineering Solutions Ltd | Industry: Advanced Manufacturing | Size: 650 employees across 4 UK sites | Annual Revenue: £85M | Investment: £520,000 | Annual Savings: £3,200,000 | Productivity Improvement: 45%',
        'Precision Engineering Solutions was facing intense competitive pressure from lower-cost overseas manufacturers while managing complex supply chains and stringent aerospace/automotive quality requirements.',
        'FlowState IT implemented a comprehensive smart factory automation solution covering production planning, quality management, supply chain intelligence, and predictive maintenance.',
        'Results: Production planning cycle reduced from 2 weeks to 4 hours. Capacity utilisation increased from 35% to 78%. Defect detection rate improved from 85% to 99.2%. Rework rate reduced from 12% to 1.8%. Unplanned downtime cut from 18% to 5%. Overall Equipment Effectiveness improved from 65% to 87%.',
        'Financial impact: £380K from reduced rework and scrap, £420K from inventory optimisation, £285K from maintenance cost reduction, £520K from labour efficiency gains, £155K from energy optimisation, £980K from increased capacity utilisation, £460K from premium quality pricing, £340K from new customer acquisition. Total net annual benefit: £3,200,000.',
        'Payback period: 1.95 months. 3-year ROI: 1,846%. Net Present Value: £9,250,000.',
        '"The automation has given me back my time with patients... I am monitoring and optimising multiple production lines instead of just operating one machine." — Mark Thompson, Senior Production Operator',
      ]),
      category: 'case-studies' as const,
      publishedAt: new Date('2025-06-15').toISOString(),
      status: 'published' as const,
    },
    {
      title: '£2.8M Annual Savings: AI Automation in Financial Services at Premier Investment Management',
      slug: 'premier-investment-management',
      excerpt:
        'Premier Investment Management achieved £2.8M annual savings and 99.8% regulatory compliance through comprehensive AI automation of reporting, onboarding and trade processing.',
      content: richTextFromParagraphs([
        'Client: Premier Investment Management | Industry: Investment Banking & Asset Management | Size: 850 employees, £2.5B AUM | Location: London, UK | Investment: £450,000 | Annual Savings: £2,800,000',
        'Premier Investment Management faced mounting pressure from regulatory requirements and manual processes consuming 60% of operational capacity. 47 regulatory reports required monthly, each taking 200+ hours of manual compilation. Client onboarding averaged 14 days with 65% of applications delayed.',
        'FlowState IT implemented an intelligent automation ecosystem: automated regulatory reporting reducing manual time from 200 to 10 hours/month, AI-powered client onboarding reducing processing time from 14 days to 2 days, automated trade matching achieving 99.9% straight-through processing, and real-time risk management cutting calculation time from 6 hours to 15 minutes.',
        'Financial results: £680K from regulatory reporting automation, £520K from faster client onboarding, £400K from trade processing improvements, £475K from risk management, £120K in eliminated compliance fines, £605K in additional revenue. Total annual impact: £2,800,000.',
        'Compliance improved from 85% to 99.8%. Client satisfaction increased from 72% to 94%. Error rate reduced from 8.5% to 0.3%.',
        'Payback period: 1.9 months. 3-year ROI: 1,844%. Net Present Value: £7,850,000.',
        '"FlowStateIT did not just automate our processes — they transformed how we operate as a business." — Sarah Mitchell, CEO, Premier Investment Management',
      ]),
      category: 'case-studies' as const,
      publishedAt: new Date('2025-07-10').toISOString(),
      status: 'published' as const,
    },
    {
      title: 'Transforming Patient Care: £1.85M Annual Savings at Meridian Healthcare Network',
      slug: 'meridian-healthcare-network',
      excerpt:
        'Meridian Healthcare Network saved £1.85M annually while improving patient satisfaction from 78% to 94% through AI-powered scheduling, documentation, and billing automation.',
      content: richTextFromParagraphs([
        'Client: Meridian Healthcare Network | Industry: Private Healthcare | Size: 1,200 employees, 25 facilities | Patient Volume: 150,000+ annually | Investment: £380,000 | Annual Savings: £1,850,000 | Patient Satisfaction: 78% → 94%',
        'Meridian Healthcare was struggling with administrative processes impacting patient care. Clinicians were spending 60% of their time on documentation. Patient onboarding averaged 5 days. No-show rate was 25% due to poor communication. 18% of insurance claims required manual intervention.',
        'FlowState IT implemented a healthcare automation platform: AI-powered patient onboarding reducing processing from 5 days to 8 hours, intelligent scheduling cutting no-show rates from 25% to 8%, voice-to-text clinical documentation saving each clinician 2.1 hours per day, and automated billing reducing claim denial rate from 18% to 3%.',
        'Revenue enhancements: £485K from improved facility utilisation, £165K from reduced no-shows, £425K from faster payment collection, £185K from reduced claim denials, £275K from premium service positioning. Cost reductions: £245K from administrative labour, £180K from overtime reduction, £35K from paper/processing, £85K from compliance. Total net annual savings: £1,850,000.',
        'Clinician patient-facing time increased 40%. Medical error rate reduced by 45%. Compliance audit score improved from 89% to 98%.',
        'Payback period: 2.5 months. 3-year ROI: 1,452%. Net Present Value: £5,850,000.',
        '"The automation has given me back my time with patients. I am spending 70% less time on documentation and can focus on what I became a doctor for." — Dr. Amanda Foster, Consultant Cardiologist',
      ]),
      category: 'case-studies' as const,
      publishedAt: new Date('2025-08-01').toISOString(),
      status: 'published' as const,
    },
  ]

  for (const caseStudy of caseStudies) {
    const existing = await payload.find({
      collection: 'blog-posts',
      where: { slug: { equals: caseStudy.slug } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'blog-posts', data: caseStudy })
      console.log(`  Case study created: ${caseStudy.title.substring(0, 60)}...`)
    } else {
      await payload.update({
        collection: 'blog-posts',
        id: existing.docs[0].id,
        data: caseStudy,
      })
      console.log(`  Case study updated: ${caseStudy.title.substring(0, 60)}...`)
    }
  }
}

// -----------------------------------------------------------------------
// STEP 5: Seed 8 FAQs
// -----------------------------------------------------------------------
async function seedFAQs(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Seeding FAQs ---')

  const faqsData = [
    {
      question: 'Is AI right for a business our size?',
      answer: richTextFromParagraph(
        'Yes. Our clients range from 10 to 250 employees. The ROI is often higher for smaller businesses because manual processes represent a larger share of operational cost. The £97 audit tells you exactly what is achievable for your business.',
      ),
      category: 'general' as const,
      order: 1,
      isActive: true,
    },
    {
      question: 'How long does implementation take?',
      answer: richTextFromParagraph(
        'From audit to first live automation: 4-8 weeks. A full AI workflow implementation runs 8-16 weeks depending on complexity. We give you a fixed timeline before any work begins.',
      ),
      category: 'services' as const,
      order: 2,
      isActive: true,
    },
    {
      question: 'Do we need an in-house IT team?',
      answer: richTextFromParagraph(
        'No. We handle the technical implementation. Your team learns to use the tools, not build them. Most clients have zero technical staff involved in day-to-day operation after launch.',
      ),
      category: 'technical' as const,
      order: 3,
      isActive: true,
    },
    {
      question: 'What if it does not work for us?',
      answer: richTextFromParagraph(
        'If the audit does not identify at least £10,000 in potential annual savings for your business, we refund every penny. No quibbles.',
      ),
      category: 'audit' as const,
      order: 4,
      isActive: true,
    },
    {
      question: 'What is the difference between the audit and the retainer?',
      answer: richTextFromParagraph(
        'The £97 audit identifies your top 3 automation opportunities and gives you a prioritised roadmap. The £997/mo retainer is for businesses ready to implement — we build, maintain, and continuously optimise your automations.',
      ),
      category: 'pricing' as const,
      order: 5,
      isActive: true,
    },
    {
      question: 'Are you Microsoft or n8n certified?',
      answer: richTextFromParagraph(
        'Yes. We are a Microsoft partner and n8n certified implementation partner. We also work with Make, Zapier, Power Automate, and custom Python/Node solutions depending on your stack.',
      ),
      category: 'technical' as const,
      order: 6,
      isActive: true,
    },
    {
      question: 'How quickly will I see ROI?',
      answer: richTextFromParagraph(
        'Most clients see measurable ROI within 90 days of first automation going live. The audit gives you a specific projection for your business based on your current processes.',
      ),
      category: 'general' as const,
      order: 7,
      isActive: true,
    },
    {
      question: 'What does the £97 audit actually include?',
      answer: richTextFromParagraph(
        'A 10-minute online assessment, a 24-hour AI analysis of your responses, and a personalised PDF report with: your top 3 automation opportunities, estimated annual savings per opportunity, implementation complexity rating, and a recommended starting point.',
      ),
      category: 'audit' as const,
      order: 8,
      isActive: true,
    },
  ]

  for (const faq of faqsData) {
    const existing = await payload.find({
      collection: 'faqs',
      where: { question: { equals: faq.question } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'faqs', data: faq })
      console.log(`  FAQ created: ${faq.question.substring(0, 60)}...`)
    } else {
      await payload.update({
        collection: 'faqs',
        id: existing.docs[0].id,
        data: faq,
      })
      console.log(`  FAQ updated: ${faq.question.substring(0, 60)}...`)
    }
  }
}

// -----------------------------------------------------------------------
// STEP 6: Seed 3 Pricing Tiers
// -----------------------------------------------------------------------
async function seedPricingTiers(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Seeding pricing tiers ---')

  const pricingData = [
    {
      tierName: 'AI Readiness Audit',
      subtitle: 'Before committing to anything larger, get a clear picture of your automation opportunities.',
      priceAmount: 97,
      priceLabel: 'one-time',
      isPriceCustom: false,
      ctaText: 'Get Your AI Audit — £97',
      ctaLink: '/ai-readiness-audit',
      features: [
        { text: '10-minute online assessment', icon: 'check' as const },
        { text: 'Top 3 automation opportunities identified', icon: 'check' as const },
        { text: 'Estimated annual savings per opportunity', icon: 'check' as const },
        { text: 'Implementation complexity rating', icon: 'check' as const },
        { text: '24-hour personalised PDF report', icon: 'zap' as const },
        { text: '£10K savings guaranteed or full refund', icon: 'star' as const },
      ],
      order: 1,
      isActive: true,
      highlightColor: 'none' as const,
    },
    {
      tierName: 'AI Growth Retainer',
      subtitle: 'Monthly AI automation implementation, optimisation, and support. Cancel anytime.',
      priceAmount: 997,
      priceLabel: '/month',
      isPriceCustom: false,
      ctaText: 'Start Your Retainer',
      ctaLink: '#contact',
      features: [
        { text: 'Monthly AI strategy and roadmap review', icon: 'star' as const },
        { text: 'Up to 10 hours implementation support', icon: 'check' as const },
        { text: 'Priority WhatsApp access to Anthony', icon: 'zap' as const },
        { text: 'All automation templates included', icon: 'check' as const },
        { text: 'Quarterly ROI report', icon: 'check' as const },
        { text: 'No long-term contract — cancel anytime', icon: 'check' as const },
      ],
      order: 2,
      isActive: true,
      highlightColor: 'purple' as const,
    },
    {
      tierName: 'Fractional CAIO',
      subtitle: 'A Chief AI Integration Officer on your leadership team. Strategy, delivery, and vendor management.',
      priceLabel: '/month',
      isPriceCustom: true,
      ctaText: 'Talk to Anthony',
      ctaLink: '#contact',
      features: [
        { text: 'From £5,000/mo (vs £200K+ full-time salary)', icon: 'star' as const },
        { text: 'Direct access — no account managers', icon: 'check' as const },
        { text: 'AI strategy + delivery in one role', icon: 'check' as const },
        { text: 'Vendor selection and management', icon: 'check' as const },
        { text: 'Board-level AI reporting and governance', icon: 'check' as const },
        { text: 'Team training and capability building', icon: 'check' as const },
      ],
      order: 3,
      isActive: true,
      highlightColor: 'orange' as const,
    },
  ]

  for (const tier of pricingData) {
    const existing = await payload.find({
      collection: 'pricing-tiers',
      where: { tierName: { equals: tier.tierName } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'pricing-tiers', data: tier })
      console.log(`  Pricing tier created: ${tier.tierName}`)
    } else {
      await payload.update({
        collection: 'pricing-tiers',
        id: existing.docs[0].id,
        data: tier,
      })
      console.log(`  Pricing tier updated: ${tier.tierName}`)
    }
  }
}

// -----------------------------------------------------------------------
// STEP 7: Seed 5 Process Steps
// -----------------------------------------------------------------------
async function seedProcessSteps(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Seeding process steps ---')

  const processStepsData = [
    {
      stepNumber: 1,
      title: 'Audit',
      description:
        'We map your current processes and identify the top 3 automation opportunities — with projected ROI for each. Takes 10 minutes online, report delivered in 24 hours.',
      icon: 'search' as const,
      order: 1,
    },
    {
      stepNumber: 2,
      title: 'Strategy',
      description:
        'We present your prioritised roadmap: what to build first, why, and what it will save. One strategy call, delivered within 1 week.',
      icon: 'lightbulb' as const,
      order: 2,
    },
    {
      stepNumber: 3,
      title: 'Build',
      description:
        'We build and test your automation system, with weekly progress updates. No surprises — you see progress every step of the way. Typically 4-8 weeks.',
      icon: 'code' as const,
      order: 3,
    },
    {
      stepNumber: 4,
      title: 'Launch',
      description:
        'Your automation goes live. We monitor for the first 30 days to ensure everything runs correctly, with daily check-ins in week one.',
      icon: 'rocket' as const,
      order: 4,
    },
    {
      stepNumber: 5,
      title: 'Optimise',
      description:
        'Monthly reviews to improve performance and identify the next automation opportunity. Your ROI grows over time — not just at launch.',
      icon: 'target' as const,
      order: 5,
    },
  ]

  for (const step of processStepsData) {
    const existing = await payload.find({
      collection: 'process-steps',
      where: { title: { equals: step.title } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'process-steps', data: step })
      console.log(`  Process step created: ${step.title}`)
    } else {
      await payload.update({
        collection: 'process-steps',
        id: existing.docs[0].id,
        data: step,
      })
      console.log(`  Process step updated: ${step.title}`)
    }
  }
}

// -----------------------------------------------------------------------
// STEP 8: Migrate 10 Blog Posts from markdown files
// -----------------------------------------------------------------------

// Simple frontmatter parser — splits on --- delimiters, no external deps
function parseFrontmatter(content: string): { data: Record<string, string>; body: string } {
  const lines = content.split('\n')
  const data: Record<string, string> = {}

  // Check if first non-empty line is '---'
  let idx = 0
  // Skip BOM or empty lines
  while (idx < lines.length && lines[idx].trim() === '') idx++

  if (lines[idx]?.trim() !== '---') {
    // No frontmatter — treat title as h1 if present
    const titleMatch = content.match(/^#\s+(.+)/m)
    if (titleMatch) data['title'] = titleMatch[1].trim()
    const metaMatch = content.match(/\*\*Meta Description:\*\*\s*(.+)/m)
    if (metaMatch) data['description'] = metaMatch[1].trim()
    return { data, body: content }
  }

  idx++ // skip opening ---
  const fmLines: string[] = []
  while (idx < lines.length && lines[idx].trim() !== '---') {
    fmLines.push(lines[idx])
    idx++
  }
  idx++ // skip closing ---

  for (const line of fmLines) {
    const match = line.match(/^(\w+):\s*(.*)$/)
    if (match) {
      data[match[1]] = match[2].replace(/^["']|["']$/g, '').trim()
    }
  }

  return { data, body: lines.slice(idx).join('\n').trim() }
}

// Map filename (without .md) to slug
function filenameToSlug(filename: string): string {
  return filename.replace(/\.md$/, '').toLowerCase()
}

// Map category string to valid enum value
type BlogCategory = 'ai-strategy' | 'case-studies' | 'tutorials' | 'insights' | 'updates'
function mapCategory(rawCategory: string | undefined): BlogCategory {
  if (!rawCategory) return 'insights'
  const lower = rawCategory.toLowerCase()
  if (lower.includes('case') || lower.includes('study')) return 'case-studies'
  if (lower.includes('tutorial') || lower.includes('guide') || lower.includes('how')) return 'tutorials'
  if (lower.includes('strategy') || lower.includes('ai strategy')) return 'ai-strategy'
  if (lower.includes('update') || lower.includes('news')) return 'updates'
  return 'insights'
}

// Extract a good excerpt from blog content (first 180 chars of meaningful text)
function extractExcerpt(body: string): string {
  // Remove markdown headings, bold markers, links
  const cleaned = body
    .replace(/^#{1,6}\s+.*/gm, '') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/^[\s\-*>]+/gm, '') // list markers and blockquotes
    .replace(/\n{2,}/g, '\n')
    .trim()

  // Find first substantive sentence (at least 40 chars)
  const sentences = cleaned.split(/(?<=[.!?])\s+/)
  for (const sentence of sentences) {
    const s = sentence.trim()
    if (s.length >= 40 && s.length <= 200) {
      return s.substring(0, 198)
    }
  }

  // Fallback: first 180 chars of cleaned text
  const flat = cleaned.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  return flat.substring(0, 198)
}

// Map blog filename to category
function mapFilenameToCategory(filename: string): BlogCategory {
  if (filename.includes('case-stud')) return 'case-studies'
  if (filename.includes('tutorial') || filename.includes('guide')) return 'tutorials'
  if (filename.includes('ai-strategy') || filename.includes('strategy')) return 'ai-strategy'
  return 'insights'
}

// Known titles for files that have no YAML frontmatter
const KNOWN_TITLES: Record<string, string> = {
  'ai-workflow-automation-cost-savings-uk-smes': 'How AI Workflow Automation Saves UK SMEs £50K+ Annually',
  'ai-customer-service-automation': 'AI-Driven Customer Service Automation: Transform Support into a Competitive Advantage',
  'ai-manufacturing-process-optimization': 'AI Manufacturing Process Optimization: Smart Factory Guide for UK Manufacturers',
  'ai-retail-inventory-management': 'AI Retail Inventory Management: Cut Stockouts by 80% and Boost Margins',
  'business-automation-roi-analysis': 'Business Automation ROI Analysis: The Complete UK SME Guide',
  'business-process-automation-signs': '7 Signs Your Business Needs Process Automation Now',
  'construction-automation-project-management': 'Construction Automation: Cut Project Delays by 35% with AI Project Management',
  'financial-process-automation-best-practices': 'Financial Process Automation Best Practices for UK Financial Services Firms',
  'healthcare-workflow-automation-solutions': 'Healthcare Workflow Automation: Save £75K Annually While Improving Patient Care',
  'power-apps-implementation-success-stories': 'Power Apps Implementation Success Stories: Real UK Business Results',
}

async function seedBlogPosts(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n--- Migrating blog posts ---')

  // Windows path (Node.js on Windows uses native paths, not Unix-style)
  const blogDir = 'C:/Users/antho/OneDrive/Documents/Flowstateit/content/blog'

  if (!fs.existsSync(blogDir)) {
    console.warn(`  WARNING: Blog directory not found at ${blogDir}`)
    return
  }

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md') && f !== 'README.md')
  console.log(`  Found ${files.length} blog post files`)

  for (const filename of files) {
    const filePath = path.join(blogDir, filename)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, body } = parseFrontmatter(raw)

    const slug = filenameToSlug(filename)

    // Title: from frontmatter, or h1, or known map
    let title =
      data['title'] ||
      raw.match(/^#\s+(.+)/m)?.[1]?.trim() ||
      KNOWN_TITLES[slug] ||
      slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    // Strip markdown formatting from title
    title = title.replace(/\*\*/g, '').replace(/\*/g, '').trim()

    // Excerpt: from frontmatter description, or extracted from body
    let excerpt =
      data['description'] ||
      data['excerpt'] ||
      extractExcerpt(body)

    // Ensure excerpt fits 200 char limit
    if (excerpt.length > 198) {
      excerpt = excerpt.substring(0, 197) + '…'
    }

    // Category
    const category = data['category']
      ? mapCategory(data['category'])
      : mapFilenameToCategory(filename)

    // Published date
    const rawDate = data['date'] || data['publishedAt'] || data['published_at']
    const publishedAt = rawDate ? new Date(rawDate).toISOString() : new Date('2025-08-21').toISOString()

    // Content — store body as richText
    const content = richTextFromParagraph(
      body.length > 5000 ? body.substring(0, 5000) + '...[content continues]' : body,
    )

    // Read time estimate
    const wordCount = body.split(/\s+/).length
    const readTime = Math.max(1, Math.ceil(wordCount / 200))

    const postData = {
      title,
      slug,
      excerpt,
      content,
      category,
      publishedAt,
      status: 'published' as const,
      readTime,
    }

    const existing = await payload.find({
      collection: 'blog-posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'blog-posts', data: postData })
      console.log(`  Blog post created: ${title.substring(0, 60)}`)
    } else {
      await payload.update({
        collection: 'blog-posts',
        id: existing.docs[0].id,
        data: postData,
      })
      console.log(`  Blog post updated: ${title.substring(0, 60)}`)
    }
  }
}

// -----------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------
async function seedPhase2() {
  console.log('=== Phase 2 Seed Script — FlowState IT ===')
  console.log('Seeding all Phase 2 content into Payload CMS...\n')

  const payload = await getPayload({ config })

  await seedHeroSection(payload)
  await seedServices(payload)
  await seedSolutions(payload)
  await seedCaseStudies(payload)
  await seedFAQs(payload)
  await seedPricingTiers(payload)
  await seedProcessSteps(payload)
  await seedBlogPosts(payload)

  console.log('\n=== Phase 2 seed complete ===')
  await payload.db.destroy().catch(() => {})
  process.exit(0)
}

seedPhase2().catch((error) => {
  console.error('Fatal error during Phase 2 seeding:', error)
  process.exit(1)
})
