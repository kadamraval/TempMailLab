
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
            <LoginForm redirectPath="/" />
        </div>
    )
}
