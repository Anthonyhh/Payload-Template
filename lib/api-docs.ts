import type { OpenAPIV3 } from 'openapi-types'

export const apiDocumentation: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'FlowstateIt Lead Management API',
    version: '1.0.0',
    description: 'API for managing lead submissions and monitoring application health',
    contact: {
      name: 'FlowstateIt Support',
      email: 'support@flowstateit.co.uk',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development server',
    },
    {
      url: 'https://flowstateit.co.uk',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/leads': {
      post: {
        summary: 'Submit a new lead',
        description:
          'Creates a new lead submission with validation and optional webhook notification',
        operationId: 'submitLead',
        tags: ['Leads'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LeadFormData',
              },
              examples: {
                fullLead: {
                  summary: 'Complete lead with all optional fields',
                  value: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    company: 'ACME Corp',
                    role: 'CTO',
                    website: 'https://acme.com',
                    service: 'agentic-ai',
                    team_size: '51-200',
                    budget: '100k-500k',
                    bottleneck: 'Need to scale engineering team',
                    consent: true,
                  },
                },
                minimalLead: {
                  summary: 'Minimal required fields only',
                  value: {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    service: 'workflow-automation',
                    consent: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Lead submitted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadResponse',
                },
                examples: {
                  success: {
                    summary: 'Successful lead submission',
                    value: {
                      data: {
                        id: 'lead_123456',
                        created_at: '2024-01-15T10:30:00Z',
                        name: 'John Doe',
                        email: 'john@example.com',
                        service: 'agentic-ai',
                        consent: true,
                      },
                      error: null,
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                examples: {
                  validationError: {
                    summary: 'Validation failed',
                    value: {
                      error: 'Invalid request',
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                examples: {
                  databaseError: {
                    summary: 'Database connection failed',
                    value: {
                      error: 'Failed to save lead',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'Check application health',
        description:
          'Returns the current health status of the application including uptime and memory usage',
        operationId: 'getHealth',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'Application is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                examples: {
                  healthy: {
                    summary: 'Healthy application status',
                    value: {
                      status: 'healthy',
                      timestamp: '2024-01-15T10:30:00Z',
                      uptime: 3600,
                      memory: {
                        heapUsed: 45.2,
                        heapTotal: 67.8,
                        external: 12.4,
                        rss: 89.1,
                      },
                      metrics: 25,
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Application is unhealthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UnhealthyResponse',
                },
                examples: {
                  unhealthy: {
                    summary: 'Unhealthy application status',
                    value: {
                      status: 'unhealthy',
                      error: 'Database connection failed',
                      timestamp: '2024-01-15T10:30:00Z',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/metrics': {
      get: {
        summary: 'Get performance metrics',
        description: 'Returns collected performance metrics for monitoring and observability',
        operationId: 'getMetrics',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'Performance metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MetricsResponse',
                },
                examples: {
                  metricsData: {
                    summary: 'Sample metrics data',
                    value: {
                      metrics: [
                        {
                          name: 'api_requests_total',
                          type: 'counter',
                          value: 42,
                          labels: {
                            endpoint: '/api/leads',
                            method: 'POST',
                            status: '200',
                          },
                          timestamp: '2024-01-15T10:30:00Z',
                        },
                      ],
                      timestamp: '2024-01-15T10:30:00Z',
                      count: 1,
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Error retrieving metrics',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      LeadFormData: {
        type: 'object',
        required: ['name', 'email', 'service', 'consent'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Full name of the lead',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'Valid email address',
            example: 'john@example.com',
          },
          company: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Company name (optional)',
            example: 'ACME Corp',
          },
          role: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Job role/title (optional)',
            example: 'CTO',
          },
          website: {
            type: 'string',
            format: 'uri',
            maxLength: 255,
            description: 'Company website URL (optional)',
            example: 'https://acme.com',
          },
          service: {
            type: 'string',
            enum: [
              'agentic-ai',
              'workflow-automation',
              'lead-gen',
              'sop-automation',
              'fractional-caio',
              'fractional-cto',
              'other',
            ],
            description: 'Service of interest',
            example: 'agentic-ai',
          },
          team_size: {
            type: 'string',
            enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
            description: 'Company team size (optional)',
            example: '51-200',
          },
          budget: {
            type: 'string',
            enum: ['<10k', '10k-50k', '50k-100k', '100k-500k', '500k+'],
            description: 'Project budget range (optional)',
            example: '100k-500k',
          },
          bottleneck: {
            type: 'string',
            maxLength: 500,
            description: 'Main business challenge or bottleneck (optional)',
            example: 'Need to scale engineering team',
          },
          consent: {
            type: 'boolean',
            enum: [true],
            description: 'Must be true to agree to terms and conditions',
          },
        },
      },
      LeadResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'lead_123456' },
              created_at: { type: 'string', format: 'date-time' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              company: { type: 'string', nullable: true },
              role: { type: 'string', nullable: true },
              website: { type: 'string', format: 'uri', nullable: true },
              service: { type: 'string' },
              team_size: { type: 'string', nullable: true },
              budget: { type: 'string', nullable: true },
              bottleneck: { type: 'string', nullable: true },
              consent: { type: 'boolean' },
            },
            nullable: true,
          },
          error: {
            type: 'string',
            nullable: true,
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message describing what went wrong',
          },
        },
        required: ['error'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy'],
            example: 'healthy',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          uptime: {
            type: 'number',
            description: 'Application uptime in seconds',
            example: 3600,
          },
          memory: {
            type: 'object',
            properties: {
              heapUsed: { type: 'number', description: 'Heap used in MB' },
              heapTotal: { type: 'number', description: 'Total heap in MB' },
              external: { type: 'number', description: 'External memory in MB' },
              rss: { type: 'number', description: 'Resident set size in MB' },
            },
            nullable: true,
          },
          metrics: {
            type: 'number',
            description: 'Number of collected metrics',
          },
        },
        required: ['status', 'timestamp'],
      },
      UnhealthyResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['unhealthy'],
            example: 'unhealthy',
          },
          error: {
            type: 'string',
            description: 'Error causing unhealthy status',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['status', 'error', 'timestamp'],
      },
      MetricsResponse: {
        type: 'object',
        properties: {
          metrics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'api_requests_total' },
                type: {
                  type: 'string',
                  enum: ['counter', 'histogram', 'gauge'],
                  example: 'counter',
                },
                value: { type: 'number', example: 42 },
                labels: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  example: { endpoint: '/api/leads', method: 'POST' },
                },
                timestamp: { type: 'string', format: 'date-time' },
              },
              required: ['name', 'type', 'value', 'timestamp'],
            },
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          count: {
            type: 'number',
            description: 'Total number of metrics',
          },
        },
        required: ['metrics', 'timestamp', 'count'],
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authenticated requests (future use)',
      },
    },
  },
  tags: [
    {
      name: 'Leads',
      description: 'Lead management operations',
    },
    {
      name: 'Monitoring',
      description: 'Application health and performance monitoring',
    },
  ],
}
