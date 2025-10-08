'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronRight, Sparkles } from 'lucide-react'

const rotatingWords = ['Agentic AI', 'Voice Automation', 'Workflow Bots', 'SOP Automation']

interface HeroSectionProps {
  onOpenModal: () => void
}

export function HeroSection({ onOpenModal }: HeroSectionProps) {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="hero-sop" aria-label="Hero — SOP Automation">
      <div className="hero-sop__container">
        <h1 className="hero-sop__title">
          <span className="hero-sop__line">Transforming</span>
          <span className="hero-sop__line">business</span>
          <span className="hero-sop__line">operations</span>
          <span className="hero-sop__line">with</span>
          <span className="hero-sop__accent">SOP<br/>Automation</span>
          <span className="hero-sop__underline" aria-hidden="true"></span>
        </h1>

        <p className="hero-sop__lead">
          Unlock the power of AI automation to streamline workflows, boost productivity,
          and scale your business operations with cutting-edge technology solutions.
        </p>

        <div className="hero-sop__cta">
          <a href="#contact" className="hero-sop__btn hero-sop__btn--primary" onClick={onOpenModal}>Book Free AI Automation Consultation</a>
          <a href="#services" className="hero-sop__btn hero-sop__btn--ghost">Explore Services</a>
        </div>

        <canvas className="hero-sop__particles" aria-hidden="true"></canvas>
      </div>

      <style jsx>{`
        :root {
          --sop-bg-1: #0b0a09;
          --sop-bg-2: #000;
          --sop-orange: #ff8a3d;
          --sop-orange-2: #ffb770;
          --sop-text: #fff;
          --sop-muted: #c9c7c5;
        }

        #hero-sop {
          position: relative;
          isolation: isolate;
          background:
            radial-gradient(40% 50% at 0% 50%, rgba(255,138,61,.18), transparent 60%),
            radial-gradient(35% 55% at 100% 50%, rgba(255,138,61,.12), transparent 60%),
            linear-gradient(180deg, var(--sop-bg-1), var(--sop-bg-2));
          color: var(--sop-text);
          padding: clamp(72px,10vw,160px) 0;
          overflow: clip;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #hero-sop .hero-sop__container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(16px,4vw,32px);
          text-align: center;
          position: relative;
          z-index: 1;
          font-family: "Satoshi", Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        #hero-sop .hero-sop__title {
          margin: 0 auto;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -.02em;
          display: inline-block;
          position: relative;
        }

        #hero-sop .hero-sop__line {
          display: block;
          font-size: clamp(44px,8vw,112px);
          text-shadow: 0 2px 0 rgba(0,0,0,.25);
        }

        #hero-sop .hero-sop__accent {
          display: inline-block;
          color: var(--sop-orange);
          font-weight: 800;
          font-size: clamp(44px,8vw,112px);
          text-shadow: 0 2px 0 rgba(0,0,0,.25), 0 0 24px rgba(255,138,61,.25);
        }

        #hero-sop .hero-sop__underline {
          display: block;
          height: 6px;
          width: min(640px,80vw);
          margin: clamp(10px,1.6vw,16px) auto 0;
          border-radius: 999px;
          background: linear-gradient(90deg,var(--sop-orange),var(--sop-orange-2));
          box-shadow: 0 6px 24px rgba(255,138,61,.35);
        }

        #hero-sop .hero-sop__lead {
          max-width: 740px;
          margin: clamp(18px,2vw,24px) auto 0;
          color: var(--sop-muted);
          font-size: clamp(16px,1.6vw,18px);
          line-height: 1.65;
        }

        #hero-sop .hero-sop__cta {
          display: flex;
          gap: 14px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-top: clamp(18px,3vw,28px);
        }

        #hero-sop .hero-sop__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 22px;
          min-height: 48px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: .2px;
          border: 1px solid rgba(255,255,255,.16);
          transition: transform .15s ease, box-shadow .2s ease, background .2s ease, color .2s ease;
          text-decoration: none;
          cursor: pointer;
        }

        #hero-sop .hero-sop__btn--primary {
          color: #1b120a;
          background: linear-gradient(90deg,var(--sop-orange),var(--sop-orange-2));
          box-shadow: 0 12px 30px rgba(255,138,61,.28);
        }

        #hero-sop .hero-sop__btn--primary:hover {
          transform: translateY(-1px);
        }

        #hero-sop .hero-sop__btn--ghost {
          color: var(--sop-text);
          background: rgba(255,255,255,.06);
        }

        #hero-sop .hero-sop__btn--ghost:hover {
          background: rgba(255,255,255,.1);
        }

        #hero-sop .hero-sop__particles {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          opacity: .65;
          mix-blend-mode: screen;
        }

        @media (max-width: 900px) {
          #hero-sop {
            padding-top: clamp(56px,8vw,96px);
          }
          #hero-sop .hero-sop__underline {
            height: 4px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          #hero-sop .hero-sop__btn,
          #hero-sop .hero-sop__accent {
            transition: none;
            text-shadow: none;
          }
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          (function(){
            const canvas=document.querySelector('#hero-sop .hero-sop__particles');
            if(!canvas) return;
            const ctx=canvas.getContext('2d');
            let w,h,dpr,dots;
            const DOTS=80;

            function size(){
              dpr=Math.max(1,window.devicePixelRatio||1);
              w=canvas.clientWidth;
              h=canvas.clientHeight;
              canvas.width=w*dpr;
              canvas.height=h*dpr;
              ctx.setTransform(dpr,0,0,dpr,0,0);
            }

            function init(){
              dots=Array.from({length:DOTS}).map(()=>({
                x:Math.random()*w,
                y:Math.random()*h,
                r:Math.random()*2+.5,
                vx:(Math.random()-.5)*.25,
                vy:(Math.random()-.5)*.25
              }));
            }

            function tick(){
              ctx.clearRect(0,0,w,h);
              ctx.fillStyle='rgba(255,170,120,0.9)';
              dots.forEach(p=>{
                p.x+=p.vx;
                p.y+=p.vy;
                if(p.x<0||p.x>w) p.vx*=-1;
                if(p.y<0||p.y>h) p.vy*=-1;
                ctx.beginPath();
                ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
                ctx.fill();
              });
              requestAnimationFrame(tick);
            }

            size();
            init();
            tick();
            window.addEventListener('resize',()=>{ size(); init(); });
          })();
        `
      }} />
    </section>
  )
}
