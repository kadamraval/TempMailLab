
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { planSchema, type Plan } from "./data"
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
import { Loader2 } from "lucide-react"
import { useFirestore } from "@/firebase"
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface PlanDialogProps {
    plan: Plan | null;
    isOpen: boolean;
    onClose: () => void;
}

// Omit id and createdAt for form validation, as they are managed by Firestore
const dialogFormSchema = planSchema.omit({ id: true, createdAt: true });

export function PlanDialog({ plan, isOpen, onClose }: PlanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firestore = useFirestore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof dialogFormSchema>>({
    resolver: zodResolver(dialogFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      features: "",
      status: "active",
      cycle: "monthly",
    },
  })

  useEffect(() => {
    if (plan) {
      form.reset(plan);
    } else {
      form.reset({
        name: "",
        price: 0,
        features: "",
        status: "active",
        cycle: "monthly",
      });
    }
  }, [plan, form, isOpen]);

  async function onSubmit(values: z.infer<typeof dialogFormSchema>) {
    if (!firestore) return;
    setIsSubmitting(true)
    
    try {
      if (plan) {
        // Update existing plan
        const docRef = doc(firestore, "plans", plan.id)
        await updateDoc(docRef, values);
        toast({ title: "Success", description: "Plan updated successfully." });
      } else {
        // Add new plan
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
          <DialogDescription>
            {plan ? "Update the details for this plan." : "Fill out the form to create a new subscription plan."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 9.99" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="cycle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a cycle" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List the features, separated by commas." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="active" />
                        </FormControl>
                        <FormLabel className="font-normal">Active</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="archived" />
                        </FormControl>
                        <FormLabel className="font-normal">Archived</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                </Button>
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

// Add imports for Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
