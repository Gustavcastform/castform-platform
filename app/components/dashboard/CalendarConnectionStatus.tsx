import { auth } from "@/lib/auth";
import { getCalendarConnection } from "@/lib/calendar/calendar";
import CalendarConnection from "./CalendarConnection";

export default async function CalendarConnectionStatus() {
    const session = await auth();
    if (!session?.user?.id) {
        return <div>Not authenticated</div>;
    }

    const connection = await getCalendarConnection(session.user.id);
    
    return <CalendarConnection initialConnection={connection} userId={session.user.id} />;
} 