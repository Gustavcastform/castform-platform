"use client";

import React from 'react';
import { motion } from 'framer-motion';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
  </svg>
);

const features = [
  {
    name: 'AI-Powered Conversations',
    description: 'Our agents understand context, handle complex queries, and hold natural, human-like conversations.',
    subFeatures: ['Contextual understanding', 'Objection handling', 'Dynamic responses'],
  },
  {
    name: 'Automated Scheduling',
    description: 'Seamlessly connect to Google & Microsoft calendars to book meetings without any manual intervention.',
    subFeatures: ['Real-time availability', 'Automated invites', 'Timezone detection'],
  },
  {
    name: 'Advanced Analytics',
    description: 'Gain deep insights into your campaigns with a powerful, real-time analytics dashboard.',
    subFeatures: ['Call performance tracking', 'Agent effectiveness metrics', 'Custom report exports'],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-16">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            A better way to do outreach
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
            Our platform is packed with powerful features designed to make your voice campaigns smarter and more effective.
          </p>
        </div>

        <div className="mt-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="grid gap-10 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <div key={feature.name} className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-4">{feature.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.subFeatures.map((subFeature) => (
                    <li key={subFeature} className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-gray-700 dark:text-gray-200">{subFeature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
} 