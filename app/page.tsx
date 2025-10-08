'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { ServicesSection } from '@/components/ServicesSection'
import { ProcessSection } from '@/components/ProcessSection'
import { SolutionsSection } from '@/components/SolutionsSection'
import { FractionalSection } from '@/components/FractionalSection'
import { UseCasesSection } from '@/components/UseCasesSection'
import { FAQSection } from '@/components/FAQSection'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'
import { LeadModal } from '@/components/LeadModal'
import type { LeadFormData } from '@/lib/validations'

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [presetService, setPresetService] = useState<LeadFormData['service'] | undefined>()

  const handleOpenModal = (service?: LeadFormData['service']) => {
    setPresetService(service)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setPresetService(undefined)
  }

  return (
    <>
      <Header />
      <main>
        <HeroSection onOpenModal={handleOpenModal} />
        <ServicesSection onOpenModal={handleOpenModal} />
        <ProcessSection />
        <SolutionsSection />
        <FractionalSection onOpenModal={handleOpenModal} />
        <UseCasesSection />
        <FAQSection />
        <ContactSection onOpenModal={handleOpenModal} />
      </main>
      <Footer onOpenModal={handleOpenModal} />
      <LeadModal isOpen={isModalOpen} onClose={handleCloseModal} presetService={presetService} />
    </>
  )
}
