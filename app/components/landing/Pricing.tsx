"use client";

import React from 'react';
import { motion } from 'framer-motion';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
  </svg>
);

const pricingTiers = [
  {
    name: 'Starter',
    price: '$49',
    frequency: '/month',
    description: 'Perfect for individuals and small teams getting started.',
    features: [
      '1 AI Agent',
      '500 calls/month',
      'Standard support',
      'Calendar integration',
    ],
    cta: 'Choose Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$99',
    frequency: '/month',
    description: 'For growing businesses that need more power and scale.',
    features: [
      '5 AI Agents',
      '2,500 calls/month',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    cta: 'Choose Plan',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    frequency: '',
    description: 'Tailored solutions for large organizations.',
    features: [
      'Unlimited Agents',
      'Custom call volume',
      'Dedicated support',
      'SOC 2 compliance',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Find the perfect plan for your team
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="grid gap-10 lg:grid-cols-3"
        >
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-8 rounded-2xl shadow-lg border ${tier.popular ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} ${tier.popular ? 'bg-primary/5 dark:bg-primary/10' : 'bg-white dark:bg-gray-800'}`}
            >
              <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white">{tier.name}</h3>
              <p className="mt-4 text-gray-600 dark:text-gray-300">{tier.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{tier.price}</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">{tier.frequency}</span>
              </div>
              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-10 w-full py-3 px-6 rounded-lg font-semibold ${tier.popular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 