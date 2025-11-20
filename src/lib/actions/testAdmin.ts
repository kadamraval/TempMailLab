
'use server';

import { getAdminFirestore } from '@/lib/firebase/server-init';

/**
 * A simple server action to test if the Firebase Admin SDK is initialized
 * and can perform a privileged Firestore read.
 */
export async function testAdminSdkAction(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    console.log('[testAdminSdkAction] Initializing Admin Firestore...');
    // This function will now throw a helpful error if the .env variables are missing.
    const firestore = getAdminFirestore(); 
    
    console.log('[testAdminSdkAction] Attempting to read /admin_settings/mailgun...');
    const adminSettingsDocRef = firestore.doc('admin_settings/mailgun');
    const docSnap = await adminSettingsDocRef.get();
    
    if (docSnap.exists) {
      console.log('[testAdminSdkAction] SUCCESS: Document exists.');
      const data = docSnap.data();
      const response = `Domain: ${data?.domain || 'not set'}`;
      return { success: true, data: response };
    } else {
       console.log('[testAdminSdkAction] SUCCESS: Admin SDK read successfully, but document does not exist.');
      return { success: true, data: "Document /admin_settings/mailgun does not exist, but the read was permitted." };
    }

  } catch (error: any) {
    console.error('[testAdminSdkAction] FAILED:', error);
    // Provide a clear error message that tells the user exactly what to do.
    return { 
      success: false, 
      error: `Admin SDK initialization failed. ${error.message}`
    };
  }
}
