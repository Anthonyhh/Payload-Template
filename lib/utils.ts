import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w -]+/g, '')
    .replace(/ +/g, '-')
}

export function generateUniqueId(): string {
  return crypto.randomUUID()
}
