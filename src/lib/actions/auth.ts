"use server"

import * as z from "zod"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function signUpAction(credentials: z.infer<typeof signUpSchema>) {
  try {
    const validatedCredentials = signUpSchema.parse(credentials);
    const { email, password } = validatedCredentials;

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false, // Or true if you have email verification flow
    });

    // Create user document in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      createdAt: new Date().toISOString(),
      planType: 'free', // Default plan
      isPremium: false,
    });

    return { success: true, userId: userRecord.uid };

  } catch (error: any) {
    let errorMessage = "An unknown error occurred.";
    if (error.code === 'auth/email-already-exists') {
        errorMessage = "This email address is already in use by another account.";
    } else if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => e.message).join(", ");
    }
    console.error("SignUp Error:", error);
    return { error: errorMessage };
  }
}

// Note: signInAction does not actually sign the user in on the server.
// Firebase Auth requires client-side sign-in to establish a session.
// This action just validates credentials before the client attempts to sign in.
// For a real app, you'd handle sign-in on the client and pass the ID token
// to the server to create a session cookie. For this setup, we'll keep it simple.
export async function signInAction(credentials: z.infer<typeof signInSchema>) {
   try {
    const validatedCredentials = signInSchema.parse(credentials);
    const { email } = validatedCredentials;
    const adminAuth = getAdminAuth();
    // We can check if the user exists, but can't verify password here without custom logic
    await adminAuth.getUserByEmail(email);
    return { success: true };
  } catch (error: any) {
    let errorMessage = "Invalid credentials or user does not exist.";
     if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email.";
    }
    console.error("SignIn Validation Error:", error);
    return { error: errorMessage };
  }
}
