import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SubscribeForm() {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stay Updated</h2>
            <p className="mt-4 text-lg text-muted-foreground">Subscribe to our newsletter for the latest on privacy and product updates.</p>
            <div className="mt-8 flex max-w-md mx-auto">
                <Input type="email" placeholder="Enter your email" className="rounded-r-none" />
                <Button type="submit" className="rounded-l-none">Subscribe</Button>
            </div>
        </div>
    );
}
