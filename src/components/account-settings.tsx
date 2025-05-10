'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, FileText, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Define Plan Limits again (ideally shared from a common lib)
const PLAN_LIMITS = {
  'price_1RMkdoAEvm0dTvhJ2ZAeLPkj': { maxStops: 100, maxOptimizations: 50, name: 'Pro', level: 1 },
  'price_1RMkePAEvm0dTvhJro8NBlJF': { maxStops: Infinity, maxOptimizations: Infinity, name: 'Unlimited', level: 2 }, // Corrected typo in Unlimited plan ID
};
const NO_ACCESS_LIMITS = { maxStops: 0, maxOptimizations: 0, name: 'No Active Plan', level: -1 };


import { useState, useEffect } from 'react';

export default function AccountSettings() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<{ brand?: string; last4?: string } | null>(null);
  const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(true);
  const [billingHistory, setBillingHistory] = useState<any[]>([]); // State for billing history
  const [isLoadingBillingHistory, setIsLoadingBillingHistory] = useState(true); // Loading state for billing history
  // Removed showCancelConfirm state

  // Removed useToast hook initialization

  if (!isLoaded || !isSignedIn) {
    return <div className="p-4">Loading account information...</div>;
  }

  const userMetadata = user.publicMetadata || {};
  const currentStripePlanId = userMetadata.stripePlanId as string | undefined;
  const optimizationsUsedThisCycle = (userMetadata.optimizationsUsedThisCycle as number) || 0;
  const subCycleStartDate = userMetadata.subCycleStartDate as number | undefined; // Unix timestamp

  const planLimits = currentStripePlanId ? (PLAN_LIMITS[currentStripePlanId as keyof typeof PLAN_LIMITS] || NO_ACCESS_LIMITS) : NO_ACCESS_LIMITS;
  const planName = planLimits.name;
  const maxOptimizations = planLimits.maxOptimizations;

  // Calculate progress for optimizations
  const optimizationProgress = maxOptimizations === Infinity ? 100 : (maxOptimizations > 0 ? (optimizationsUsedThisCycle / maxOptimizations) * 100 : 0);

  // Format renewal date (if applicable)
  const renewalDate = subCycleStartDate ? new Date(subCycleStartDate * 1000 + (30 * 24 * 60 * 60 * 1000)) : null; // Assuming monthly cycles for simplicity

  // Function to create and redirect to Stripe Customer Portal
  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create customer portal session:', data.error);
        alert('Failed to open billing settings. Please try again.'); // Reverted to alert
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      alert('An error occurred. Please try again.'); // Reverted to alert
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Function to handle subscription cancellation
  const handleCancelSubscription = async () => {
    console.log('Cancel Plan button clicked'); // Keep console log for debugging if needed
    if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) { // Reverted to window.confirm
      setIsCanceling(true);
      try {
        const response = await fetch('/api/cancel-subscription', {
          method: 'POST',
        });
        const data = await response.json();
        if (response.ok) {
          alert('Subscription canceled successfully.'); // Reverted to alert
          // Clerk webhook should update metadata, but a slight delay is possible.
          // Consider refreshing user data here if needed for immediate UI update.
          // user.reload();
        } else {
          console.error('Failed to cancel subscription:', data.error);
          alert(`Failed to cancel subscription: ${data.error}`); // Reverted to alert
        }
      } catch (error) {
        console.error('Error canceling subscription:', error);
        alert('An error occurred while canceling. Please try again.'); // Reverted to alert
      } finally {
        setIsCanceling(false);
      }
    }
  };

  useEffect(() => {
    // Fetch payment method when the component mounts or the user's plan changes
    const fetchPaymentMethod = async () => {
      if (!currentStripePlanId) {
        setPaymentMethod(null);
        setIsLoadingPaymentMethod(false);
        return;
      }

      setIsLoadingPaymentMethod(true);
      try {
        const response = await fetch('/api/get-payment-method');
        const data = await response.json();
        if (response.ok && data.brand && data.last4) {
          setPaymentMethod(data);
        } else {
          setPaymentMethod(null); // No payment method found or error
          console.error('Failed to fetch payment method:', data.error || data.message);
        }
      } catch (error) {
        console.error('Error fetching payment method:', error);
        setPaymentMethod(null);
      } finally {
        setIsLoadingPaymentMethod(false);
      }
    };

    fetchPaymentMethod();
  }, [currentStripePlanId]);

  useEffect(() => {
    // Fetch billing history when the component mounts or the user's plan changes
    const fetchBillingHistory = async () => {
      if (!currentStripePlanId) {
        setBillingHistory([]);
        setIsLoadingBillingHistory(false);
        return;
      }

      setIsLoadingBillingHistory(true);
      try {
        const response = await fetch('/api/get-billing-history');
        const data = await response.json();
        if (response.ok && data.billingHistory) {
          setBillingHistory(data.billingHistory);
        } else {
          setBillingHistory([]); // No billing history found or error
          console.error('Failed to fetch billing history:', data.error || data.message);
        }
      } catch (error) {
        console.error('Error fetching billing history:', error);
        setBillingHistory([]);
      } finally {
        setIsLoadingBillingHistory(false);
      }
    };

    fetchBillingHistory();
  }, [currentStripePlanId]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>
      <p className="text-muted-foreground">Manage your subscription and billing details</p>

      {/* Billing & Subscription Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">
            {planName} Plan
            {currentStripePlanId && (
               <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                 Current Plan
               </span>
            )}
          </CardTitle>
          {/* Buttons moved to CardContent */}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Button container in CardContent - Billing Settings button removed */}
          {currentStripePlanId && ( // Only show buttons if they have a plan
            <div className="flex flex-row items-center space-x-2 mb-4"> {/* Changed to flex-row for all screen sizes */}
               {/* Link to Pricing Page for Change Plan */}
               <Button variant="outline" size="sm" asChild>
                  <Link href="/pricing">Change Plan</Link>
               </Button>
               {/* Cancel Plan Button (requires API endpoint) */}
               {planLimits.level > 0 && ( // Only show cancel for paid plans
                 <Button // Reverted to standard button, not DialogTrigger
                   variant="destructive"
                   size="sm"
                   onClick={handleCancelSubscription} // Reverted to direct click handler
                   disabled={isCanceling}
                 >
                    {isCanceling ? 'Canceling...' : 'Cancel Plan'}
                 </Button>
               )}
               {/* Billing Settings Button removed from here */}
            </div>
          )}

          {currentStripePlanId ? (
            <>
              {renewalDate && <p className="text-muted-foreground text-sm">Renews on {renewalDate.toLocaleDateString()}</p>}

              {/* Usage Limits */}
              {maxOptimizations !== Infinity && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">API Requests (Optimizations)</p>
                    <p className="text-sm text-muted-foreground">{optimizationsUsedThisCycle} / {maxOptimizations}</p>
                  </div>
                  <Progress value={optimizationProgress} className="w-full" />
                </div>
              )}
              {/* Add other limits here if applicable */}
              
            </>
          ) : (
             <p className="text-muted-foreground">You do not have an active plan. <Link href="/pricing" className="text-primary hover:underline">Choose a plan</Link> to get started.</p>
          )}
        </CardContent>
      </Card>
      {/* Payment Method Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Payment Method</CardTitle>
          {/* Buttons moved to CardContent */}
        </CardHeader>
        <CardContent className="space-y-4"> {/* Added space-y-4 for consistency */}
          {/* Button container in CardContent */}
          {currentStripePlanId && ( // Only show buttons if they have a plan
            <div className="flex flex-row items-center space-x-2 mb-4"> {/* Flex row with spacing and bottom margin */}
              {/* Billing Settings Button moved here */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={isPortalLoading}
              >
                 {isPortalLoading ? 'Loading...' : <><Settings className="mr-2 h-4 w-4" /> Billing Settings</>}
              </Button>
              {/* Update Payment Method Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling} // Use the same handler for updating payment method
                disabled={isPortalLoading}
              >
                 {isPortalLoading ? 'Loading...' : 'Update Payment Method'}
              </Button>
            </div>
          )}

          {isLoadingPaymentMethod ? (
            <p className="text-muted-foreground">Loading payment method...</p>
          ) : paymentMethod ? (
            <div className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">{paymentMethod.brand} ending in {paymentMethod.last4}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No payment method on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Billing History Card (Placeholder) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Billing History</CardTitle>
           {currentStripePlanId && ( // Only show download button if they have a plan
             <Button variant="outline" size="sm" onClick={() => { /* TODO: Implement Download All Logic */ alert("Download All clicked. Implement API call to fetch invoices."); }}>
                <Download className="mr-2 h-4 w-4" /> Download All
             </Button>
           )}
        </CardHeader>
        <CardContent>
          {isLoadingBillingHistory ? (
            <p className="text-muted-foreground">Loading billing history...</p>
          ) : billingHistory.length > 0 ? (
            <div className="space-y-4">
              {billingHistory.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Invoice {invoice.number || invoice.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(invoice.created * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${invoice.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                      {invoice.status === 'paid' ? 'Paid' : 'Due'}
                    </span>
                    <span className="text-sm font-semibold">
                      {(invoice.amount_due / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </span>
                    {invoice.invoice_pdf && (
                      <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No billing history found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}