
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminMarketingPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
          <CardDescription>
            Create and send targeted email campaigns to your users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input id="campaign-name" placeholder="e.g., 'Summer Promotion'" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Your catchy email subject" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Select>
                <SelectTrigger id="audience">
                  <SelectValue placeholder="Select audience..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                  <SelectItem value="premium">Premium Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-content">Email Content</Label>
              <Textarea id="email-content" placeholder="Compose your email here..." className="min-h-48"/>
            </div>
             <div className="flex justify-end gap-2">
                <Button variant="outline">Save as Draft</Button>
                <Button>Send Campaign</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
