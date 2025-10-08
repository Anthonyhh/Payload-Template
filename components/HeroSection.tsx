'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

const rotatingWords = ['Agentic AI', 'Voice Automation', 'Workflow Bots', 'SOP Automation']

interface HeroSectionProps {
  onOpenModal: () => void
}

export function HeroSection({ onOpenModal }: HeroSectionProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let w: number, h: number, dpr: number
    let dots: Array<{ x: number; y: number; r: number; vx: number; vy: number }>

    const DOTS = 80

    function resize() {
      if (!canvas || !ctx) return
      dpr = Math.max(1, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function init() {
      dots = Array.from({ length: DOTS }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }))
    }

    function tick() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,170,120,0.9)'
      dots.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })
      animationFrameId = requestAnimationFrame(tick)
    }

    resize()
    init()
    tick()

    const handleResize = () => {
      resize()
      init()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(40% 50% at 0% 50%, rgba(255,138,61,.18), transparent 60%), radial-gradient(35% 55% at 100% 50%, rgba(255,138,61,.12), transparent 60%), linear-gradient(180deg, #0b0a09, #000)',
        padding: 'clamp(72px,10vw,160px) 0',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-65 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 text-center relative z-10">
        <h1 className="inline-block relative m-0 font-extrabold leading-none tracking-tight">
          <span className="block text-[clamp(44px,8vw,112px)] drop-shadow-lg">Transforming</span>
          <span className="block text-[clamp(44px,8vw,112px)] drop-shadow-lg">business</span>
          <span className="block text-[clamp(44px,8vw,112px)] drop-shadow-lg">operations</span>
          <span className="block text-[clamp(44px,8vw,112px)] drop-shadow-lg">with</span>
          <span
            className="inline-block text-[clamp(44px,8vw,112px)] font-extrabold"
            style={{
              color: '#ff8a3d',
              textShadow: '0 2px 0 rgba(0,0,0,.25), 0 0 24px rgba(255,138,61,.25)',
            }}
          >
            SOP
            <br />
            Automation
          </span>
          <span
            className="block h-[6px] w-full max-w-[640px] mx-auto mt-2 md:mt-4 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ff8a3d, #ffb770)',
              boxShadow: '0 6px 24px rgba(255,138,61,.35)',
            }}
            aria-hidden="true"
          />
        </h1>

        <p className="max-w-[740px] mx-auto mt-6 text-gray-400 text-[clamp(16px,1.6vw,18px)] leading-relaxed">
          Unlock the power of AI automation to streamline workflows, boost productivity, and scale
          your business operations with cutting-edge technology solutions.
        </p>

        <div className="flex gap-4 justify-center items-center flex-wrap mt-8">
          <button
            onClick={(e) => {
              e.preventDefault()
              onOpenModal()
            }}
            className="inline-flex items-center justify-center px-6 py-3 min-h-[48px] rounded-xl font-bold text-base text-[#1b120a] border border-white/20 transition-transform duration-150 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(90deg, #ff8a3d, #ffb770)',
              boxShadow: '0 12px 30px rgba(255,138,61,.28)',
            }}
          >
            Book Free AI Automation Consultation
          </button>
          <a
            href="#services"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[48px] rounded-xl font-bold text-base text-white border border-white/20 bg-white/10 transition-all duration-200 hover:bg-white/20"
          >
            Explore Services
          </a>
        </div>
      </div>
    </section>
  )
}
