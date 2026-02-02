'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { PricingPlans } from '@/components/pricing/PricingPlans';

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 dark:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Header />

      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 md:pt-40 md:pb-32">
        <PricingPlans />
      </section>
    </div>
  );
}
