import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await getClerkClientInstance();
    const user = await clerkClient.users.getUser(userId);
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      console.warn(`[Get Billing History API] Stripe Customer ID not found for user ${userId}.`);
      return NextResponse.json({ error: 'Stripe customer not found.' }, { status: 404 });
    }

    // Fetch invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10, // Limit to the last 10 invoices
    });

    // Map relevant invoice data for the frontend
    const billingHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      created: invoice.created, // Unix timestamp
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf, // URL to the PDF
    }));

    return NextResponse.json({ billingHistory });

  } catch (error: any) {
    console.error('[Get Billing History API] Error fetching billing history:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch billing history.' }, { status: 500 });
  }
}