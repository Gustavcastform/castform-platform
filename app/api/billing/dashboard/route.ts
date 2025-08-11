import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBillingDashboardData } from '@/lib/billing';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardData = await getBillingDashboardData(session.user.id);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching billing dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
