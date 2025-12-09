
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Loader2, IndianRupee, DollarSign } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CostCalculatorDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatCurrency = (amount: number, currency: 'USD' | 'INR' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


export function CostCalculatorDialog({ isOpen, onClose }: CostCalculatorDialogProps) {
    const [users, setUsers] = useState(1000);
    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
    const [exchangeRate, setExchangeRate] = useState(83.5);
    const { toast } = useToast();

    // Expenses
    const [mail, setMail] = useState({ volume: 10000, price: 5 });
    const [auth, setAuth] = useState({ volume: 1000, price: 2.5 });
    const [hosting, setHosting] = useState({ volume: 50, price: 2 });
    const [storage, setStorage] = useState({ volume: 20, price: 4 });
    const [otherCharges, setOtherCharges] = useState<{name: string, cost: number}[]>([]);

    // Revenue
    const [adsense, setAdsense] = useState(500);
    
    const firestore = useFirestore();
    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);
    const { data: plans } = useCollection<Plan>(plansQuery);
    
    const toCurrentCurrency = (usdValue: number) => currency === 'INR' ? usdValue * exchangeRate : usdValue;
    
    const totalExpenses = useMemo(() => {
        const mailCost = toCurrentCurrency(mail.price);
        const authCost = toCurrentCurrency(auth.price);
        const hostingCost = toCurrentCurrency(hosting.price);
        const storageCost = toCurrentCurrency(storage.price);
        const others = otherCharges.reduce((acc, charge) => acc + toCurrentCurrency(charge.cost), 0);
        return mailCost + authCost + hostingCost + storageCost + others;
    }, [mail, auth, hosting, storage, otherCharges, currency, exchangeRate]);

    const totalSubscriptionRevenue = useMemo(() => {
        // This is a simplified calculation. A real one would need user distribution per plan.
        // We'll just sum up the potential revenue as a rough estimate.
        if (!plans) return 0;
        const total = plans.reduce((acc, plan) => {
             if (plan.status === 'active' && plan.price > 0) {
                 return acc + toCurrentCurrency(plan.price);
             }
             return acc;
        }, 0);
        return total;
    }, [plans, currency, exchangeRate]);

    const totalRevenue = useMemo(() => {
        // This is a rough estimate and doesn't factor in user distribution across plans.
        return totalSubscriptionRevenue + toCurrentCurrency(adsense);
    }, [totalSubscriptionRevenue, adsense, currency, exchangeRate]);

    const handleAddCharge = () => {
        setOtherCharges([...otherCharges, { name: '', cost: 0 }]);
    };
    
    const handleRemoveCharge = (index: number) => {
        setOtherCharges(otherCharges.filter((_, i) => i !== index));
    };

    const handleChargeChange = (index: number, field: 'name' | 'cost', value: string | number) => {
        const newCharges = [...otherCharges];
        (newCharges[index] as any)[field] = value;
        setOtherCharges(newCharges);
    };

    const netProfit = totalRevenue - totalExpenses;
    const perUserCost = users > 0 ? totalExpenses / users : 0;
    const perUserRevenue = users > 0 ? totalRevenue / users : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Business Cost & Revenue Calculator</DialogTitle>
                    <DialogDescription>
                        Model your operational costs and revenue streams. All prices are monthly estimates.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {/* --- Global Settings --- */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Model Users</Label>
                            <Input type="number" value={users} onChange={(e) => setUsers(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                             <Label>Currency</Label>
                            <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="INR">INR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         {currency === 'INR' && (
                            <div className="space-y-2">
                                <Label>USD to INR Rate</Label>
                                <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} />
                            </div>
                        )}
                    </div>
                    <Separator />

                    {/* --- Expenses --- */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Expenses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2 p-3 border rounded-lg">
                                <Label>Mail (inbound.new)</Label>
                                <div className="flex gap-2">
                                     <Input type="number" placeholder="Volume" value={mail.volume} onChange={e => setMail(p => ({...p, volume: Number(e.target.value)}))} />
                                     <Input type="number" placeholder="Price" value={mail.price} onChange={e => setMail(p => ({...p, price: Number(e.target.value)}))} />
                                </div>
                           </div>
                           <div className="space-y-2 p-3 border rounded-lg">
                                <Label>Firebase Auth</Label>
                                <div className="flex gap-2">
                                     <Input type="number" placeholder="Volume" value={auth.volume} onChange={e => setAuth(p => ({...p, volume: Number(e.target.value)}))} />
                                     <Input type="number" placeholder="Price" value={auth.price} onChange={e => setAuth(p => ({...p, price: Number(e.target.value)}))} />
                                </div>
                           </div>
                           <div className="space-y-2 p-3 border rounded-lg">
                                <Label>Firebase Hosting</Label>
                                <div className="flex gap-2">
                                     <Input type="number" placeholder="Volume (GB)" value={hosting.volume} onChange={e => setHosting(p => ({...p, volume: Number(e.target.value)}))} />
                                     <Input type="number" placeholder="Price" value={hosting.price} onChange={e => setHosting(p => ({...p, price: Number(e.target.value)}))} />
                                </div>
                           </div>
                           <div className="space-y-2 p-3 border rounded-lg">
                                <Label>Firestore Storage</Label>
                                <div className="flex gap-2">
                                     <Input type="number" placeholder="Volume (GB)" value={storage.volume} onChange={e => setStorage(p => ({...p, volume: Number(e.target.value)}))} />
                                     <Input type="number" placeholder="Price" value={storage.price} onChange={e => setStorage(p => ({...p, price: Number(e.target.value)}))} />
                                </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Other Charges</Label>
                            {otherCharges.map((charge, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input placeholder="Charge Name" value={charge.name} onChange={e => handleChargeChange(index, 'name', e.target.value)} />
                                    <Input type="number" placeholder="Cost" value={charge.cost} onChange={e => handleChargeChange(index, 'cost', Number(e.target.value))} />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCharge(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                             <Button variant="outline" size="sm" onClick={handleAddCharge}><PlusCircle className="h-4 w-4 mr-2" />Add Other Charge</Button>
                        </div>
                    </div>
                     <Separator />
                     
                    {/* --- Revenue --- */}
                     <div className="space-y-4">
                        <h3 className="font-semibold">Revenue</h3>
                         <div className="space-y-2">
                            <Label>Google AdSense Income</Label>
                            <Input type="number" value={adsense} onChange={(e) => setAdsense(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label>Subscription Revenue (Estimated)</Label>
                            <Input readOnly value={formatCurrency(totalSubscriptionRevenue, currency)} className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Estimate based on summing active plan prices. Does not account for user distribution.</p>
                        </div>
                    </div>
                    <Separator />
                    
                    {/* --- Summary --- */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Summary (for {users.toLocaleString()} users)</h3>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-lg border bg-card">
                                <p className="text-sm text-muted-foreground">Total Monthly Expense</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(perUserCost, currency)} / user</p>
                             </div>
                             <div className="p-4 rounded-lg border bg-card">
                                <p className="text-sm text-muted-foreground">Total Monthly Revenue</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(perUserRevenue, currency)} / user</p>
                             </div>
                        </div>
                        <div className={cn("p-4 rounded-lg border text-center", netProfit >= 0 ? "bg-emerald-100/50 dark:bg-emerald-900/30" : "bg-red-100/50 dark:bg-red-900/30")}>
                             <p className="text-sm text-muted-foreground">Est. Net Monthly Profit / (Loss)</p>
                             <p className={cn("text-3xl font-bold", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{formatCurrency(netProfit, currency)}</p>
                        </div>
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
