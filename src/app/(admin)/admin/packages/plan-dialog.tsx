
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { planSchema, type Plan } from "./data"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, Info, Lock } from "lucide-react"
import { useFirestore } from "@/firebase"
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface PlanDialogProps {
    plan: Plan | null;
    isOpen: boolean;
    onClose: () => void;
}

const dialogFormSchema = planSchema.omit({ id: true, createdAt: true });

const featureTooltips: Record<string, string> = {
  maxInboxes: "Maximum number of active temporary inboxes a user can have at one time.",
  maxEmailsPerInbox: "Maximum number of emails that will be stored in a single inbox. Older emails will be deleted.",
  inboxLifetime: "The duration in minutes that a temporary inbox will remain active before it is automatically deleted.",
  customDomains: "The number of custom domains a user can connect to receive emails on their own domain.",
  allowPremiumDomains: "Grants access to a pool of shorter, more memorable premium domains for email generation.",
  emailForwarding: "Allows users to automatically forward incoming temporary emails to a real, verified email address.",
  apiAccess: "Grants access to the developer API for programmatic use of the service.",
  noAds: "Removes all advertisements from the user interface for a cleaner experience.",
  passwordProtection: "Allow users to secure their temporary inboxes with a password.",
  allowAttachments: "Allow or block incoming emails that contain file attachments.",
  maxAttachmentSize: "The maximum size in megabytes (MB) for a single email attachment.",
  apiRateLimit: "The number of API requests a user can make per minute.",
  webhooks: "Allow incoming emails to be forwarded to a user-defined webhook URL for automation.",
  teamMembers: "The number of team members a user can invite to share their plan features.",
  prioritySupport: "Flags users for priority customer support, ensuring faster response times.",
  usageAnalytics: "Grants access to a dashboard for viewing detailed usage statistics and analytics.",
  exportEmails: "Allows users to export their emails from their inboxes, for example as a CSV or EML files.",
  searchableHistory: "Enables server-side search of email history. Without this, users may only be able to filter currently loaded emails on the client.",
};


const FormLabelWithTooltip = ({ label, tooltipText }: { label: string; tooltipText: string }) => (
  <div className="flex items-center gap-2">
    <FormLabel>{label}</FormLabel>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);


export function PlanDialog({ plan, isOpen, onClose }: PlanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firestore = useFirestore()
  const { toast } = useToast()
  const isDefaultPlan = plan?.name.toLowerCase() === 'default';

  const defaultValues: z.infer<typeof dialogFormSchema> = {
    name: "",
    price: 0,
    cycle: "monthly",
    status: "active",
    features: {
        maxInboxes: 1,
        maxEmailsPerInbox: 25,
        inboxLifetime: 60,
        customDomains: 0,
        allowPremiumDomains: false,
        emailForwarding: false,
        apiAccess: false,
        noAds: false,
        passwordProtection: false,
        allowAttachments: true,
        maxAttachmentSize: 5,
        apiRateLimit: 0,
        webhooks: false,
        teamMembers: 0,
        prioritySupport: false,
        usageAnalytics: false,
        exportEmails: false,
        searchableHistory: false,
    }
  }

  const form = useForm<z.infer<typeof dialogFormSchema>>({
    resolver: zodResolver(dialogFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
        if (plan) {
            // Merge existing plan data with defaults to ensure all fields are present
            const mergedFeatures = { ...defaultValues.features, ...plan.features };
            form.reset({ ...plan, features: mergedFeatures });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [plan, form, isOpen]);

  async function onSubmit(values: z.infer<typeof dialogFormSchema>) {
    if (!firestore) return;
    setIsSubmitting(true)
    
    try {
      if (plan) {
        const docRef = doc(firestore, "plans", plan.id)
        await updateDoc(docRef, values);
        toast({ title: "Success", description: "Plan updated successfully." });
      } else {
        const collectionRef = collection(firestore, "plans")
        await addDoc(collectionRef, {
          ...values,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Plan added successfully." });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving plan:", error)
      toast({
        title: "Error saving plan",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
          <DialogDescription>
            {plan ? "Update the details for this subscription plan." : "Fill out the form to create a new subscription plan."}
          </DialogDescription>
          {isDefaultPlan && (
            <Badge variant="outline" className="flex items-center gap-2 w-fit mt-2">
                <Lock className="h-3 w-3" />
                You are editing the non-deletable Default plan.
            </Badge>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[70vh] pr-6">
              <div className="space-y-8 py-4">
                
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium tracking-tight">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Premium" {...field} disabled={isDefaultPlan} /></FormControl>
                                {isDefaultPlan && <FormDescription>The 'Default' plan name cannot be changed.</FormDescription>}
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price (USD)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="e.g., 9.99" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="cycle" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing Cycle</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a cycle" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <Separator />

                {/* Core Usage Features */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium tracking-tight">Core Usage Limits</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="features.maxInboxes" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Max Active Inboxes" tooltipText={featureTooltips.maxInboxes} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="features.maxEmailsPerInbox" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Max Emails Per Inbox" tooltipText={featureTooltips.maxEmailsPerInbox} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="features.inboxLifetime" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Inbox Lifetime (minutes)" tooltipText={featureTooltips.inboxLifetime} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>

                <Separator />

                {/* Domains & Interface */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium tracking-tight">Domains & Interface</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <FormField control={form.control} name="features.customDomains" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Custom Domains" tooltipText={featureTooltips.customDomains} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex flex-row gap-4 pt-2">
                             <FormField control={form.control} name="features.allowPremiumDomains" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Premium Domains" tooltipText={featureTooltips.allowPremiumDomains}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="features.noAds" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="No Ads" tooltipText={featureTooltips.noAds}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Security & Attachments */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium tracking-tight">Security & Attachments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                       <FormField control={form.control} name="features.maxAttachmentSize" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Max Attachment Size (MB)" tooltipText={featureTooltips.maxAttachmentSize} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                       <div className="flex flex-row gap-4 pt-2">
                             <FormField control={form.control} name="features.passwordProtection" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Password Protection" tooltipText={featureTooltips.passwordProtection}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="features.allowAttachments" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Allow Attachments" tooltipText={featureTooltips.allowAttachments}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>
                </div>
                
                <Separator />
                
                {/* API & Automation */}
                <div className="space-y-4">
                     <h3 className="text-lg font-medium tracking-tight">API, Forwarding & Automation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <FormField control={form.control} name="features.apiRateLimit" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="API Rate Limit (req/min)" tooltipText={featureTooltips.apiRateLimit} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex flex-row gap-4 pt-2">
                             <FormField control={form.control} name="features.apiAccess" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="API Access" tooltipText={featureTooltips.apiAccess}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="features.emailForwarding" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Email Forwarding" tooltipText={featureTooltips.emailForwarding}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="features.webhooks" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Webhooks" tooltipText={featureTooltips.webhooks}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>
                </div>
                
                <Separator />

                {/* Teams, Support & Analytics */}
                <div className="space-y-4">
                     <h3 className="text-lg font-medium tracking-tight">Teams, Support & Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <FormField control={form.control} name="features.teamMembers" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Team Members" tooltipText={featureTooltips.teamMembers} /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <div className="flex flex-row gap-4 pt-2">
                             <FormField control={form.control} name="features.prioritySupport" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Priority Support" tooltipText={featureTooltips.prioritySupport}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="features.usageAnalytics" render={({ field }) => (
                                <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Usage Analytics" tooltipText={featureTooltips.usageAnalytics}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                 <Separator />

                {/* Data Management */}
                <div className="space-y-4">
                     <h3 className="text-lg font-medium tracking-tight">Data & History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 items-start pt-2">
                         <FormField control={form.control} name="features.exportEmails" render={({ field }) => (
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Export Emails" tooltipText={featureTooltips.exportEmails}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="features.searchableHistory" render={({ field }) => (
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center flex-1"><FormLabelWithTooltip label="Searchable History" tooltipText={featureTooltips.searchableHistory}/><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )} />
                    </div>
                </div>

                <Separator />
                
                {/* Status */}
                 <div>
                    <h3 className="text-lg font-medium tracking-tight">Plan Status</h3>
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="space-y-3 pt-4">
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="active" /></FormControl>
                                    <FormLabel className="font-normal">Active</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="archived" /></FormControl>
                                    <FormLabel className="font-normal">Archived</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormDescription>
                            Archived plans will not be available for new subscriptions but will remain for existing users.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {plan ? 'Save Changes' : 'Create Plan'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
