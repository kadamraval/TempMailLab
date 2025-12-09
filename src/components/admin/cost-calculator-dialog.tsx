"use client";

import { useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface CostCalculatorDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatCurrency = (amount: number, currency: 'USD' | 'INR' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4, 
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

    // Expense States
    const [mail, setMail] = useState({ volume: 50000, cost: 15 });
    const [auth, setAuth] = useState({ volume: 10000, cost: 2.50 });
    const [hosting, setHosting] = useState({ volume: 10, cost: 0.12 });
    const [storage, setStorage] = useState({ volume: 20, cost: 3.60 });
    const [otherCharges, setOtherCharges] = useState<{name: string, cost: number}[]>([]);
    
    // AdSense Revenue States
    const [pageviewsPerUser, setPageviewsPerUser] = useState(30);
    const [adsPerPage, setAdsPerPage] = useState(2);
    const [ctr, setCtr] = useState(2); // Click-Through Rate %
    const [cpc, setCpc] = useState(0.50); // Cost Per Click $

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

    const totalAdRevenue = useMemo(() => {
        const totalImpressions = users * pageviewsPerUser * adsPerPage;
        const totalClicks = totalImpressions * (ctr / 100);
        const totalRevenueUSD = totalClicks * cpc;
        return toCurrentCurrency(totalRevenueUSD);
    }, [users, pageviewsPerUser, adsPerPage, ctr, cpc, currency, exchangeRate]);

    const totalRevenue = totalSubscriptionRevenue + totalAdRevenue;

    const calculatePerUserCost = (totalCost: number) => totalCost / (users || 1);
    
    const mailPerUserCost = calculatePerUserCost(toCurrentCurrency(mail.cost));
    const authPerUserCost = calculatePerUserCost(toCurrentCurrency(auth.cost));
    const hostingPerUserCost = calculatePerUserCost(toCurrentCurrency(hosting.cost));
    const storagePerUserCost = calculatePerUserCost(toCurrentCurrency(storage.cost));
    const otherChargesPerUserCost = otherCharges.reduce((acc, charge) => acc + calculatePerUserCost(toCurrentCurrency(charge.cost)), 0);

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
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Business Cost & Revenue Calculator</DialogTitle>
                    <DialogDescription>
                        Model your operational costs and revenue streams based on a set number of users. All costs are monthly estimates.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {/* --- Global Settings --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Global Settings</CardTitle>
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
                            <CardHeader><CardTitle className="text-lg">Monthly Expenses</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Mail (e.g., inbound.new)" tooltipText="Cost for processing incoming emails." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Volume (# Mails)</Label><Input type="number" placeholder="Volume" value={mail.volume} onChange={e => setMail(p => ({...p, volume: Number(e.target.value)}))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" placeholder="Total Cost" value={mail.cost} onChange={e => setMail(p => ({...p, cost: Number(e.target.value)}))} /></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right pt-1">Est. Cost/User: {formatCurrency(mailPerUserCost, currency)}</p>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firebase Auth" tooltipText="Cost for user authentications. First 10k MAU are free." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Volume (MAUs)</Label><Input type="number" value={auth.volume} onChange={e => setAuth(p => ({...p, volume: Number(e.target.value)}))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" value={auth.cost} onChange={e => setAuth(p => ({...p, cost: Number(e.target.value)}))} /></div>
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right pt-1">Est. Cost/User: {formatCurrency(authPerUserCost, currency)}</p>
                                </div>
                                 <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Cloud Storage" tooltipText="Cost for storing email attachments, etc." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Volume (GB)</Label><Input type="number" value={storage.volume} onChange={e => setStorage(p => ({...p, volume: Number(e.target.value)}))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" value={storage.cost} onChange={e => setStorage(p => ({...p, cost: Number(e.target.value)}))} /></div>
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right pt-1">Est. Cost/User: {formatCurrency(storagePerUserCost, currency)}</p>
                                </div>
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="Other Charges" tooltipText="Add any other miscellaneous monthly costs (e.g., other APIs, software licenses)." />
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
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Monthly Revenue</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="space-y-2 p-3 border rounded-lg">
                                        <FormLabelWithTooltip label="Google AdSense Calculator" tooltipText="Model your ad revenue based on user activity." />
                                        <div className="grid grid-cols-2 gap-2">
                                             <div><Label className="text-xs text-muted-foreground">Pageviews/User</Label><Input type="number" value={pageviewsPerUser} onChange={e => setPageviewsPerUser(Number(e.target.value))} /></div>
                                             <div><Label className="text-xs text-muted-foreground">Ads/Page</Label><Input type="number" value={adsPerPage} onChange={e => setAdsPerPage(Number(e.target.value))} /></div>
                                             <div><Label className="text-xs text-muted-foreground">CTR (%)</Label><Input type="number" value={ctr} onChange={e => setCtr(Number(e.target.value))} /></div>
                                             <div><Label className="text-xs text-muted-foreground">CPC ($)</Label><Input type="number" value={cpc} onChange={e => setCpc(Number(e.target.value))} /></div>
                                        </div>
                                         <p className="text-xs text-muted-foreground text-right pt-1">Est. Revenue/User: {formatCurrency(totalAdRevenue / (users || 1), currency)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabelWithTooltip label="Subscription Revenue (Fetched)" tooltipText="This is automatically calculated from your active, priced subscription plans." />
                                        <Input readOnly value={formatCurrency(totalSubscriptionRevenue, currency)} className="bg-muted" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <Separator />
                    
                    {/* --- Summary --- */}
                     <Card>
                        <CardHeader><CardTitle className="text-lg">Summary (for {users.toLocaleString()} users)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Monthly Expense</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(totalExpensePerUser, currency)} / user</p>
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
