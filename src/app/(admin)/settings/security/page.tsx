
"use client"

import React, { useEffect, useState, useActionState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { changePassword, type FormState } from '@/lib/actions/security';

const initialState: FormState = {
    success: false,
    message: null,
};

function SubmitButton() {
  const [isPending, setIsPending] = useState(false);
  
  useEffect(() => {
    const form = document.querySelector('form[data-password-form]');
    if (!form) return;
    const handleSubmit = (e: Event) => {
        const formData = new FormData(e.target as HTMLFormElement);
        if (formData.get('newPassword') && formData.get('confirmPassword')) {
             setIsPending(true);
        }
    };
    form.addEventListener('submit', handleSubmit);
    return () => {
        form.removeEventListener('submit', handleSubmit);
    }
  }, []);

  return (
    <Button type="submit" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? "Changing..." : "Change Password"}
    </Button>
  )
}


export default function SecuritySettingsPage() {
    const [state, formAction] = useActionState(changePassword, initialState);
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? "Success" : "Error",
                description: state.message,
                variant: state.success ? "default" : "destructive",
            });
            if (state.success) {
                formRef.current?.reset();
            }
        }
    }, [state, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account's security settings.</CardDescription>
            </CardHeader>
            <form action={formAction} ref={formRef} data-password-form>
                <CardContent className="space-y-6">
                    {state.message && !state.success && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {state.errors?._form ? state.errors._form[0] : state.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="newPassword" name="newPassword" type="password" />
                        {state.errors?.password && <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" />
                        {state.errors?.confirmPassword && <p className="text-sm font-medium text-destructive">{state.errors.confirmPassword[0]}</p>}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="2fa" className="text-base">Two-Factor Authentication (2FA)</Label>
                            <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account.
                            </p>
                        </div>
                        <Switch id="2fa" disabled />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}
