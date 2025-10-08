import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-r2'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- FlowstateIT CMS',
      favicon: '/favicon.ico',
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: 'media',
      upload: true,
      fields: [
        {
          name: 'alt',
          type: 'text',
        },
      ],
    },
    {
      slug: 'landing-pages',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'baseBlocks',
          type: 'richText',
          editor: lexicalEditor({}),
        },
        {
          name: 'publishedAt',
          type: 'date',
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
        },
      ],
    },
    {
      slug: 'variants',
      admin: {
        useAsTitle: 'keyword',
      },
      fields: [
        {
          name: 'landingPage',
          type: 'relationship',
          relationTo: 'landing-pages',
          required: true,
        },
        {
          name: 'keyword',
          type: 'text',
          required: true,
        },
        {
          name: 'patterns',
          type: 'array',
          fields: [
            {
              name: 'pattern',
              type: 'text',
            },
          ],
        },
        {
          name: 'priority',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'active',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'targetPaths',
          type: 'array',
          fields: [
            {
              name: 'path',
              type: 'text',
            },
          ],
        },
        {
          name: 'overrideBlocks',
          type: 'richText',
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'change-me-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT || '',
      },
    }),
  ],
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
})
