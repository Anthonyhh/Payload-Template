import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Sample blog posts data - in production, this would come from a CMS or MDX files
const blogPosts = [
  {
    slug: 'future-of-ai-automation',
    title: 'The Future of AI Automation in 2025',
    excerpt:
      'Explore the latest trends and predictions for AI automation technology and how businesses can prepare for the transformative changes ahead.',
    author: 'Anthony Hanson-Harrison',
    date: '2025-09-10',
    readTime: '5 min read',
    category: 'AI Trends',
    image: '/blog/ai-future.jpg',
  },
  {
    slug: 'voice-ai-customer-service',
    title: 'Revolutionizing Customer Service with Voice AI',
    excerpt:
      'Learn how Voice AI is transforming customer interactions, reducing costs, and improving satisfaction rates across industries.',
    author: 'FlowState Team',
    date: '2025-09-05',
    readTime: '7 min read',
    category: 'Voice AI',
    image: '/blog/voice-ai.jpg',
  },
  {
    slug: 'workflow-automation-guide',
    title: 'Complete Guide to Workflow Automation',
    excerpt:
      'A comprehensive guide to implementing workflow automation in your organization, from planning to deployment and optimization.',
    author: 'Anthony Hanson-Harrison',
    date: '2025-09-01',
    readTime: '10 min read',
    category: 'Automation',
    image: '/blog/workflow.jpg',
  },
  {
    slug: 'roi-ai-automation',
    title: 'Measuring ROI of AI Automation Investments',
    excerpt:
      'Understand how to calculate and maximize the return on investment from your AI automation initiatives with real-world examples.',
    author: 'FlowState Team',
    date: '2025-08-28',
    readTime: '8 min read',
    category: 'Business',
    image: '/blog/roi.jpg',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">FlowState IT Blog</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Insights, tutorials, and industry updates on AI automation, workflow optimization, and
            digital transformation.
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                {/* Placeholder for image */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg flex items-center justify-center">
                  <span className="text-4xl">📝</span>
                </div>

                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">{post.excerpt}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Articles
          </Button>
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated with AI Insights</h2>
            <p className="text-white/90 mb-8">
              Get the latest articles on AI automation delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
              <Button variant="secondary" size="lg">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
