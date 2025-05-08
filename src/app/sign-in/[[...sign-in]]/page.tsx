'use client'; // Needs to be a client component to use hooks

import { useEffect } from 'react'; // Import useEffect
import { SignIn, useUser } from "@clerk/nextjs"; // Import useUser
import { useSearchParams, useRouter } from 'next/navigation'; // Import hooks for query params and routing

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser(); // Check if user is signed in and if hook is loaded

  const priceId = searchParams.get('priceId');

  useEffect(() => {
    // Only run this effect if the user is signed in and the user hook is loaded
    if (isSignedIn && isLoaded && priceId) {
      // User just signed in and there's a priceId in the query params,
      // meaning they were trying to subscribe before signing in.
      // Now, initiate the checkout session.

      const createCheckoutSession = async () => {
        try {
          const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priceId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create checkout session after sign-in');
          }

          const { url } = await response.json();
          if (url) {
            // Redirect to Stripe Checkout, replacing the current history entry
            window.location.replace(url);
          } else {
            throw new Error('Checkout session URL not found after sign-in.');
          }
        } catch (error) {
          console.error('Checkout initiation error after sign-in:', error);
          // On error, redirect to the dashboard and show an alert
          router.push('/dashboard');
          alert(`Error initiating checkout: ${(error as Error).message}`);
        }
      };

      createCheckoutSession();
    } else if (isSignedIn && isLoaded && !priceId) {
      // User signed in but no priceId, redirect to the default after sign-in URL
      // Clerk's SignIn component usually handles this, but this is a safeguard.
      router.push('/dashboard'); // Or process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
    }
    // If !isSignedIn and isLoaded, the SignIn component will render.
    // If !isLoaded, wait for the hook to load.

  }, [isSignedIn, isLoaded, priceId, router]); // Dependencies for the effect

  // If the user is signed in and we are processing the redirect,
  // or if the user hook is not yet loaded, show a loading state or nothing.
  if (isSignedIn && isLoaded && priceId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-950 p-4">
        <p>Redirecting to checkout...</p>
      </div>
    );
  }

  // Otherwise, render the default SignIn component
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-950 p-4">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}