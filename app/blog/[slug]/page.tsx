import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, User, Share2, Linkedin, Twitter } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// This would normally fetch the post data based on the slug
async function getPost(slug: string) {
  // In production, this would fetch from a CMS or read MDX files
  const samplePost = {
    slug: slug,
    title: 'The Future of AI Automation in 2025',
    content: `
      <h2>Introduction</h2>
      <p>Artificial Intelligence is revolutionizing how businesses operate, and 2025 marks a pivotal year in the widespread adoption of AI automation technologies. From intelligent agents that can handle complex customer interactions to sophisticated workflow systems that optimize entire business processes, the landscape of work is being fundamentally transformed.</p>
      
      <h2>Key Trends Shaping AI Automation</h2>
      <h3>1. Agentic AI Systems</h3>
      <p>Agentic AI represents a paradigm shift from reactive to proactive artificial intelligence. These systems can autonomously plan, execute, and adapt to achieve specific goals without constant human supervision. In 2025, we're seeing businesses deploy agentic AI for everything from customer service to supply chain optimization.</p>
      
      <h3>2. Voice AI Integration</h3>
      <p>Voice AI has evolved beyond simple command recognition to become a sophisticated interface for business operations. Modern voice AI can handle nuanced conversations, understand context, and even detect emotional cues to provide more personalized interactions.</p>
      
      <h3>3. Hyper-Automation</h3>
      <p>Organizations are moving beyond automating individual tasks to creating interconnected automation ecosystems. This hyper-automation approach combines AI, machine learning, and robotic process automation to create self-optimizing business processes.</p>
      
      <h2>Implementation Strategies</h2>
      <p>Successfully implementing AI automation requires a strategic approach that considers both technological and human factors. Here are key strategies for organizations looking to leverage these technologies:</p>
      
      <ul>
        <li><strong>Start with Clear Objectives:</strong> Define specific, measurable goals for your AI automation initiatives.</li>
        <li><strong>Focus on High-Impact Areas:</strong> Identify processes that will benefit most from automation.</li>
        <li><strong>Invest in Training:</strong> Ensure your team has the skills to work alongside AI systems.</li>
        <li><strong>Maintain Human Oversight:</strong> Keep humans in the loop for critical decisions and quality control.</li>
      </ul>
      
      <h2>Challenges and Considerations</h2>
      <p>While the benefits of AI automation are substantial, organizations must navigate several challenges:</p>
      
      <h3>Data Privacy and Security</h3>
      <p>As AI systems process vast amounts of data, ensuring privacy and security becomes paramount. Organizations must implement robust data governance frameworks and comply with evolving regulations.</p>
      
      <h3>Ethical AI Implementation</h3>
      <p>Ensuring AI systems make fair, unbiased decisions requires careful attention to training data and algorithm design. Transparency and explainability are becoming essential requirements.</p>
      
      <h2>The Road Ahead</h2>
      <p>As we progress through 2025, AI automation will continue to evolve at an unprecedented pace. Organizations that embrace these technologies thoughtfully and strategically will find themselves at a significant competitive advantage. The key is not just to automate, but to augment human capabilities and create new value propositions that weren't possible before.</p>
      
      <h2>Conclusion</h2>
      <p>The future of AI automation is not about replacing humans but about creating powerful human-AI partnerships. By understanding and leveraging these emerging technologies, businesses can unlock new levels of efficiency, innovation, and growth. The organizations that succeed will be those that view AI automation not as a threat, but as an opportunity to reimagine what's possible.</p>
    `,
    author: 'Anthony Hanson-Harrison',
    date: '2025-09-10',
    readTime: '5 min read',
    category: 'AI Trends',
  }

  return samplePost
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{post.category}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share buttons */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Share this article</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Author bio */}
          <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">About the Author</h3>
            <p className="text-muted-foreground">
              {post.author} is the founder and CEO of FlowState IT, specializing in AI automation
              and digital transformation strategies for businesses.
            </p>
          </div>

          {/* Related articles */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Voice AI Revolution in Customer Service',
                  excerpt: 'Discover how Voice AI is transforming customer interactions...',
                  slug: 'voice-ai-customer-service',
                },
                {
                  title: 'Complete Guide to Workflow Automation',
                  excerpt: 'A comprehensive guide to implementing workflow automation...',
                  slug: 'workflow-automation-guide',
                },
              ].map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold mb-2">{related.title}</h4>
                  <p className="text-sm text-muted-foreground">{related.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-white/90 mb-8">
              Learn how AI automation can revolutionize your operations
            </p>
            <Link href="/#contact">
              <Button variant="secondary" size="lg">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
