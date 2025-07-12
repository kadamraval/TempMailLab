import { Zap, HelpCircle, Lock, CalendarCheck } from "lucide-react";

const features = [
    { icon: <Zap className="h-5 w-5 text-primary" />, text: "Weekly updates" },
    { icon: <HelpCircle className="h-5 w-5 text-primary" />, text: "Customer support" },
    { icon: <Lock className="h-5 w-5 text-primary" />, text: "Secure and privacy" },
    { icon: <CalendarCheck className="h-5 w-5 text-primary" />, text: "99.99% uptime" },
];

export function StayConnected() {
    return (
        <div className="border-t">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <h3 className="text-lg font-semibold">Stay Connected, Stay Private.</h3>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {feature.icon}
                                <span>{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
