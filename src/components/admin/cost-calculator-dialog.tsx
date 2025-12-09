
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Info } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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

const FormLabelWithTooltip = ({ label, tooltipText }: { label: string; tooltipText: string }) => (
    <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
            <p className="max-w-xs">{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>
    </div>
);

export function CostCalculatorDialog({ isOpen, onClose }: CostCalculatorDialogProps) {
    const [users, setUsers] = useState(1000);
    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
    const [exchangeRate, setExchangeRate] = useState(83.5);

    // Expenses State with volume and total cost
    const [mail, setMail] = useState({ volume: 50000, price: 15 });
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

    const totalSubscriptionRevenue = useMemo(() => {
        if (!plans) return 0;
        return plans.reduce((acc, plan) => {
             if (plan.status === 'active' && plan.price > 0) {
                 return acc + toCurrentCurrency(plan.price);
             }
             return acc;
        }, 0);
    }, [plans, currency, exchangeRate]);

    const totalRevenue = useMemo(() => totalSubscriptionRevenue + toCurrentCurrency(adsense), [totalSubscriptionRevenue, adsense, currency, exchangeRate]);

    const calculatePerUserCost = (totalCost: number, totalVolume: number, users: number) => {
        if (users === 0 || totalVolume === 0) return 0;
        const itemsPerUser = totalVolume / users;
        const costPerItem = totalCost / totalVolume;
        return itemsPerUser * costPerItem;
    };
    
    const mailPerUserCost = useMemo(() => calculatePerUserCost(mail.price, mail.volume, users), [mail, users]);
    const authPerUserCost = useMemo(() => calculatePerUserCost(auth.price, auth.volume, users), [auth, users]);
    const hostingPerUserCost = useMemo(() => calculatePerUserCost(hosting.price, hosting.volume, users), [hosting, users]);
    const storagePerUserCost = useMemo(() => calculatePerUserCost(storage.price, storage.volume, users), [storage, users]);
    const otherChargesPerUserCost = useMemo(() => otherCharges.reduce((acc, charge) => acc + charge.cost, 0) / (users || 1), [otherCharges, users]);

    const totalExpensePerUser = mailPerUserCost + authPerUserCost + hostingPerUserCost + storagePerUserCost + otherChargesPerUserCost;
    const totalExpenses = totalExpensePerUser * users;

    const netProfit = totalRevenue - totalExpenses;
    const perUserRevenue = users > 0 ? totalRevenue / users : 0;

    const handleAddCharge = () => setOtherCharges([...otherCharges, { name: '', cost: 0 }]);
    const handleRemoveCharge = (index: number) => setOtherCharges(otherCharges.filter((_, i) => i !== index));
    const handleChargeChange = (index: number, field: 'name' | 'cost', value: string | number) => {
        const newCharges = [...otherCharges];
        (newCharges[index] as any)[field] = value;
        setOtherCharges(newCharges);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Business Cost & Revenue Calculator</DialogTitle>
                    <DialogDescription>
                        Model your operational costs and revenue streams based on a set number of users.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {/* --- Global Settings --- */}
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold">Global Settings</h3>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Model Users" tooltipText="The total number of users to base all calculations on." />
                                <Input type="number" value={users} onChange={(e) => setUsers(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Currency" tooltipText="Display all financial data in this currency." />
                                <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                                </Select>
                            </div>
                            {currency === 'INR' && (
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="USD to INR Rate" tooltipText="The exchange rate used for currency conversion." />
                                    <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* --- Expenses --- */}
                        <Card>
                            <CardHeader><h3 className="font-semibold">Monthly Expenses</h3></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Mail (inbound.new)" tooltipText="Cost for processing incoming emails." />
                                    <div className="flex gap-2">
                                        <Input type="number" placeholder="Volume" value={mail.volume} onChange={e => setMail(p => ({...p, volume: Number(e.target.value)}))} />
                                        <Input type="number" placeholder="Total Cost" value={mail.price} onChange={e => setMail(p => ({...p, price: Number(e.target.value)}))} />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">{formatCurrency(toCurrentCurrency(mailPerUserCost), currency)} / user</p>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firebase Auth" tooltipText="Cost for user authentications." />
                                    <div className="flex gap-2">
                                        <Input type="number" placeholder="Volume" value={auth.volume} onChange={e => setAuth(p => ({...p, volume: Number(e.target.value)}))} />
                                        <Input type="number" placeholder="Total Cost" value={auth.price} onChange={e => setAuth(p => ({...p, price: Number(e.target.value)}))} />
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right">{formatCurrency(toCurrentCurrency(authPerUserCost), currency)} / user</p>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firebase Hosting" tooltipText="Cost for hosting the application files." />
                                    <div className="flex gap-2">
                                        <Input type="number" placeholder="Volume (GB)" value={hosting.volume} onChange={e => setHosting(p => ({...p, volume: Number(e.target.value)}))} />
                                        <Input type="number" placeholder="Total Cost" value={hosting.price} onChange={e => setHosting(p => ({...p, price: Number(e.target.value)}))} />
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right">{formatCurrency(toCurrentCurrency(hostingPerUserCost), currency)} / user</p>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firestore Storage" tooltipText="Cost for database storage." />
                                    <div className="flex gap-2">
                                        <Input type="number" placeholder="Volume (GB)" value={storage.volume} onChange={e => setStorage(p => ({...p, volume: Number(e.target.value)}))} />
                                        <Input type="number" placeholder="Total Cost" value={storage.price} onChange={e => setStorage(p => ({...p, price: Number(e.target.value)}))} />
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right">{formatCurrency(toCurrentCurrency(storagePerUserCost), currency)} / user</p>
                                </div>
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="Other Charges" tooltipText="Add any other miscellaneous monthly costs." />
                                    {otherCharges.map((charge, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input placeholder="Charge Name" value={charge.name} onChange={e => handleChargeChange(index, 'name', e.target.value)} />
                                            <Input type="number" placeholder="Cost" value={charge.cost} onChange={e => handleChargeChange(index, 'cost', Number(e.target.value))} />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCharge(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={handleAddCharge}><PlusCircle className="h-4 w-4 mr-2" />Add Charge</Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* --- Revenue --- */}
                        <Card>
                            <CardHeader><h3 className="font-semibold">Monthly Revenue</h3></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="Google AdSense Income" tooltipText="Estimated total monthly income from ads." />
                                    <Input type="number" value={adsense} onChange={(e) => setAdsense(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="Subscription Revenue (Fetched)" tooltipText="This is automatically calculated from your active subscription plans." />
                                    <Input readOnly value={formatCurrency(totalSubscriptionRevenue, currency)} className="bg-muted" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Separator />
                    
                    {/* --- Summary --- */}
                     <Card>
                        <CardHeader><h3 className="font-semibold">Summary (for {users.toLocaleString()} users)</h3></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Monthly Expense</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalExpensePerUser), currency)} / user</p>
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
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
