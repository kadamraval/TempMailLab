
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
import { Loader2, Info } from "lucide-react"
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
  noAds: "Removes all advertisements from the user interface for a cleaner experience."
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
    }
  }

  const form = useForm<z.infer<typeof dialogFormSchema>>({
    resolver: zodResolver(dialogFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
        if (plan) {
            form.reset(plan);
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
          <DialogDescription>
            {plan ? "Update the details for this subscription plan." : "Fill out the form to create a new subscription plan."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Premium" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price (USD)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="e.g., 9.99" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="cycle" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing Cycle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                {/* Granular Features */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="features.maxInboxes" render={({ field }) => (
                            <FormItem>
                                <FormLabelWithTooltip label="Max Active Inboxes" tooltipText={featureTooltips.maxInboxes} />
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="features.maxEmailsPerInbox" render={({ field }) => (
                            <FormItem>
                               <FormLabelWithTooltip label="Max Emails Per Inbox" tooltipText={featureTooltips.maxEmailsPerInbox} />
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="features.inboxLifetime" render={({ field }) => (
                            <FormItem>
                                <FormLabelWithTooltip label="Inbox Lifetime (minutes)" tooltipText={featureTooltips.inboxLifetime} />
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="features.customDomains" render={({ field }) => (
                            <FormItem>
                                <FormLabelWithTooltip label="Custom Domains" tooltipText={featureTooltips.customDomains} />
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start pt-4">
                        <FormField control={form.control} name="features.allowPremiumDomains" render={({ field }) => (
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center">
                                <FormLabelWithTooltip label="Premium Domains" tooltipText={featureTooltips.allowPremiumDomains}/>
                                <FormControl><Switch id="allowPremiumDomains" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="features.emailForwarding" render={({ field }) => (
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center">
                                <FormLabelWithTooltip label="Forwarding" tooltipText={featureTooltips.emailForwarding}/>
                                <FormControl><Switch id="emailForwarding" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="features.apiAccess" render={({ field }) => (
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center">
                                <FormLabelWithTooltip label="API Access" tooltipText={featureTooltips.apiAccess}/>
                                <FormControl><Switch id="apiAccess" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="features.noAds" render={({ field }) => (
                             <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 h-full justify-center">
                                <FormLabelWithTooltip label="No Ads" tooltipText={featureTooltips.noAds}/>
                                <FormControl><Switch id="noAds" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                </div>

                <Separator />
                
                {/* Status */}
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Plan Status</FormLabel>
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
                    <FormMessage />
                    </FormItem>
                )}
                />
              </div>
            </ScrollArea>

            <DialogFooter className="pt-6">
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

    