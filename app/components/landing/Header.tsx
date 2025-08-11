"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 md:py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <svg
            className="w-6 h-6 text-gray-900 dark:text-gray-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Castform
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            Features
          </Link>
          <Link href="/#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            Pricing
          </Link>
          <Link href="/#contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            Contact
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
          ) : session ? (
            <>
              <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">
                Welcome, {session.user?.name?.split(' ')[0]}
              </span>
               <Link href="/profile">
                <Button variant="default">Dashboard</Button>
              </Link>
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            null
          )}
        </div>
      </div>
    </header>
  );
} 