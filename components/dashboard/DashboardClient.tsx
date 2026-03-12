'use client'

import { useState } from 'react'
import OnboardingModal from '@/components/onboarding/OnboardingModal'

export default function DashboardClient({ showOnboarding }: { showOnboarding: boolean }) {
  const [onboardingDone, setOnboardingDone] = useState(!showOnboarding)

  if (onboardingDone) return null

  return <OnboardingModal onComplete={() => setOnboardingDone(true)} />
}