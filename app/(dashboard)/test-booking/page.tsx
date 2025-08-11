'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';

export default function TestBookingPage() {
    const { data: session } = useSession();
    const [isPending, startTransition] = useTransition();
    const [dateTime, setDateTime] = useState('');
    const [attendeeEmail, setAttendeeEmail] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('Test Meeting');
    const [response, setResponse] = useState<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) {
            setResponse({ error: 'User not authenticated' });
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch(`/api/book-meeting?userId=${session.user.id}&attendeeEmail=${attendeeEmail}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dateTime: new Date(dateTime).toISOString(),
                        meetingTitle,
                    }),
                });
                const data = await res.json();
                setResponse(data);
            } catch (error) {
                setResponse({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
            }
        });
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Test Meeting Booking</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date and Time</label>
                    <input
                        id="dateTime"
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label htmlFor="attendeeEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attendee Email</label>
                    <input
                        id="attendeeEmail"
                        type="email"
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        required
                        placeholder="invitee@example.com"
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label htmlFor="meetingTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Title</label>
                    <input
                        id="meetingTitle"
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isPending ? 'Booking...' : 'Book Meeting'}
                </button>
            </form>
            {response && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Response:</h2>
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
