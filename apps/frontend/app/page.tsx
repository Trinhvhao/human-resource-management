'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import Process from '@/components/landing/Process';
import Security from '@/components/landing/Security';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden relative">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Stats />
        <Features />
        <Process />
        <Security />
        <Testimonials />
        <FAQ />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
