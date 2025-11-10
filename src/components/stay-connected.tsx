import { Zap, HelpCircle, Lock, CalendarCheck } from "lucide-react";
import { SubscribeForm } from "./subscribe-form";
import { Separator } from "./ui/separator";

const features = [
    { icon: <Zap className="h-5 w-5 text-primary" />, text: "Weekly updates" },
    { icon: <HelpCircle className="h-5 w-5 text-primary" />, text: "Customer support" },
    { icon: <Lock className="h-5 w-5 text-primary" />, text: "Secure and privacy" },
    { icon: <CalendarCheck className="h-5 w-5 text-primary" />, text: "99.99% uptime" },
];

export function StayConnected() {
    return (
        <div className="border-t">
            <div className="container mx-auto px-4 py-16 sm:py-24 space-y-8">
                <SubscribeForm />
            </div>
        </div>
    );
}
