
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { planSchema, type Plan } from "./data"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface PlanFormProps {
    plan?: Plan | null;
}

const formSchemaToSubmit = planSchema.omit({ id: true, createdAt: true });

const featureTooltips: Record<string, string> = {
  // Inbox
  maxInboxes: "Max number of active inboxes a user can have at one time.",
  inboxLifetime: "Duration in minutes an inbox exists before being purged. Set to 0 for unlimited lifetime.",
  customPrefix: "Allow users to choose the part before the '@' (e.g., 'my-project' instead of random characters).",
  customDomains: "Number of custom domains a user can connect (e.g., test@qa.mycompany.com).",
  allowPremiumDomains: "Grant access to a pool of shorter, more memorable premium domains.",
  inboxLocking: "Allow users to 'lock' an inbox to prevent it from expiring automatically.",
  
  // Email
  emailForwarding: "Automatically forward incoming temporary emails to a real, verified email address.",
  allowAttachments: "Allow or block incoming emails that contain file attachments.",
  maxAttachmentSize: "The maximum size in megabytes (MB) for a single email attachment.",
  sourceCodeView: "Allow users to view the raw EML source of an email, including headers.",
  linkSanitization: "Scan links for known malicious sites and warn the user before redirection.",
  exportEmails: "Allow users to download single emails (as .eml) or bulk export (as .zip).",

  // Storage
  maxEmailsPerInbox: "Max number of emails to store per inbox. Older emails will be deleted. 0 for unlimited.",
  totalStorageQuota: "Maximum storage in MB for all of a user's inboxes combined. 0 for unlimited.",
  searchableHistory: "Enables server-side full-text search of email history.",
  dataRetentionDays: "The number of days emails are kept, even if the inbox expires (for premium accounts). 0 for forever.",
  
  // Security
  passwordProtection: "Allow users to secure their temporary inboxes with a password.",
  twoFactorAuth: "Enable Two-Factor Authentication (2FA) for securing user accounts.",
  spamFilteringLevel: "The level of spam filtering applied to incoming emails.",
  virusScanning: "Automatically scan all incoming attachments for malware.",
  auditLogs: "For team/business accounts, a log of actions taken by team members.",

  // API
  apiAccess: "Grant access to the developer REST API for programmatic use.",
  apiRateLimit: "Number of API requests a user can make per minute. 0 for unlimited.",
  webhooks: "Allow incoming emails to be forwarded to a user-defined webhook URL for automation.",
  
  // Support
  prioritySupport: "Flags users for priority customer support, ensuring faster response times.",
  dedicatedAccountManager: "Assign a dedicated account manager for high-value enterprise clients.",

  // General
  noAds: "Removes all advertisements from the user interface.",
  browserExtension: "Grant access to the Chrome/Firefox browser extension.",
  teamMembers: "Number of team members a user can invite to share their plan features.",
  customBranding: "For enterprise clients, allow white-labeling of the interface.",
  usageAnalytics: "Grant access to a dashboard for viewing detailed usage statistics.",
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

const FeatureSwitch = ({ name, label, control }: { name: any, label: string, control: any }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <FormLabelWithTooltip label={label} tooltipText={featureTooltips[name.split('.')[1]]} />
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
            </FormItem>
        )}
    />
);

const FeatureInput = ({ name, label, control, ...props }: { name: any, label: string, control: any, [key: string]: any }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabelWithTooltip label={label} tooltipText={featureTooltips[name.split('.')[1]]} />
                <FormControl><Input {...props} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

export function PlanForm({ plan }: PlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const isFreePlan = plan?.id === 'free-default';

  const defaultValues: z.infer<typeof formSchemaToSubmit> = {
    name: "",
    price: 0,
    cycle: "monthly",
    status: "active",
    features: {
        maxInboxes: 1,
        inboxLifetime: 10,
        customPrefix: false,
        customDomains: 0,
        allowPremiumDomains: false,
        inboxLocking: false,
        emailForwarding: false,
        allowAttachments: false,
        maxAttachmentSize: 5,
        sourceCodeView: false,
        linkSanitization: false,
        exportEmails: false,
        maxEmailsPerInbox: 25,
        totalStorageQuota: 0,
        searchableHistory: false,
        dataRetentionDays: 0,
        passwordProtection: false,
        twoFactorAuth: false,
        spamFilteringLevel: "basic",
        virusScanning: false,
        auditLogs: false,
        apiAccess: false,
        apiRateLimit: 0,
        webhooks: false,
        prioritySupport: false,
        dedicatedAccountManager: false,
        noAds: false,
        browserExtension: false,
        teamMembers: 0,
        customBranding: false,
        usageAnalytics: false,
    }
  }

  const form = useForm<z.infer<typeof formSchemaToSubmit>>({
    resolver: zodResolver(formSchemaToSubmit),
    defaultValues,
  })

  useEffect(() => {
    if (plan) {
        const mergedFeatures = { ...defaultValues.features, ...plan.features };
        form.reset({ ...plan, features: mergedFeatures });
    } else {
        form.reset(defaultValues);
    }
  }, [plan, form]);

  async function onSubmit(values: z.infer<typeof formSchemaToSubmit>) {
    if (!firestore) return;
    
    if (isFreePlan && values.name.toLowerCase() !== 'free') {
        toast({ title: "Invalid Operation", description: "The name of the 'Free' plan cannot be changed.", variant: "destructive" });
        return;
    }
    
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
      router.push('/admin/packages');
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
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</CardTitle>
                    <CardDescription>
                        {plan ? "Update the details for this subscription plan." : "Fill out the form to create a new subscription plan."}
                    </CardDescription>
                    {isFreePlan && (
                        <Badge variant="outline" className="flex items-center gap-2 w-fit mt-2">
                            <Lock className="h-3 w-3" />
                            You are editing the non-deletable default Free plan.
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-8 py-4">
                    {/* --- Basic Information --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem className="md:col-span-1">
                                    <FormLabel>Plan Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Premium" {...field} disabled={isFreePlan} /></FormControl>
                                    {isFreePlan && <FormDescription>The 'Free' plan name cannot be changed.</FormDescription>}
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

                    {/* --- Inbox Features --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Inbox Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.maxInboxes" label="Max Active Inboxes" control={form.control} type="number" />
                            <FeatureInput name="features.inboxLifetime" label="Inbox Lifetime (minutes)" control={form.control} type="number" />
                            <FeatureInput name="features.customDomains" label="Custom Domains" control={form.control} type="number" />
                            <FeatureSwitch name="features.customPrefix" label="Customizable Prefix" control={form.control} />
                            <FeatureSwitch name="features.allowPremiumDomains" label="Allow Premium Domains" control={form.control} />
                            <FeatureSwitch name="features.inboxLocking" label="Inbox Locking" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Email Features --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Email Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.maxAttachmentSize" label="Max Attachment Size (MB)" control={form.control} type="number" />
                            <FeatureSwitch name="features.allowAttachments" label="Allow Attachments" control={form.control} />
                            <FeatureSwitch name="features.emailForwarding" label="Email Forwarding" control={form.control} />
                            <FeatureSwitch name="features.exportEmails" label="Export Emails" control={form.control} />
                            <FeatureSwitch name="features.sourceCodeView" label="Source Code View" control={form.control} />
                            <FeatureSwitch name="features.linkSanitization" label="Link Sanitization" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Storage & Data --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Storage & Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.maxEmailsPerInbox" label="Max Emails Per Inbox" control={form.control} type="number" />
                            <FeatureInput name="features.totalStorageQuota" label="Total Storage Quota (MB)" control={form.control} type="number" />
                            <FeatureInput name="features.dataRetentionDays" label="Data Retention (Days)" control={form.control} type="number" />
                            <FeatureSwitch name="features.searchableHistory" label="Searchable History" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Security & Privacy --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Security & Privacy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="features.spamFilteringLevel" render={({ field }) => (
                                <FormItem>
                                     <FormLabelWithTooltip label="Spam Filtering Level" tooltipText={featureTooltips.spamFilteringLevel} />
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="basic">Basic</SelectItem>
                                            <SelectItem value="aggressive">Aggressive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FeatureSwitch name="features.passwordProtection" label="Password Protection" control={form.control} />
                            <FeatureSwitch name="features.twoFactorAuth" label="Two-Factor Auth (Account)" control={form.control} />
                            <FeatureSwitch name="features.virusScanning" label="Virus Scanning" control={form.control} />
                            <FeatureSwitch name="features.auditLogs" label="Audit Logs" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- API & Automation --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">API & Automation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.apiRateLimit" label="API Rate Limit (req/min)" control={form.control} type="number" />
                            <FeatureSwitch name="features.apiAccess" label="API Access" control={form.control} />
                            <FeatureSwitch name="features.webhooks" label="Webhooks" control={form.control} />
                        </div>
                    </div>
                    <Separator />
                    
                    {/* --- Support --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Support</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureSwitch name="features.prioritySupport" label="Priority Support" control={form.control} />
                            <FeatureSwitch name="features.dedicatedAccountManager" label="Dedicated Account Manager" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- General Features --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">General & Team Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.teamMembers" label="Team Members" control={form.control} type="number" />
                            <FeatureSwitch name="features.noAds" label="No Ads" control={form.control} />
                            <FeatureSwitch name="features.usageAnalytics" label="Usage Analytics" control={form.control} />
                            <FeatureSwitch name="features.browserExtension" label="Browser Extension Access" control={form.control} />
                             <FeatureSwitch name="features.customBranding" label="Custom Branding" control={form.control} />
                        </div>
                    </div>
                    <Separator />
                    
                    {/* --- Plan Status --- */}
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
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <div className="flex justify-end gap-2 w-full">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {plan ? 'Save Changes' : 'Create Plan'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </form>
    </Form>
  )
}
