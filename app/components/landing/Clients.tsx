"use client";

import React from 'react';
import { motion } from 'framer-motion';

const clientLogos = [
  { name: 'Transistor', logo: <svg className="h-10 w-auto text-gray-400" viewBox="0 0 158 48" fill="currentColor"><path d="M46.811 48c-12.234 0-22.16-9.926-22.16-22.16V1.48C24.651.662 25.313 0 26.131 0h19.2c.818 0 1.48.662 1.48 1.48v21.84c0 7.42 6.02 13.44 13.44 13.44h1.44c7.42 0 13.44-6.02 13.44-13.44V1.48c0-.818.662-1.48 1.48-1.48h19.2c.818 0 1.48.662 1.48 1.48v21.84c0 12.234-9.926 22.16-22.16 22.16H46.811z"/></svg> },
  { name: 'Reform', logo: <svg className="h-10 w-auto text-gray-400" viewBox="0 0 158 48" fill="currentColor"><path d="M41.867 48H22.667c-.818 0-1.48-.662-1.48-1.48V1.48c0-.818.662-1.48 1.48-1.48h19.2c12.234 0 22.16 9.926 22.16 22.16S54.101 48 41.867 48zm0-13.44c-4.885 0-8.84-3.955-8.84-8.84s3.955-8.84 8.84-8.84 8.84 3.955 8.84 8.84-3.955 8.84-8.84 8.84zM109.867 48H90.667c-.818 0-1.48-.662-1.48-1.48V1.48c0-.818.662-1.48 1.48-1.48h19.2c12.234 0 22.16 9.926 22.16 22.16S122.101 48 109.867 48zm0-13.44c-4.885 0-8.84-3.955-8.84-8.84s3.955-8.84 8.84-8.84 8.84 3.955 8.84 8.84-3.955 8.84-8.84 8.84z"/></svg> },
  { name: 'Tuple', logo: <svg className="h-10 w-auto text-gray-400" viewBox="0 0 158 48" fill="currentColor"><path d="M46.811 48c-12.234 0-22.16-9.926-22.16-22.16V1.48C24.651.662 25.313 0 26.131 0h19.2c.818 0 1.48.662 1.48 1.48v21.84c0 7.42 6.02 13.44 13.44 13.44h1.44c7.42 0 13.44-6.02 13.44-13.44V1.48c0-.818.662-1.48 1.48-1.48h19.2c.818 0 1.48.662 1.48 1.48v21.84c0 12.234-9.926 22.16-22.16 22.16H46.811z"/></svg> },
  { name: 'SavvyCal', logo: <svg className="h-10 w-auto text-gray-400" viewBox="0 0 158 48" fill="currentColor"><path d="M41.867 48H22.667c-.818 0-1.48-.662-1.48-1.48V1.48c0-.818.662-1.48 1.48-1.48h19.2c12.234 0 22.16 9.926 22.16 22.16S54.101 48 41.867 48zm0-13.44c-4.885 0-8.84-3.955-8.84-8.84s3.955-8.84 8.84-8.84 8.84 3.955 8.84 8.84-3.955 8.84-8.84 8.84z"/></svg> },
  { name: 'Statamic', logo: <svg className="h-10 w-auto text-gray-400" viewBox="0 0 158 48" fill="currentColor"><path d="M46.811 48c-12.234 0-22.16-9.926-22.16-22.16V1.48C24.651.662 25.313 0 26.131 0h19.2c.818 0 1.48.662 1.48 1.48v21.84c0 7.42 6.02 13.44 13.44 13.44h1.44c7.42 0 13.44-6.02 13.44-13.44V1.48c0-.818.662-1.48 1.48-1.48h19.2c.818 0 1.48.662 1.48 1.48v21.84c0 12.234-9.926 22.16-22.16 22.16H46.811z"/></svg> },
];

export default function Clients() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-center text-lg font-semibold leading-8 text-gray-900 dark:text-white">
            Trusted by the world’s most innovative teams
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {clientLogos.map((client) => (
              <div key={client.name} className="flex justify-center">
                {client.logo}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
} 