import { auth } from "@/lib/auth";
import DashboardClientLayout from "./DashboardClientLayout";

export const runtime = 'edge';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    
    return (
        <DashboardClientLayout user={session?.user ?? null}>
            {children}
        </DashboardClientLayout>
    );
}