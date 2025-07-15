// @/app/admin/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { firestore, auth } from '@/lib/firebase-admin'
import type { User } from '@/types'
import type { UserRecord } from 'firebase-admin/auth'
import type { Timestamp } from 'firebase-admin/firestore'

async function getUserAuthRecords(uids: string[]): Promise<Map<string, UserRecord>> {
    if (!auth) return new Map();
    const result = await auth.getUsers(uids.map(uid => ({ uid })));
    const userMap = new Map<string, UserRecord>();
    result.users.forEach(user => userMap.set(user.uid, user));
    return userMap;
}


export async function getUsers(): Promise<User[]> {
  if (!firestore) {
    console.log("Firebase not configured, skipping user fetch.");
    return [];
  }
  
  try {
    const usersSnapshot = await firestore.collection('users').orderBy('createdAt', 'desc').get()
    if (usersSnapshot.empty) {
      return []
    }
    
    const uids = usersSnapshot.docs.map(doc => doc.id);
    const authUserMap = await getUserAuthRecords(uids);
    
    const usersList: User[] = []
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()
      const authUser = authUserMap.get(doc.id);
      
      const createdAtTimestamp = userData.createdAt as Timestamp | undefined;

      if (authUser) {
         usersList.push({
            uid: doc.id,
            email: authUser.email || 'N/A',
            isPremium: userData.isPremium || false,
            planType: userData.planType || 'free',
            inboxCount: userData.inboxCount || 0,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toLocaleDateString() : 'N/A',
        })
      }
    }
    
    return usersList
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function upgradeUser(uid: string) {
  if (!firestore) return { success: false, error: 'Firebase not configured.' };
  try {
    await firestore.collection('users').doc(uid).update({
      isPremium: true,
      planType: 'premium',
    })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error upgrading user:', error)
    return { success: false, error: 'Failed to upgrade user.' }
  }
}

export async function downgradeUser(uid: string) {
  if (!firestore) return { success: false, error: 'Firebase not configured.' };
  try {
    await firestore.collection('users').doc(uid).update({
      isPremium: false,
      planType: 'free',
    })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error downgrading user:', error)
    return { success: false, error: 'Failed to downgrade user.' }
  }
}

export async function deleteUser(uid: string) {
  if (!firestore || !auth) return { success: false, error: 'Firebase not configured.' };
  try {
    // These should be in a transaction in a real-world app
    await firestore.collection('users').doc(uid).delete()
    await auth.deleteUser(uid)
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to delete user: ${errorMessage}` };
  }
}
