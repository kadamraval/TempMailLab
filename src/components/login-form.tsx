
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
import { useToast } from "@/hooks/use-toast"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUpAction } from "@/lib/actions/auth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

interface LoginFormProps {
  redirectPath?: string;
}

const LOCAL_INBOX_KEY = 'tempinbox_anonymous_inbox';

export function LoginForm({ redirectPath = "/" }: LoginFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth()
  const firestore = useFirestore()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  
  async function handleLoginSuccess(user: User) {
    if (!firestore || !auth) return;
    
    const isAdminLogin = redirectPath.startsWith('/admin');
    
    // For admin login, perform the isAdmin check immediately.
    if (isAdminLogin) {
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data()?.isAdmin) {
             toast({ title: "Success", description: "Admin logged in successfully." });
             router.push(redirectPath);
             router.refresh(); // Force a refresh to ensure layout re-evaluates
        } else {
             // If not an admin, show an error and sign them out immediately.
             await auth.signOut();
             toast({ title: "Permission Denied", description: "You do not have administrative privileges.", variant: "destructive" });
        }
        return;
    }
    
    // For regular user login, check if a profile exists. If not, create one.
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
       const anonymousInboxData = localStorage.getItem(LOCAL_INBOX_KEY);
       const result = await signUpAction(user.uid, user.email!, anonymousInboxData);
       if (!result.success) {
           await auth.signOut();
           throw new Error(result.error || "Failed to create user profile during login.");
       }
       localStorage.removeItem(LOCAL_INBOX_KEY);
    }
    
    toast({ title: "Success", description: "Logged in successfully." });
    router.push(redirectPath);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;

    try {
        const result = await signInWithEmailAndPassword(auth, values.email, values.password);
        await handleLoginSuccess(result.user);
    } catch (error: any) {
        let errorMessage = "An unknown error occurred.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Invalid email or password. Please try again.";
        }
        toast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive",
        })
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    
    try {
        const result = await signInWithPopup(auth, provider);
        await handleLoginSuccess(result.user);
    } catch (error: any) {
        let errorMessage = error.message || "Could not sign in with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = "An account already exists with the same email address but different sign-in credentials. Try signing in with a different method."
        }
        toast({
            title: "Google Sign-In Failed",
            description: errorMessage,
            variant: "destructive",
        });
    }
  }

  return (
      <div>
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
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
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
            Don't have an account?{" "}
            <Link href="/register" className="underline">
                Sign up
            </Link>
        </div>
      </div>
  )
}
