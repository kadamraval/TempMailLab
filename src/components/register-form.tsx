
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
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type User, linkWithCredential, EmailAuthProvider } from "firebase/auth"
import { useAuth, useFirestore } from "@/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/actions/auth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

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
  
  async function handleRegistration(finalUser: User) {
    // This server action ensures the user document exists and is correctly configured.
    await signUp(finalUser.uid, finalUser.email, false); 
    
    toast({
      title: "Success",
      description: "Account created successfully.",
    });
    router.push("/");
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    
    const anonymousUser = auth.currentUser;

    try {
      let finalUser: User;
      
      if (anonymousUser && anonymousUser.isAnonymous) {
        // This is an anonymous user "upgrading" their account.
        const credential = EmailAuthProvider.credential(values.email, values.password);
        const linkResult = await linkWithCredential(anonymousUser, credential);
        finalUser = linkResult.user;
      } else {
        // This is a direct registration.
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        finalUser = userCredential.user;
      }

      await handleRegistration(finalUser);

    } catch (error: any) {
        let errorMessage = "An unknown error occurred during sign up.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email address is already in use by another account.";
        } else if (error.code === 'auth/credential-already-in-use') {
            errorMessage = "This account is already associated with another user. Please log in directly.";
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
        // signInWithPopup works for both new and existing anonymous users.
        // Firebase handles the account linking automatically in this case.
        const result = await signInWithPopup(auth, provider);
        await handleRegistration(result.user);
    } catch (error: any) {
        let errorMessage = error.message || "Could not sign up with Google. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = "An account already exists with the same email address but different sign-in credentials. Try signing in with a different method."
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
