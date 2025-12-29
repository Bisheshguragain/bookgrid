import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { RealtimeStatus } from './RealtimeStatus';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <RealtimeStatus />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
