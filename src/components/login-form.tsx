
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
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { useAuth } from "@/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/actions/auth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

interface LoginFormProps {
  redirectPath?: string;
}

export function LoginForm({ redirectPath = "/" }: LoginFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function handleLogin(user: { uid: string; email: string | null }) {
    // Check for an existing anonymous inbox in local storage
    const storedInbox = localStorage.getItem('anonymousInbox');
    let anonymousInbox = null;
    if (storedInbox) {
      anonymousInbox = JSON.parse(storedInbox);
    }
    
    // Call server action to create DB entry if needed and migrate inbox
    await signUp(user.uid, user.email, anonymousInbox);

    // Clean up local storage
    localStorage.removeItem('anonymousInbox');
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    try {
        const result = await signInWithEmailAndPassword(auth, values.email, values.password);
        await handleLogin(result.user);

        toast({
            title: "Success",
            description: "Logged in successfully.",
        })
        router.push(redirectPath) 
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
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await handleLogin(result.user);

        toast({
            title: "Success",
            description: "Logged in successfully with Google.",
        });
        router.push(redirectPath);
    } catch (error: any) {
        toast({
            title: "Google Sign-In Failed",
            description: "Could not sign in with Google. Please try again.",
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

    