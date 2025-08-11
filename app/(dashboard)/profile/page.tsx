import { auth } from "../../lib/auth";
import Image from "next/image";

export const runtime = 'edge';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-gray-500">
          You need to be signed in to view this page.
        </p>
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || "User avatar"}
                width={80}
                height={80}
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              User Details
            </h2>
            <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-md text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 