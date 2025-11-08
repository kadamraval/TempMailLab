
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
             <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Admin Access</CardTitle>
                    <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    )
}
