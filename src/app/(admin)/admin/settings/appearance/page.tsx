
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppearancePage() {
  return (
     <Card>
        <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of your application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Logo</Label>
                <Input type="file" />
                <p className="text-sm text-muted-foreground">Upload a logo to display in the header.</p>
            </div>
             <div className="space-y-2">
                <Label>Favicon</Label>
                <Input type="file" />
                <p className="text-sm text-muted-foreground">Upload a favicon (.ico, .png, .svg).</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <Input type="color" defaultValue="#4A90E2" className="h-12"/>
                </div>
                <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input type="color" defaultValue="#F7F7F7" className="h-12"/>
                </div>
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-end w-full">
                <Button>Save</Button>
            </div>
        </CardFooter>
    </Card>
  )
}
