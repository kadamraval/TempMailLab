
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type User } from "firebase/auth"
import { doc, setDoc, writeBatch, collection, serverTimestamp, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type Inbox } from "@/types"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const LOCAL_INBOX_KEY = 'tempinbox_anonymous_session';

export function RegisterForm() {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })
  
  async function handleRegistrationSuccess(finalUser: User) {
    if (!firestore) return;

    // Use a batch to ensure atomic write for both user and inbox
    const batch = writeBatch(firestore);

    // 1. Create the user document
    const userRef = doc(firestore, 'users', finalUser.uid);
    batch.set(userRef, {
        uid: finalUser.uid,
        email: finalUser.email,
        isAnonymous: false,
        planId: 'free-default',
        isAdmin: false,
        createdAt: serverTimestamp(),
    });

    // 2. Check for a local inbox and migrate it
    const localInboxData = localStorage.getItem(LOCAL_INBOX_KEY);
    if (localInboxData) {
        const parsed: Inbox = JSON.parse(localInboxData);
        if (new Date(parsed.expiresAt) > new Date()) {
            const inboxRef = doc(collection(firestore, 'inboxes')); // new inbox
            batch.set(inboxRef, {
                userId: finalUser.uid,
                emailAddress: parsed.emailAddress,
                expiresAt: parsed.expiresAt,
                createdAt: serverTimestamp(),
            });
        }
        localStorage.removeItem(LOCAL_INBOX_KEY);
    }
    
    // Commit the atomic batch
    await batch.commit();
    
    toast({
      title: "Success",
      description: "Account created successfully.",
    });
    router.push("/");
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await handleRegistrationSuccess(userCredential.user);
    } catch (error: any) {
        let errorMessage = "An unknown error occurred during sign up.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email address is already in use by another account.";
        }
        toast({
            title: "Registration Failed",
            description: errorMessage,
            variant: "destructive",
        })
    }
  }

  async function handleGoogleSignIn() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    
    try {
        const result = await signInWithPopup(auth, provider);
        // Check if user already exists in Firestore to prevent overwriting data
        const userRef = doc(firestore, 'users', result.user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await handleRegistrationSuccess(result.user);
        } else {
          toast({ title: "Welcome back!", description: "Successfully logged in with Google."});
          router.push('/');
        }
    } catch (error: any) {
        let errorMessage = error.message || "Could not sign up with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential' || error.code === 'auth/credential-already-in-use') {
            errorMessage = "An account already exists with this email. Please log in with the original method."
        }
        toast({
            title: "Google Sign-Up Failed",
            description: errorMessage,
            variant: "destructive",
        });
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-66.5 64.6C305.5 99.6 279.2 88 248 88c-73.2 0-132.3 59.2-132.3 132.3s59.1 132.3 132.3 132.3c76.1 0 124.2-61.4 127.8-93.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            Google
        </Button>
         <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
