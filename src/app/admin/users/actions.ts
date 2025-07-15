// @/app/admin/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { firestore, auth } from '@/lib/firebase-admin'
import type { User } from '@/types'

export async function getUsers(): Promise<User[]> {
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
        // Optionally add user with partial data if auth user is not found
      }
    }
    
    return usersList
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function upgradeUser(uid: string) {
  try {
    await firestore.collection('users').doc(uid).update({
      isPremium: true,
      planType: 'premium',
      planExpiry: null, // Or set a new expiry date
    })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error upgrading user:', error)
    return { success: false, error: 'Failed to upgrade user.' }
  }
}

export async function downgradeUser(uid: string) {
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
  try {
    // Delete from Firestore
    await firestore.collection('users').doc(uid).delete()
    // Delete from Firebase Auth
    await auth.deleteUser(uid)
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Failed to delete user.' }
  }
}
