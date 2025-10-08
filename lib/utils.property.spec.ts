import { describe, test } from 'vitest'
import fc from 'fast-check'
import { slugify, formatDate, cn } from './utils'

describe('slugify properties', () => {
  test('slugify is idempotent', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const once = slugify(text)
        const twice = slugify(once)
        // Idempotent property: f(f(x)) = f(x)
        // This is true because slugify output only contains [a-z0-9_-]
        // which are preserved by slugify
        return once === twice
      })
    )
  })

  test('slugify always produces lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = slugify(text)
        return result === result.toLowerCase()
      })
    )
  })

  test('slugify never contains spaces', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = slugify(text)
        return !result.includes(' ')
      })
    )
  })

  test('slugify only contains alphanumeric, underscores and hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = slugify(text)
        // slugify preserves underscores as they are \w characters
        return /^[a-z0-9_-]*$/.test(result)
      })
    )
  })
})

describe('formatDate properties', () => {
  test('formatDate always returns a string', () => {
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true }), (date) => {
        const result = formatDate(date)
        return typeof result === 'string'
      })
    )
  })

  test('formatDate produces consistent output for same valid date', () => {
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true }), (date) => {
        const result1 = formatDate(date)
        const result2 = formatDate(date)
        return result1 === result2
      })
    )
  })

  test('formatDate works with date strings and Date objects equivalently', () => {
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true }), (date) => {
        const dateString = date.toISOString()
        const fromObject = formatDate(date)
        const fromString = formatDate(dateString)
        return fromObject === fromString
      })
    )
  })
})

describe('cn properties', () => {
  test('cn always returns a string', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (classes) => {
        const result = cn(...classes)
        return typeof result === 'string'
      })
    )
  })

  test('cn handles empty input gracefully', () => {
    const result = cn()
    return result === ''
  })
})
