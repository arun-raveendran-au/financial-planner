import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SideNav } from '@/components/layout/SideNav';
import { TopBar } from '@/components/layout/TopBar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
