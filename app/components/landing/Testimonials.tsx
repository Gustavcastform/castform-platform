"use client";

import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "Castform has revolutionized our outreach. We're booking 3x more meetings with half the effort. It's a game-changer.",
    name: 'Sarah Johnson',
    title: 'Head of Sales, Stellar Solutions',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
  },
  {
    quote: "The AI agents are incredibly smart and the platform is so easy to use. Our setup took less than an hour, and the results have been phenomenal.",
    name: 'Michael Chen',
    title: 'CEO, InnovateX',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e'
  },
  {
    quote: "We've tried other solutions, but nothing comes close to the power and scalability of Castform. Their real-time analytics are top-notch.",
    name: 'Jessica Rodriguez',
    title: 'Operations Manager, Apex Enterprises',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl lg:text-4xl font-extrabold font-display tracking-tight text-gray-900 dark:text-white">
            What our customers are saying
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="grid gap-10 lg:grid-cols-3"
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-800">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 relative">
                <span className="absolute -top-4 -left-4 text-6xl text-primary/10 font-display">“</span>
                {testimonial.quote}
              </p>
              <div className="flex items-center">
                <img className="w-12 h-12 rounded-full mr-4" src={testimonial.avatar} alt={testimonial.name} />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 