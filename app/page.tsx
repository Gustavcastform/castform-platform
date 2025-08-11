'use client';

import { useSession } from "next-auth/react";
import Header from "./components/landing/Header";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import HowItWorks from "./components/landing/HowItWorks";
import Pricing from "./components/landing/Pricing";
import Testimonials from "./components/landing/Testimonials";
import CTA from "./components/landing/CTA";
import Footer from "./components/landing/Footer";

export default function LandingPage() {
  const { status } = useSession();

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background dark:bg-gray-900">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  // Render landing page (middleware handles authenticated user redirects)
  return (
    <div className="bg-background text-gray-800 dark:bg-gray-900 dark:text-gray-200 font-sans">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
