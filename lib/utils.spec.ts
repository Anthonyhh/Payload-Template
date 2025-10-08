import { describe, expect, test, vi } from 'vitest'
import { cn, formatDate, slugify, generateUniqueId } from './utils'

describe('cn', () => {
  test('merges class names correctly', () => {
    const result = cn('text-sm', 'font-bold', 'text-blue-500')
    expect(result).toBe('text-sm font-bold text-blue-500')
  })

  test('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class', 'final-class')
    expect(result).toBe('base-class active-class final-class')
  })

  test('handles conflicting tailwind classes', () => {
    const result = cn('text-sm text-lg')
    expect(result).toBe('text-lg')
  })
})

describe('formatDate', () => {
  // Test date constants
  const TEST_DATES = {
    STANDARD: '2024-01-15',
    CHRISTMAS: '2024-12-25',
    ISO_STRING: '2024-03-10T00:00:00.000Z',
  } as const

  const EXPECTED_FORMATS = {
    EN_US_STANDARD: 'January 15, 2024',
    EN_US_CHRISTMAS: 'December 25, 2024',
    EN_US_ISO: 'March 10, 2024',
    FR_FR_STANDARD: '15 janvier 2024',
    DE_DE_CHRISTMAS: '25. Dezember 2024',
  } as const

  test('formats Date object correctly', () => {
    const testDate = new Date(TEST_DATES.STANDARD)
    const result = formatDate(testDate)
    expect(result).toBe(EXPECTED_FORMATS.EN_US_STANDARD)
  })

  test('formats date string correctly', () => {
    const result = formatDate(TEST_DATES.CHRISTMAS)
    expect(result).toBe(EXPECTED_FORMATS.EN_US_CHRISTMAS)
  })

  test('handles ISO date string', () => {
    const result = formatDate(TEST_DATES.ISO_STRING)
    expect(result).toBe(EXPECTED_FORMATS.EN_US_ISO)
  })

  test('formats with custom locale', () => {
    const testDate = new Date(TEST_DATES.STANDARD)
    const result = formatDate(testDate, 'fr-FR')
    expect(result).toBe(EXPECTED_FORMATS.FR_FR_STANDARD)
  })

  test('formats with German locale', () => {
    const testDate = new Date(TEST_DATES.CHRISTMAS)
    const result = formatDate(testDate, 'de-DE')
    expect(result).toBe(EXPECTED_FORMATS.DE_DE_CHRISTMAS)
  })
})

describe('slugify', () => {
  test('converts text to slug format', () => {
    const text = 'Hello World Test'
    const result = slugify(text)
    expect(result).toBe('hello-world-test')
  })

  test('removes special characters', () => {
    const text = 'Hello @World! #Test'
    const result = slugify(text)
    expect(result).toBe('hello-world-test')
  })

  test('handles multiple spaces', () => {
    const text = 'Hello    World     Test'
    const result = slugify(text)
    expect(result).toBe('hello-world-test')
  })

  test('handles empty string', () => {
    const text = ''
    const result = slugify(text)
    expect(result).toBe('')
  })
})

describe('generateUniqueId', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const COLLISION_TEST_ITERATIONS = 1000

  test('generates UUID format', () => {
    const id = generateUniqueId()
    expect(id).toMatch(UUID_REGEX)
  })

  test('generates unique IDs', () => {
    const id1 = generateUniqueId()
    const id2 = generateUniqueId()
    expect(id1).not.toBe(id2)
  })

  test('generates collision-safe IDs', () => {
    const ids = new Set()
    for (let i = 0; i < COLLISION_TEST_ITERATIONS; i++) {
      const id = generateUniqueId()
      expect(ids.has(id)).toBe(false)
      ids.add(id)
    }
    expect(ids.size).toBe(COLLISION_TEST_ITERATIONS)
  })
})
