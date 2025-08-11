'use client';

import { Button } from '@/components/ui/button';
import type { CalendarConnection } from '@/lib/types';
import { connectGoogleCalendar, disconnectCalendar, createTestBooking } from '@/actions/calendar';
import { format } from 'date-fns';
import { useTransition, useState } from 'react';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
        s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
        s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039
        l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
        c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
        c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );
  
  const MicrosoftIcon = () => (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#00A4EF" d="M1 12h10v10H1z" />
          <path fill="#7FBA00" d="M12 1h10v10H12z" />
          <path fill="#FFB900" d="M12 12h10v10H12z" />
      </svg>
  );

export default function CalendarConnection({ initialConnection, userId }: { initialConnection: CalendarConnection | null, userId: string }) {
    const [isPending, startTransition] = useTransition();
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

    const handleCreateTestBooking = () => {
        startTransition(async () => {
            console.log('📅 Creating test booking with all the calendar magic...');
            await createTestBooking(userId);
        });
    };

    const handleDisconnectClick = () => {
        setShowDisconnectDialog(true);
    };

    const handleConfirmDisconnect = () => {
        console.log('🔌 User confirmed calendar disconnect - removing connection...');
        startTransition(async () => {
            await disconnectCalendar(userId);
            setShowDisconnectDialog(false);
        });
    };

    const handleCancelDisconnect = () => {
        setShowDisconnectDialog(false);
    };
    
    return (
        <>
            <div className="mt-8 w-full max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="p-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Manage Calendar Connection
                        </h2>
                        {initialConnection ? (
                            <div className="text-left space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    {initialConnection.provider === 'google' ? <GoogleIcon /> : <MicrosoftIcon />}
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {initialConnection.account_email}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            Connected
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Connected On</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {format(new Date(initialConnection.connected_at), 'PPP')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">Bookings Made</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {initialConnection.bookings_count}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={handleCreateTestBooking}
                                        disabled={isPending}
                                    >
                                        {isPending ? 'Booking...' : 'Create Test Booking'}
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleDisconnectClick}
                                        disabled={isPending}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400">
                                    You do not have a calendar connected. Please connect an account to get started.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <form action={connectGoogleCalendar}>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto" type="submit">
                                            <GoogleIcon />
                                            Connect with Google
                                        </Button>
                                    </form>
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto" variant="secondary" disabled>
                                        <MicrosoftIcon />
                                        Connect with Microsoft
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Disconnect Confirmation Dialog */}
            {showDisconnectDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.351 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Disconnect Calendar
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Are you sure you want to disconnect your calendar? This will:
                                    </p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                            Remove access to your calendar data
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                            Disable automatic booking creation
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                            Require re-authentication to reconnect
                                        </li>
                                    </ul>
                                    {initialConnection && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                            Connected account: <span className="font-medium">{initialConnection.account_email}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelDisconnect}
                                    disabled={isPending}
                                    className="mr-2 text-gray-300 dark:text-white border-0 bg-red-500 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700">
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleConfirmDisconnect}
                                    disabled={isPending}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isPending ? 'Disconnecting...' : 'Disconnect Calendar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 