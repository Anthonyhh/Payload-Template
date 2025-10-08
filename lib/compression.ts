import { gzipSync, brotliCompressSync } from 'zlib'
import { NextResponse } from 'next/server'
import { logger } from './logger'
import { performanceMonitor, Timer } from './monitoring'

export type CompressionOptions = {
  threshold: number // Minimum size in bytes to compress
  level: number // Compression level (1-9)
  preferBrotli: boolean
}

const defaultOptions: CompressionOptions = {
  threshold: 1024, // 1KB
  level: 6, // Balanced compression
  preferBrotli: true,
}

export function getCompressionPreference(request: Request): 'br' | 'gzip' | 'none' {
  const acceptEncoding = request.headers.get('Accept-Encoding')
  if (!acceptEncoding) return 'none'

  // Prefer Brotli over gzip as it typically has better compression ratios
  if (acceptEncoding.includes('br')) return 'br'
  if (acceptEncoding.includes('gzip')) return 'gzip'
  return 'none'
}

export function compressResponse(
  data: string | Buffer,
  encoding: 'br' | 'gzip' | 'none',
  options: Partial<CompressionOptions> = {}
): { compressed: Buffer | string; encoding: string } {
  const config = { ...defaultOptions, ...options }
  const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')

  // Skip compression for small payloads
  if (inputBuffer.length < config.threshold) {
    return {
      compressed: data,
      encoding: 'identity',
    }
  }

  const timer = new Timer()
  let compressed: Buffer
  let compressionType: string

  try {
    switch (encoding) {
      case 'br':
        compressed = brotliCompressSync(inputBuffer, {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: config.level,
          },
        })
        compressionType = 'br'
        break

      case 'gzip':
        compressed = gzipSync(inputBuffer, { level: config.level })
        compressionType = 'gzip'
        break

      default:
        return {
          compressed: data,
          encoding: 'identity',
        }
    }

    const duration = timer.stop()
    const originalSize = inputBuffer.length
    const compressedSize = compressed.length
    const ratio = ((originalSize - compressedSize) / originalSize) * 100

    performanceMonitor.recordHistogram('compression_duration_ms', duration)
    performanceMonitor.recordHistogram('compression_ratio_percent', ratio)
    performanceMonitor.incrementCounter('compression_operations_total', {
      type: compressionType,
      result: 'success',
    })

    logger.debug('Response compressed', {
      type: compressionType,
      originalSize,
      compressedSize,
      ratio: Math.round(ratio * 100) / 100,
      duration,
    })

    return {
      compressed,
      encoding: compressionType,
    }
  } catch (error) {
    const duration = timer.stop()

    performanceMonitor.incrementCounter('compression_operations_total', {
      type: encoding,
      result: 'error',
    })

    logger.error(
      'Compression failed',
      { type: encoding, duration },
      error instanceof Error ? error : new Error('Unknown compression error')
    )

    // Fallback to uncompressed
    return {
      compressed: data,
      encoding: 'identity',
    }
  }
}

export function createCompressedResponse(
  data: any,
  request: Request,
  options: {
    status?: number
    headers?: Record<string, string>
    compression?: Partial<CompressionOptions>
  } = {}
): NextResponse {
  const { status = 200, headers = {}, compression = {} } = options

  const jsonData = JSON.stringify(data)
  const encoding = getCompressionPreference(request)
  const { compressed, encoding: actualEncoding } = compressResponse(jsonData, encoding, compression)

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Set compression headers
  if (actualEncoding !== 'identity') {
    responseHeaders['Content-Encoding'] = actualEncoding
    responseHeaders['Vary'] = 'Accept-Encoding'
  }

  // Set content length for better performance
  const contentLength = Buffer.isBuffer(compressed)
    ? compressed.length
    : Buffer.from(compressed).length
  responseHeaders['Content-Length'] = contentLength.toString()

  const responseBody = Buffer.isBuffer(compressed) ? new Uint8Array(compressed) : compressed

  return new NextResponse(responseBody, {
    status,
    headers: responseHeaders,
  })
}

// Streaming compression for large datasets
export class StreamingCompressor {
  private encoder: 'br' | 'gzip' | 'none'
  private options: CompressionOptions

  constructor(request: Request, options: Partial<CompressionOptions> = {}) {
    this.encoder = getCompressionPreference(request)
    this.options = { ...defaultOptions, ...options }
  }

  async compressStream(stream: ReadableStream): Promise<ReadableStream> {
    if (this.encoder === 'none') {
      return stream
    }

    const encoder = this.encoder
    const compressionOptions = this.options
    const timer = new Timer()
    let totalBytes = 0

    return new ReadableStream({
      start(controller) {
        const reader = stream.getReader()

        const compress = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                controller.close()
                break
              }

              totalBytes += value.length

              // For streaming, compress each chunk
              const { compressed } = compressResponse(value, encoder, compressionOptions)
              controller.enqueue(compressed)
            }

            const duration = timer.stop()
            performanceMonitor.recordHistogram('stream_compression_duration_ms', duration)
            performanceMonitor.recordHistogram('stream_compression_bytes', totalBytes)

            logger.debug('Stream compression completed', {
              type: encoder,
              totalBytes,
              duration,
            })
          } catch (error) {
            logger.error(
              'Stream compression failed',
              { type: encoder },
              error instanceof Error ? error : new Error('Unknown stream compression error')
            )
            controller.error(error)
          }
        }

        compress()
      },
    })
  }
}

// Utility for estimating compression benefit
export function estimateCompressionBenefit(data: string): {
  originalSize: number
  estimatedGzipSize: number
  estimatedBrotliSize: number
  shouldCompress: boolean
} {
  const originalSize = Buffer.from(data).length

  // Rough estimates based on typical compression ratios
  const estimatedGzipSize = Math.round(originalSize * 0.3) // ~70% compression for JSON
  const estimatedBrotliSize = Math.round(originalSize * 0.25) // ~75% compression for JSON

  return {
    originalSize,
    estimatedGzipSize,
    estimatedBrotliSize,
    shouldCompress: originalSize > 1024, // Only compress if > 1KB
  }
}
