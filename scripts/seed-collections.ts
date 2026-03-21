import dotenv from 'dotenv'
import path from 'path'

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

async function seedCollections() {
  const payload = await getPayload({ config })

  console.log('Seeding FlowState IT collections...')

  // -----------------------------------------------------------------------
  // 1. SERVICES (5 records)
  // -----------------------------------------------------------------------
  const servicesData = [
    {
      title: 'AI Strategy & Consulting',
      icon: 'brain' as const,
      order: 1,
      isActive: true,
      description:
        'Expert AI adoption roadmaps for UK SMEs — identify automation opportunities, build business cases, and create implementation plans that deliver measurable ROI.',
      ctaText: 'Start Your AI Journey',
      ctaLink: '#contact',
    },
    {
      title: 'Prompt Engineering & Fine-Tuning',
      icon: 'sparkles' as const,
      order: 2,
      isActive: true,
      description:
        'Custom LLM prompts and model fine-tuning for your specific business context — from customer service bots to document analysis pipelines.',
      ctaText: 'Optimise Your AI',
      ctaLink: '#contact',
    },
    {
      title: 'Agentic AI Systems',
      icon: 'bot' as const,
      order: 3,
      isActive: true,
      description:
        'Multi-agent workflows that autonomously complete complex business tasks — research, analysis, content creation, and decision support running 24/7.',
      ctaText: 'Deploy AI Agents',
      ctaLink: '#contact',
    },
    {
      title: 'Process Automation (n8n / Make)',
      icon: 'workflow' as const,
      order: 4,
      isActive: true,
      description:
        'End-to-end workflow automation connecting your existing tools — CRM, email, calendar, accounting — with zero-code platforms scaled for UK SMEs.',
      ctaText: 'Automate Your Workflows',
      ctaLink: '#contact',
    },
    {
      title: 'Data & ML Pipelines',
      icon: 'database' as const,
      order: 5,
      isActive: true,
      description:
        'Production data pipelines that transform raw business data into actionable intelligence — from ETL to predictive models and real-time dashboards.',
      ctaText: 'Unlock Your Data',
      ctaLink: '#contact',
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
      console.log(`  Created service: ${service.title}`)
    } else {
      console.log(`  Skipped service (exists): ${service.title}`)
    }
  }

  // -----------------------------------------------------------------------
  // 2. SOLUTIONS (4 records)
  // Note: description is richText (Lexical), icon is upload relation (skipped),
  //       benefits array is required
  // -----------------------------------------------------------------------
  const solutionsData = [
    {
      title: 'SME Process Automation',
      description: richTextFromParagraph(
        'Eliminate repetitive manual tasks across your UK SME — accounts payable, lead follow-up, reporting, and onboarding — so your team focuses on high-value work.',
      ),
      benefits: [
        { benefit: 'Reduce admin time by up to 70%' },
        { benefit: 'Connect 500+ apps with zero code' },
        { benefit: 'Fully auditable automation logs' },
        { benefit: 'ROI typically achieved within 60 days' },
      ],
      order: 1,
      isActive: true,
    },
    {
      title: 'AI-Powered Lead Generation',
      description: richTextFromParagraph(
        'Turn anonymous website visitors into identified, enriched leads with automated outreach sequences — from first page view to booked consultation, hands-free.',
      ),
      benefits: [
        { benefit: 'Identify 25–30% of anonymous visitors' },
        { benefit: 'Enrich leads with company and contact data' },
        { benefit: 'Auto-sequence via email, LinkedIn, and WhatsApp' },
        { benefit: 'Hot-lead alerts direct to WhatsApp' },
      ],
      order: 2,
      isActive: true,
    },
    {
      title: 'Content Automation Engine',
      description: richTextFromParagraph(
        'Publish authoritative AI and automation content at scale — keyword research, competitor analysis, draft generation, and social distribution, all automated.',
      ),
      benefits: [
        { benefit: 'Weekly AI-generated blog drafts for review' },
        { benefit: 'DataForSEO rank tracking and alerts' },
        { benefit: 'Auto-post to LinkedIn and Twitter on publish' },
        { benefit: 'AI news digest newsletter every 6 hours' },
      ],
      order: 3,
      isActive: true,
    },
    {
      title: 'Fractional CAIO (Chief AI Officer)',
      description: richTextFromParagraph(
        'Get the strategic AI leadership of a Chief AI Officer without the full-time cost — monthly AI strategy, implementation oversight, and team capability building.',
      ),
      benefits: [
        { benefit: 'Monthly AI strategy and roadmap review' },
        { benefit: 'Hands-on implementation support' },
        { benefit: 'Team AI training and upskilling' },
        { benefit: 'Board-level AI reporting and governance' },
      ],
      order: 4,
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
      console.log(`  Created solution: ${solution.title}`)
    } else {
      console.log(`  Skipped solution (exists): ${solution.title}`)
    }
  }

  // -----------------------------------------------------------------------
  // 3. FAQs (5 records)
  // Note: answer is richText (Lexical), category is select
  // -----------------------------------------------------------------------
  const faqsData = [
    {
      question: 'How long does it take to see ROI from AI automation?',
      answer: richTextFromParagraph(
        'Most UK SMEs see measurable ROI within 60–90 days of their first automation going live. Simple workflow automations (email routing, data entry, reporting) typically pay back within the first month. More complex AI systems like agentic workflows or custom LLM integrations usually reach positive ROI by month 3–4.',
      ),
      category: 'general' as const,
      order: 1,
      isActive: true,
    },
    {
      question: 'What does the AI Readiness Audit include?',
      answer: richTextFromParagraph(
        'The £97 AI Readiness Audit is a comprehensive review of your business operations. You complete a structured questionnaire covering your current tools, processes, team size, and growth goals. Within 48 hours, you receive a prioritised report identifying your top 5 automation opportunities, estimated ROI for each, and a 90-day implementation roadmap you can act on immediately.',
      ),
      category: 'audit' as const,
      order: 2,
      isActive: true,
    },
    {
      question: 'Do I need technical staff to implement AI automation?',
      answer: richTextFromParagraph(
        'No. FlowState IT handles all technical implementation. We use no-code and low-code platforms (n8n, Make, Power Automate) that run without developers, and we provide full training so your existing team can manage and adjust automations after handover. Our goal is to make AI accessible to non-technical UK business owners.',
      ),
      category: 'technical' as const,
      order: 3,
      isActive: true,
    },
    {
      question: 'How much does the AI Growth Retainer cost and what is included?',
      answer: richTextFromParagraph(
        'The AI Growth Retainer is £997/month and includes: monthly AI strategy review and roadmap update, up to 10 hours of hands-on automation implementation, priority support via WhatsApp, access to all new automation templates, and a quarterly ROI report. There is no long-term contract — cancel with 30 days notice.',
      ),
      category: 'pricing' as const,
      order: 4,
      isActive: true,
    },
    {
      question: 'Which AI tools and platforms do you work with?',
      answer: richTextFromParagraph(
        'We work with the full modern AI stack: OpenAI GPT-4/o1, Anthropic Claude, Google Gemini for LLM tasks; n8n, Make (Integromat), and Zapier for workflow automation; Power Automate and Power Apps for Microsoft 365 environments; Airtable for CRM and data management; and custom Python pipelines for ML and data engineering projects. We recommend the best tool for your specific business context, not a one-size-fits-all approach.',
      ),
      category: 'services' as const,
      order: 5,
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
      console.log(`  Created FAQ: ${faq.question.substring(0, 50)}...`)
    } else {
      console.log(`  Skipped FAQ (exists): ${faq.question.substring(0, 50)}...`)
    }
  }

  // -----------------------------------------------------------------------
  // 4. PRICING TIERS (2 records)
  // Fields: tierName(req), subtitle(req), priceAmount, priceLabel(req),
  //         isPriceCustom, ctaText(req), ctaLink(req), features(array,req),
  //         order(req), isActive, highlightColor
  // -----------------------------------------------------------------------
  const pricingData = [
    {
      tierName: 'AI Readiness Audit',
      subtitle: 'Perfect for SMEs exploring AI for the first time',
      priceAmount: 97,
      priceLabel: 'one-time',
      isPriceCustom: false,
      ctaText: 'Get Your Audit',
      ctaLink: '/audit',
      features: [
        { text: 'Comprehensive business operations review', icon: 'check' as const },
        { text: 'Top 5 automation opportunities identified', icon: 'check' as const },
        { text: 'Estimated ROI for each opportunity', icon: 'check' as const },
        { text: '90-day implementation roadmap', icon: 'check' as const },
        { text: '48-hour delivery', icon: 'zap' as const },
      ],
      order: 1,
      isActive: true,
      highlightColor: 'none' as const,
    },
    {
      tierName: 'AI Growth Retainer',
      subtitle: 'For UK SMEs serious about AI-driven growth',
      priceAmount: 997,
      priceLabel: '/month',
      isPriceCustom: false,
      ctaText: 'Start Your Retainer',
      ctaLink: '#contact',
      features: [
        { text: 'Monthly AI strategy and roadmap review', icon: 'star' as const },
        { text: 'Up to 10 hours implementation support', icon: 'check' as const },
        { text: 'Priority WhatsApp support', icon: 'zap' as const },
        { text: 'All automation templates included', icon: 'check' as const },
        { text: 'Quarterly ROI report', icon: 'check' as const },
        { text: 'No long-term contract — cancel anytime', icon: 'check' as const },
      ],
      order: 2,
      isActive: true,
      highlightColor: 'purple' as const,
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
      console.log(`  Created pricing tier: ${tier.tierName}`)
    } else {
      console.log(`  Skipped pricing tier (exists): ${tier.tierName}`)
    }
  }

  // -----------------------------------------------------------------------
  // 5. PROCESS STEPS (4 records)
  // Fields: stepNumber(req), title(req), description(req), icon(req,select), order(req)
  // -----------------------------------------------------------------------
  const processStepsData = [
    {
      stepNumber: 1,
      title: 'Discover',
      description:
        'We audit your current operations, tools, and workflows to identify the highest-impact automation opportunities — mapped to your revenue and cost drivers.',
      icon: 'search' as const,
      order: 1,
    },
    {
      stepNumber: 2,
      title: 'Design',
      description:
        'We co-design your automation architecture: workflow diagrams, data flows, integration points, and a phased rollout plan with clear milestones and ROI targets.',
      icon: 'lightbulb' as const,
      order: 2,
    },
    {
      stepNumber: 3,
      title: 'Deploy',
      description:
        'We build, test, and deploy your automations in a staging environment before going live — with full documentation and team training for smooth handover.',
      icon: 'rocket' as const,
      order: 3,
    },
    {
      stepNumber: 4,
      title: 'Scale',
      description:
        'We monitor performance, measure ROI, and continuously expand your automation portfolio — adding new workflows as your business grows and needs evolve.',
      icon: 'target' as const,
      order: 4,
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
      console.log(`  Created process step: ${step.title}`)
    } else {
      console.log(`  Skipped process step (exists): ${step.title}`)
    }
  }

  // -----------------------------------------------------------------------
  // 6. TESTIMONIALS (3 placeholder records, isActive: false)
  // Fields: clientName(req), clientTitle(req), clientCompany(req),
  //         testimonial(req), rating, clientPhoto(upload), companyLogo(upload),
  //         order(req), isActive, isFeatured
  // -----------------------------------------------------------------------
  const testimonialsData = [
    {
      clientName: 'Sarah Mitchell',
      clientTitle: 'Operations Director',
      clientCompany: 'Vertex Manufacturing Ltd',
      testimonial:
        'FlowState IT reduced our manual reporting time by 80%. What used to take my team 2 days every month now runs automatically overnight. The ROI was clear within 6 weeks.',
      rating: 5,
      order: 1,
      isActive: false,
      isFeatured: false,
    },
    {
      clientName: 'James Thornton',
      clientTitle: 'Managing Director',
      clientCompany: 'Thornton Legal Services',
      testimonial:
        'We were sceptical about AI at first, but Anthony made the whole process straightforward. Our client intake is now fully automated and we have not missed a follow-up since.',
      rating: 5,
      order: 2,
      isActive: false,
      isFeatured: false,
    },
    {
      clientName: 'Priya Sharma',
      clientTitle: 'CEO',
      clientCompany: 'BrightPath Recruitment',
      testimonial:
        'The AI strategy session alone was worth 10x the investment. We identified £120K of annual savings in our first audit. The implementation took 3 months and delivered every penny.',
      rating: 5,
      order: 3,
      isActive: false,
      isFeatured: false,
    },
  ]

  for (const testimonial of testimonialsData) {
    const existing = await payload.find({
      collection: 'testimonials',
      where: { clientName: { equals: testimonial.clientName } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'testimonials', data: testimonial })
      console.log(`  Created testimonial: ${testimonial.clientName}`)
    } else {
      console.log(`  Skipped testimonial (exists): ${testimonial.clientName}`)
    }
  }

  // -----------------------------------------------------------------------
  // 7. NAVIGATION (main nav items)
  // Fields: label(req), type(req,select), sectionId, url, openInNewTab,
  //         order(req), isButton
  // -----------------------------------------------------------------------
  const navigationData = [
    {
      label: 'Services',
      type: 'section' as const,
      sectionId: '#services',
      order: 1,
      isButton: false,
    },
    {
      label: 'Solutions',
      type: 'section' as const,
      sectionId: '#solutions',
      order: 2,
      isButton: false,
    },
    {
      label: 'Process',
      type: 'section' as const,
      sectionId: '#process',
      order: 3,
      isButton: false,
    },
    {
      label: 'Pricing',
      type: 'section' as const,
      sectionId: '#pricing',
      order: 4,
      isButton: false,
    },
    {
      label: 'Blog',
      type: 'page' as const,
      url: '/blog',
      openInNewTab: false,
      order: 5,
      isButton: false,
    },
    {
      label: "Let's Talk",
      type: 'button' as const,
      sectionId: '#contact',
      order: 6,
      isButton: true,
    },
  ]

  for (const navItem of navigationData) {
    const existing = await payload.find({
      collection: 'navigation',
      where: { label: { equals: navItem.label } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'navigation', data: navItem })
      console.log(`  Created nav item: ${navItem.label}`)
    } else {
      console.log(`  Skipped nav item (exists): ${navItem.label}`)
    }
  }

  // -----------------------------------------------------------------------
  // 8. BLOG AUTHORS (1 record)
  // Fields: name(req), bio, photo(upload), role, socialLinks(group)
  // -----------------------------------------------------------------------
  const authorData = {
    name: 'Anthony Harrison',
    bio: 'Founder of FlowState IT and AI automation consultant helping UK SMEs implement practical AI solutions. Specialises in workflow automation, agentic AI systems, and data pipelines.',
    role: 'Founder & AI Consultant',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/anthonyhharrison',
    },
  }

  const existingAuthor = await payload.find({
    collection: 'blog-authors',
    where: { name: { equals: authorData.name } },
    limit: 1,
  })
  if (existingAuthor.totalDocs === 0) {
    await payload.create({ collection: 'blog-authors', data: authorData })
    console.log(`  Created blog author: ${authorData.name}`)
  } else {
    console.log(`  Skipped blog author (exists): ${authorData.name}`)
  }

  console.log('Seeding complete.')
  await payload.db.destroy().catch(() => {})
  process.exit(0)
}

seedCollections().catch((error) => {
  console.error('Fatal error during seeding:', error)
  process.exit(1)
})
