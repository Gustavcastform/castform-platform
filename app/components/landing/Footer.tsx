"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Integrations', href: '#' },
    { name: 'Updates', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Blog', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Security', href: '#' },
  ],
};

const socialLinks = [
  { name: 'Twitter', icon: '🐦', href: '#' },
  { name: 'LinkedIn', icon: '🔗', href: '#' },
  { name: 'GitHub', icon: '👨‍💻', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold font-display text-primary dark:text-primary-light mb-4">Castform</h3>
            <p className="text-gray-500 dark:text-gray-400">AI-powered voice agents for automated customer outreach.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}><Link href={link.href} className="text-gray-600 dark:text-gray-300 hover:text-primary">{link.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}><Link href={link.href} className="text-gray-600 dark:text-gray-300 hover:text-primary">{link.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}><Link href={link.href} className="text-gray-600 dark:text-gray-300 hover:text-primary">{link.name}</Link></li>
              ))}
            </ul>
          </div>
        </motion.div>
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Castform, Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-gray-400 hover:text-primary text-2xl">
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 