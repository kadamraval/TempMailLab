
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
import { GoogleAuthProvider, linkWithCredential, EmailAuthProvider, signInWithPopup, AuthCredential } from "firebase/auth"
import { useAuth, useUser } from "@/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUpAction } from "@/lib/actions/auth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const LOCAL_INBOX_KEY = 'tempinbox_anonymous_inbox';

export function RegisterForm() {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth();
  const { user: anonymousUser } = useUser(); // Get the current anonymous user

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // A generic handler for linking credentials and finalizing registration
  const handleRegistration = async (credential: AuthCredential, email: string) => {
    if (!auth || !anonymousUser || !anonymousUser.isAnonymous) {
        toast({ title: "Error", description: "No active anonymous session to upgrade. Please refresh and try again.", variant: "destructive" });
        return;
    }

    try {
        // Link the anonymous account with the new credential
        const userCredential = await linkWithCredential(anonymousUser, credential);
        const registeredUser = userCredential.user;
        
        // Call the server action to create the user document in Firestore and migrate the inbox
        const anonymousInboxData = localStorage.getItem(LOCAL_INBOX_KEY);
        const result = await signUpAction(registeredUser.uid, email, anonymousInboxData);

        if (result.success) {
            localStorage.removeItem(LOCAL_INBOX_KEY); // Clean up local storage
            toast({ title: "Success", description: "Account created successfully." });
            router.push("/");
        } else {
            throw new Error(result.error || "Server-side registration failed.");
        }
    } catch (error: any) {
        let errorMessage = "An unknown error occurred during registration.";
        if (error.code === 'auth/email-already-in-use' || error.code === 'auth/credential-already-in-use') {
            errorMessage = "This email address is already in use by another account. Please try logging in instead.";
        } else if (error.code === 'auth/provider-already-linked') {
            errorMessage = "This social account is already linked to another user."
        }
        console.error("Registration Error: ", error);
        toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const credential = EmailAuthProvider.credential(values.email, values.password);
    await handleRegistration(credential, values.email);
  }

  async function handleGoogleSignIn() {
    if (!auth || !anonymousUser) {
       toast({ title: "Error", description: "Authentication service not ready. Please try again in a moment.", variant: "destructive" });
       return;
    };
    const provider = new GoogleAuthProvider();
    
    // Instead of linking here, we sign in with popup *if the user is anonymous*
    // This is because linking an anonymous user to a popup requires a different flow
    // that is better handled by getting the credential first.
    try {
        const result = await signInWithPopup(anonymousUser, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential) {
            throw new Error("Could not get credential from Google sign-in.");
        }
        // The handleRegistration function is no longer needed here as signInWithPopup with an anon user
        // automatically upgrades the user. We just need to call our server action.
        const registeredUser = result.user;
        const anonymousInboxData = localStorage.getItem(LOCAL_INBOX_KEY);
        const signUpResult = await signUpAction(registeredUser.uid, registeredUser.email!, anonymousInboxData);

        if (signUpResult.success) {
             localStorage.removeItem(LOCAL_INBOX_KEY);
             toast({ title: "Success", description: "Account created successfully." });
             router.push('/');
        } else {
            throw new Error(signUpResult.error || "Server-side registration failed.");
        }

    } catch (error: any) {
         let errorMessage = "An unknown error occurred during registration.";
        if (error.code === 'auth/email-already-in-use' || error.code === 'auth/credential-already-in-use') {
            errorMessage = "This email address is already in use by another account. Please try logging in instead.";
        }
        console.error("Google Sign In Error:", error);
        toast({ title: "Google Sign-In Failed", description: errorMessage, variant: "destructive" });
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
