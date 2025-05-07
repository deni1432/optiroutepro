import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinned } from 'lucide-react';
import RouteForm from '@/components/route-form';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    // This case should ideally be handled by Clerk's middleware redirecting to sign-in
    // For now, providing a link to sign in.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
        <p className="mb-6 text-muted-foreground">You need to be signed in to view the dashboard.</p>
        <Link href="/sign-in">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <Link href="/" className="flex items-center space-x-2">
            <MapPinned className="h-6 w-6 text-primary" />
            <span className="font-bold">OptiRoutePro Dashboard</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              {/* UserButton will go here once Clerk is fully set up */}
              <p className="text-sm text-muted-foreground">Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}</p>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Routes</h1>
          
          {/* Route Input Form */}
          <section className="mb-8">
            <RouteForm />
          </section>

          {/* Placeholder for Map Preview and Optimized Route List */}
          <section className="p-6 border rounded-lg shadow-sm bg-card">
            <h2 className="text-xl font-semibold mb-4">Optimized Route</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-muted-foreground">Map preview will be here...</p>
                {/* TODO: Implement Leaflet Map Component */}
              </div>
              <div>
                <p className="text-muted-foreground">Optimized stops list will be here...</p>
                {/* TODO: Implement Optimized Stops List Component */}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer (optional for dashboard) */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        OptiRoutePro &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}