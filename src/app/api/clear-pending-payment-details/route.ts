import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient as getClerkClientInstance } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await getClerkClientInstance();
    const user = await clerkClient.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};

    console.log(`[Clear Pending API] User ${userId} attempting to clear pending payment details.`);

    // Fields to nullify
    const metadataUpdates = {
      pendingPaymentClientSecret: null,
      pendingPaymentIntentId: null,
      pendingInvoiceId: null,
    };

    // Create new metadata object ensuring not to spread null/undefined over existing valid fields
    const newMetadata: Record<string, any> = { ...existingMetadata };
    for (const key in metadataUpdates) {
        // If the update value is null, effectively remove the key or set to null
        // For Clerk, setting to null should remove it or be treated as such by the frontend
        newMetadata[key] = null; 
    }
    // Remove keys that were set to null if Clerk treats null as "keep existing"
    // A more robust way is to build the new metadata object carefully
    const finalMetadata: Record<string, any> = {};
    for (const key in existingMetadata) {
        if (!(key in metadataUpdates)) { // Keep existing fields not being cleared
            finalMetadata[key] = existingMetadata[key];
        }
    }
    // Add nulls for fields being cleared (Clerk should handle this as deletion or nullification)
    finalMetadata.pendingPaymentClientSecret = null;
    finalMetadata.pendingPaymentIntentId = null;
    finalMetadata.pendingInvoiceId = null;


    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: finalMetadata,
    });

    console.log(`[Clear Pending API] Successfully cleared pending payment details for user ${userId}.`);
    return NextResponse.json({ success: true, message: 'Pending payment details cleared.' });

  } catch (error: any) {
    console.error('[Clear Pending API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to clear pending payment details.' }, { status: 500 });
  }
}