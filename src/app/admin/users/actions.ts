// @/app/admin/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { firestore, auth } from '@/lib/firebase-admin'
import type { User } from '@/types'

export async function getUsers(): Promise<User[]> {
  if (!firestore || !auth) {
    console.log("Firebase not configured, skipping user fetch.");
    return [];
  }
  
  try {
    const usersSnapshot = await firestore.collection('users').get()
    if (usersSnapshot.empty) {
      return []
    }
    
    const usersList: User[] = []
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()
      try {
        const authUser = await auth.getUser(doc.id)
        usersList.push({
          uid: doc.id,
          email: authUser.email || 'N/A',
          isPremium: userData.isPremium || false,
          planType: userData.planType || 'free',
          planExpiry: userData.planExpiry?.toDate().toLocaleDateString() || 'N/A',
          mailTmId: userData.mailTmId || 'N/A',
          inboxCount: userData.inboxCount || 0,
        })
      } catch (authError) {
        console.warn(`Could not fetch auth user for UID: ${doc.id}`, authError)
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
      planExpiry: null,
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
      planExpiry: null,
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
    await firestore.collection('users').doc(uid).delete()
    await auth.deleteUser(uid)
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Failed to delete user.' }
  }
}
