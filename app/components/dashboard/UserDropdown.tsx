'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { User } from 'next-auth';

export default function UserDropdown({ user, isCollapsed }: { user: User | undefined, isCollapsed: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);

  if (!user) return null;

  const handleSignOutClick = () => {
    setShowConfirmSignOut(true);
    setIsOpen(false); // Close dropdown when showing confirmation
  };

  const handleConfirmSignOut = () => {
    console.log('👋 User confirmed signout - see you later!');
    signOut({ callbackUrl: '/' });
  };

  const handleCancelSignOut = () => {
    setShowConfirmSignOut(false);
  };

  return (
    <>
      <div className="relative">
        <div
          className="flex items-center gap-4 p-4 border-t border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          {user.image && (
            <Image
              src={user.image}
              alt={user.name || "User avatar"}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          {!isCollapsed && (
            <>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </div>
        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 w-auto mx-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2">
              <button
                onClick={handleSignOutClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmSignOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.351 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Confirm Sign Out
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to sign out of your account?
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelSignOut}
                  className="text-black dark:text-black border-gray-300 dark:border-gray-600 dark:hover:text-white">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmSignOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 