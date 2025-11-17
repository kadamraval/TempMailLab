
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useFirestore } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types"
import type { Plan } from "../packages/data"

interface ManageUserDialogProps {
    user: User | null;
    plans: Plan[];
    isOpen: boolean;
    onClose: () => void;
}

export function ManageUserDialog({ user, plans, isOpen, onClose }: ManageUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const firestore = useFirestore()
  const { toast } = useToast()

  useEffect(() => {
    // When the dialog opens with a user, set the initial selected plan
    if (user) {
      setSelectedPlan(user.planId || "free-default")
    }
  }, [user])

  async function handleSave() {
    if (!firestore || !user) return;
    setIsSubmitting(true)
    try {
      const userRef = doc(firestore, "users", user.uid)
      await updateDoc(userRef, {
        planId: selectedPlan,
      });

      toast({
        title: "Success",
        description: "User plan updated successfully.",
      })
      onClose();
    } catch (error: any) {
      console.error("Error updating user plan:", error)
      toast({
        title: "Error updating plan",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const activePlans = plans.filter(p => p.status === 'active');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Plan</DialogTitle>
          <DialogDescription>
            Assign a new subscription plan to <span className="font-semibold">{user?.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="plan-select">Subscription Plan</Label>
                 <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger id="plan-select">
                        <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="free-default">Free</SelectItem>
                        {activePlans.filter(p => p.id !== 'free-default').map(plan => (
                             <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} onClick={handleSave}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

