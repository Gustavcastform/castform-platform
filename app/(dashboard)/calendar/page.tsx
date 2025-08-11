import CalendarConnectionStatus from "@/components/dashboard/CalendarConnectionStatus";

export const runtime = 'edge';

export default function CalendarPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-full py-12">
            <div className="w-full max-w-4xl px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendar Connections</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Connect your calendar to integrate with your AI agents.
                    </p>
                </div>
                <div className="flex justify-center mt-8">
                    <CalendarConnectionStatus />
                </div>
            </div>
        </div>
    );
} 