"use client";

import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    name: 'Step 1: Connect',
    description: 'Securely link your Google or Microsoft account and calendars in seconds.',
    details: 'Our OAuth 2.0 integration ensures your data is safe and provides our AI agents with the context they need to book meetings efficiently.'
  },
  {
    name: 'Step 2: Configure',
    description: 'Upload your contact list and design the perfect AI agent for your campaign.',
    details: 'Use our intuitive prompt editor, select from various voices, and set custom call behaviors to match your brand and goals.'
  },
  {
    name: 'Step 3: Launch',
    description: 'Deploy your agent and monitor results in real-time as it handles calls.',
    details: 'Watch from your dashboard as your AI agent makes calls, delivers messages, and books meetings directly into your calendar.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-primary-light font-semibold tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl lg:text-4xl font-extrabold font-display tracking-tight">
            Get started in 3 simple steps
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full text-white text-2xl font-bold font-display z-10 mb-6">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold font-display text-white mb-2">{step.name}</h3>
              <p className="text-lg text-primary-light font-semibold mb-3">{step.description}</p>
              <p className="text-base text-gray-400">{step.details}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 