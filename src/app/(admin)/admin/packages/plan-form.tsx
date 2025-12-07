
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
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { savePlanAction } from "@/lib/actions/plans"
import { cn } from "@/lib/utils"

interface PlanFormProps {
    plan?: Plan | null;
}

const formSchemaToSubmit = planSchema.omit({ id: true, createdAt: true });

const featureTooltips: Record<string, string> = {
  // General
  teamMembers: "Number of team members a user can invite to share their plan features.",
  noAds: "Removes all advertisements from the user interface.",
  usageAnalytics: "Grant access to a dashboard for viewing detailed usage statistics.",
  browserExtension: "Grant access to the Chrome/Firefox browser extension.",
  customBranding: "For enterprise clients, allow white-labeling of the interface.",
  prioritySupport: "Flags users for priority customer support, ensuring faster response times.",
  dedicatedAccountManager: "Assign a dedicated account manager for high-value enterprise clients.",

  // Inbox
  maxInboxes: "Max number of active inboxes a user can have at one time.",
  dailyInboxLimit: "Maximum number of new inboxes a user can create per day. Set to 0 for unlimited.",
  inboxLifetime: "Duration an inbox address remains active before it stops receiving new mail.",
  extendTime: "Allow users to manually extend the lifetime of their active inbox.",
  customPrefix: "Allow users to choose the part before the '@' (e.g., 'my-project' instead of random characters).",
  inboxLocking: "Allow users to 'lock' an inbox to prevent it from expiring automatically.",
  qrCode: "Allow users to generate a QR code for their inbox address.",
  
  // Email
  dailyEmailLimit: "Maximum number of emails a user can receive across all inboxes per day. Set to 0 for unlimited.",
  maxEmailsPerInbox: "Max number of emails to store per inbox. Older emails will be deleted. Set to 0 for unlimited.",
  allowAttachments: "Allow or block incoming emails that contain file attachments.",
  maxAttachmentSize: "The maximum size in megabytes (MB) for a single email attachment.",
  emailForwarding: "Automatically forward incoming temporary emails to a real, verified email address.",
  exportEmails: "Allow users to download single emails (as .eml) or bulk export (as .zip).",
  sourceCodeView: "Allow users to view the raw EML source of an email, including headers.",

  // Custom Domain
  customDomains: "Enable custom domain features for this plan.",
  totalCustomDomains: "Total number of unique custom domains a user can add.",
  dailyCustomDomainInboxLimit: "The number of inboxes that can be created per day using custom domains.",
  totalCustomDomainInboxLimit: "The total number of active inboxes that can exist at one time using custom domains.",
  allowPremiumDomains: "Grant access to a pool of shorter, more memorable premium domains.",

  // Storage
  totalStorageQuota: "Maximum storage in MB for all of a user's inboxes combined. 0 for unlimited.",
  
  // Security
  passwordProtection: "Allow users to secure their temporary inboxes with a password.",
  twoFactorAuth: "Enable Two-Factor Authentication (2FA) for securing user accounts.",
  spamFilteringLevel: "The level of spam filtering applied to incoming emails.",
  virusScanning: "Automatically scan all incoming attachments for malware.",
  auditLogs: "For team/business accounts, a log of actions taken by team members.",
  linkSanitization: "Scan links for known malicious sites and warn the user before redirection.",
  spam: "Allow users to mark emails as spam.",
  block: "Allow users to block specific senders or domains.",
  filter: "Enable filtering rules for incoming mail.",

  // API
  apiAccess: "Grant access to the developer REST API for programmatic use.",
  apiRateLimit: "Number of API requests a user can make per minute. Set to 0 for unlimited.",
  webhooks: "Allow incoming emails to be forwarded to a user-defined webhook URL for automation.",
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
                    <FormLabelWithTooltip label={label} tooltipText={featureTooltips[name.split('.').pop()!]} />
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
                <FormLabelWithTooltip label={label} tooltipText={featureTooltips[name.split('.').pop()!]} />
                <FormControl><Input {...props} {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

const TimeDurationInput = ({ name, label, control }: { name: any; label: string; control: any }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabelWithTooltip label={label} tooltipText={featureTooltips[name.split('.').pop()!]} />
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        placeholder="Count"
                        value={field.value.count}
                        onChange={(e) => field.onChange({ ...field.value, count: parseInt(e.target.value, 10) || 0 })}
                    />
                    <Select value={field.value.unit} onValueChange={(unit) => field.onChange({ ...field.value, unit })}>
                        <FormControl>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <FormMessage />
            </FormItem>
        )}
    />
);


export function PlanForm({ plan }: PlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const isDefaultPlan = plan?.id === 'free-default';

  const defaultValues: z.infer<typeof formSchemaToSubmit> = {
    name: "Default",
    planType: 'guest',
    billing: 'lifetime_free',
    price: 0,
    status: "active",
    features: {
        teamMembers: 0, noAds: false, usageAnalytics: false, browserExtension: false,
        customBranding: false, prioritySupport: false, dedicatedAccountManager: false,
        maxInboxes: 1, dailyInboxLimit: 0, inboxLifetime: { count: 10, unit: 'minutes' }, extendTime: false,
        customPrefix: false, inboxLocking: false, qrCode: false,
        dailyEmailLimit: 0, maxEmailsPerInbox: 25, allowAttachments: false,
        maxAttachmentSize: 5, emailForwarding: false, exportEmails: false, sourceCodeView: false,
        customDomains: false, totalCustomDomains: 0, dailyCustomDomainInboxLimit: 0, totalCustomDomainInboxLimit: 0, allowPremiumDomains: false, 
        totalStorageQuota: 0, passwordProtection: false,
        twoFactorAuth: false, spamFilteringLevel: "basic", virusScanning: false, auditLogs: false, 
        linkSanitization: false, spam: false, block: false, filter: false,
        apiAccess: false, apiRateLimit: 0, webhooks: false,
    }
  }

  const form = useForm<z.infer<typeof formSchemaToSubmit>>({
    resolver: zodResolver(formSchemaToSubmit),
    defaultValues,
  })

  const planType = form.watch('planType');
  const enableCustomDomains = form.watch('features.customDomains');

  useEffect(() => {
    if (plan) {
        const mergedFeatures = { ...defaultValues.features, ...plan.features };
        form.reset({ ...plan, features: mergedFeatures });
    } else {
        form.reset(defaultValues);
    }
  }, [plan, form]);

  useEffect(() => {
    if (planType === 'guest' || planType === 'freemium') {
      form.setValue('billing', 'lifetime_free');
    } else if (planType === 'pro' && form.getValues('billing') === 'lifetime_free') {
      form.setValue('billing', 'monthly');
    }
  }, [planType, form]);
  
  useEffect(() => {
    const currentBilling = form.getValues('billing');
    if (currentBilling === 'lifetime_free') {
      form.setValue('price', 0);
    }
  }, [form.watch('billing'), form]);


  async function onSubmit(values: z.infer<typeof formSchemaToSubmit>) {
    setIsSubmitting(true)
    
    try {
      const result = await savePlanAction(values, plan?.id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({ title: "Success", description: `Plan ${plan ? 'updated' : 'added'} successfully.` });
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
                    <CardTitle>{plan ? `Edit: ${plan.name}` : 'Add New Plan'}</CardTitle>
                    <CardDescription>
                        {plan ? "Update the details for this subscription plan." : "Fill out the form to create a new subscription plan."}
                    </CardDescription>
                     {isDefaultPlan && (
                        <Badge variant="outline" className="flex items-center gap-2 w-fit mt-2">
                            <Lock className="h-3 w-3" />
                            You are editing the non-deletable default Guest plan.
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-8 py-4">
                    {/* --- Basic Information --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Basic Information</h3>
                         <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Premium" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="planType" render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Plan Type</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col md:flex-row gap-4" disabled={isDefaultPlan}>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="guest" /></FormControl><FormLabel className="font-normal">Guest (Anonymous Users)</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="freemium" /></FormControl><FormLabel className="font-normal">Freemium (Registered Users)</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="pro" /></FormControl><FormLabel className="font-normal">Pro (Paid Users)</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl>
                            {isDefaultPlan && <FormDescription>The Default plan must be a Guest plan.</FormDescription>}
                            </FormItem>
                        )} />
                        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 pt-2")}>
                          <FormField control={form.control} name="billing" render={({ field }) => (
                              <FormItem className="space-y-3">
                              <FormLabel>Billing</FormLabel>
                              <FormControl>
                                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={planType !== 'pro'}>
                                      <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="monthly" /></FormControl><FormLabel className="font-normal">Monthly</FormLabel></FormItem>
                                      <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yearly" /></FormControl><FormLabel className="font-normal">Yearly</FormLabel></FormItem>
                                      <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="lifetime_free" /></FormControl><FormLabel className="font-normal">Lifetime Free</FormLabel></FormItem>
                                  </RadioGroup>
                              </FormControl>
                              </FormItem>
                          )} />
                          <FormField control={form.control} name="price" render={({ field }) => (
                              <FormItem className={cn(form.getValues('billing') === 'lifetime_free' && 'hidden')}>
                                  <FormLabel>Price (USD)</FormLabel>
                                  <FormControl><Input type="number" step="0.01" placeholder="e.g., 9.99" {...field} /></FormControl>
                                  <FormMessage />
                              </FormItem>
                          )} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- General --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FeatureInput name="features.teamMembers" label="Team Members" control={form.control} type="number" />
                          <FeatureSwitch name="features.noAds" label="No Ads" control={form.control} />
                          <FeatureSwitch name="features.usageAnalytics" label="Usage Analytics" control={form.control} />
                          <FeatureSwitch name="features.browserExtension" label="Browser Extension" control={form.control} />
                          <FeatureSwitch name="features.customBranding" label="Custom Branding" control={form.control} />
                          <FeatureSwitch name="features.prioritySupport" label="Priority Support" control={form.control} />
                          <FeatureSwitch name="features.dedicatedAccountManager" label="Dedicated Account Manager" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Inbox Features --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Inbox Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.maxInboxes" label="Total Inboxes" control={form.control} type="number" />
                            <FeatureInput name="features.dailyInboxLimit" label="Per Day New Inboxes" control={form.control} type="number" />
                            <TimeDurationInput name="features.inboxLifetime" label="Inbox Expire" control={form.control} />
                            <FeatureSwitch name="features.extendTime" label="Allow Time Extension" control={form.control} />
                            <FeatureSwitch name="features.customPrefix" label="Customizable Inbox" control={form.control} />
                            <FeatureSwitch name="features.inboxLocking" label="Inbox Locking" control={form.control} />
                            <FeatureSwitch name="features.qrCode" label="QR Code" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Email Features --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Email Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.maxEmailsPerInbox" label="Total Emails Per Inbox" control={form.control} type="number" />
                            <FeatureInput name="features.dailyEmailLimit" label="Daily Emails Received" control={form.control} type="number" />
                            <FeatureInput name="features.maxAttachmentSize" label="Max Attachment Size (MB)" control={form.control} type="number" />
                            <FeatureSwitch name="features.allowAttachments" label="Allow Attachments" control={form.control} />
                            <FeatureSwitch name="features.emailForwarding" label="Email Forwarding" control={form.control} />
                            <FeatureSwitch name="features.exportEmails" label="Export Emails" control={form.control} />
                            <FeatureSwitch name="features.sourceCodeView" label="Source Code View" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Custom Domain --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Custom Domain</h3>
                        <div className="space-y-4">
                            <FeatureSwitch name="features.customDomains" label="Allow Custom Domains" control={form.control} />
                             {enableCustomDomains && (
                                <div className="p-4 border rounded-md space-y-4 ml-4">
                                     <FeatureInput name="features.totalCustomDomains" label="Total Custom Domains" control={form.control} type="number" />
                                     <FeatureInput name="features.dailyCustomDomainInboxLimit" label="Daily Custom Domain Inboxes" control={form.control} type="number" />
                                     <FeatureInput name="features.totalCustomDomainInboxLimit" label="Total Custom Domain Inboxes" control={form.control} type="number" />
                                </div>
                            )}
                            <FeatureSwitch name="features.allowPremiumDomains" label="Allow Premium Domains" control={form.control} />
                        </div>
                    </div>
                    <Separator />

                    {/* --- Storage --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">Storage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureInput name="features.totalStorageQuota" label="Cloud Storage (MB)" control={form.control} type="number" />
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
                            <FeatureSwitch name="features.linkSanitization" label="Link Sanitization" control={form.control} />
                            <FeatureSwitch name="features.auditLogs" label="Audit Logs" control={form.control} />
                            <FeatureSwitch name="features.spam" label="Spam Reporting" control={form.control} />
                            <FeatureSwitch name="features.block" label="Block Senders" control={form.control} />
                            <FeatureSwitch name="features.filter" label="Mail Filtering" control={form.control} />
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
