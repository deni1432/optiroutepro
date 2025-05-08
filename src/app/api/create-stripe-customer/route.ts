import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient as getClerkClientInstance, getAuth, User } from '@clerk/nextjs/server'; // Renamed for clarity & import User type

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2023-10-16', // Removed to use SDK default
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch user details from Clerk to get email, name, etc.
    const clerkClient = await getClerkClientInstance(); // Await the promise to get the client instance
    const users = clerkClient.users; // Access users property from the resolved client instance
    const clerkUser: User = await users.getUser(clerkUserId); // Await the promise from getUser

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    // clerkUser.emailAddresses should be properly typed now
    const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Check if a Stripe customer already exists for this Clerk user ID
    // This would typically involve checking your database.
    // For now, we'll assume we need to create one if not found in DB.
    // We can also search Stripe for customers by metadata if we store clerk_user_id there.

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name || undefined, // Stripe allows name to be undefined
      metadata: {
        clerk_user_id: clerkUserId,
      },
    });

    // TODO: Save the customer.id (Stripe Customer ID) and clerkUserId to your database
    // For example: await db.users.update({ where: { clerkId: clerkUserId }, data: { stripeCustomerId: customer.id } });

    return NextResponse.json({ 
      message: 'Stripe customer created successfully', 
      stripeCustomerId: customer.id 
    });

  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Stripe customer' }, { status: 500 });
  }
}