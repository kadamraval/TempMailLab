
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
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

const initialCalculatorState = {
    users: 1000,
    currency: 'USD' as 'USD' | 'INR',
    exchangeRate: 90.01,
    profitMargin: 50,
    expenses: {
        mail: { volume: 50000, cost: 15, userVolume: 50 },
        auth: { freeTier: 10000, paidCost: 0.0055, userVolume: 1 },
        storage: { freeTier: 1, paidCost: 0.02, userVolume: 0.005 },
        hosting: { freeTier: 1, paidCost: 0.12, userVolume: 0.01 },
        otherCharges: [] as {name: string, cost: number}[],
    },
    revenue: {
        pageviewsPerUser: 30,
        tier1: { percent: 10, rpm: 15 },
        tier2: { percent: 40, rpm: 5 },
        tier3: { percent: 50, rpm: 0.70 },
    }
};

type CalculatorState = typeof initialCalculatorState;

const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item);

const mergeDeep = (target: any, ...sources: any[]): any => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else if (source[key] !== undefined) {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return mergeDeep(target, ...sources);
};


export function CostCalculatorDialog({ isOpen, onClose }: CostCalculatorDialogProps) {
    const [state, setState] = useState<CalculatorState>(initialCalculatorState);
    const [isSaving, setIsSaving] = useState(false);
    
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'cost_calculator_settings') : null, [firestore]);
    const { data: savedSettings, isLoading: isLoadingSettings } = useDoc(settingsRef);
    
    useEffect(() => {
        if (savedSettings) {
            setState(prev => mergeDeep({ ...initialCalculatorState }, prev, savedSettings));
        }
    }, [savedSettings]);

    const handleStateChange = (path: string, value: any) => {
        setState(prev => {
            const keys = path.split('.');
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const handleSave = async () => {
        if (!settingsRef) return;
        setIsSaving(true);
        try {
            await setDoc(settingsRef, state, { merge: true });
            toast({ title: "Configuration Saved", description: "Your calculator settings have been saved."});
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setIsSaving(false);
    };

    const toCurrentCurrency = (usdValue: number) => state.currency === 'INR' ? usdValue * state.exchangeRate : usdValue;

    // --- PER-USER COST CALCULATIONS ---
    const mailCostPerUser = useMemo(() => {
        const costPerUnit = (state.expenses.mail.cost || 0) / (state.expenses.mail.volume || 1);
        return costPerUnit * (state.expenses.mail.userVolume || 0);
    }, [state.expenses.mail]);

    const authCostPerUser = useMemo(() => {
        const totalUsage = state.users * state.expenses.auth.userVolume;
        if (totalUsage <= state.expenses.auth.freeTier) return 0;
        const chargeableUsage = totalUsage - state.expenses.auth.freeTier;
        const totalCost = chargeableUsage * state.expenses.auth.paidCost;
        return totalCost / state.users;
    }, [state.users, state.expenses.auth]);

    const storageCostPerUser = useMemo(() => {
        const totalUsage = state.users * state.expenses.storage.userVolume;
        if (totalUsage <= state.expenses.storage.freeTier) return 0;
        const chargeableUsage = totalUsage - state.expenses.storage.freeTier;
        const totalCost = chargeableUsage * state.expenses.storage.paidCost;
        return totalCost / state.users;
    }, [state.users, state.expenses.storage]);

    const hostingCostPerUser = useMemo(() => {
        const totalUsage = state.users * state.expenses.hosting.userVolume;
        if (totalUsage <= state.expenses.hosting.freeTier) return 0;
        const chargeableUsage = totalUsage - state.expenses.hosting.freeTier;
        const totalCost = chargeableUsage * state.expenses.hosting.paidCost;
        return totalCost / state.users;
    }, [state.users, state.expenses.hosting]);

    const otherChargesPerUser = useMemo(() => {
        const totalOtherCharges = state.expenses.otherCharges.reduce((acc, charge) => acc + charge.cost, 0);
        return totalOtherCharges / (state.users || 1);
    }, [state.expenses.otherCharges, state.users]);

    const totalCostPerUser = mailCostPerUser + authCostPerUser + storageCostPerUser + hostingCostPerUser + otherChargesPerUser;
    
    // --- REVENUE CALCULATIONS ---
    const totalAdRevenuePerUser = useMemo(() => {
        const pageviewsPerUser = state.revenue.pageviewsPerUser || 0;
        const rpmT1 = (state.revenue.tier1.percent / 100) * (pageviewsPerUser / 1000) * state.revenue.tier1.rpm;
        const rpmT2 = (state.revenue.tier2.percent / 100) * (pageviewsPerUser / 1000) * state.revenue.tier2.rpm;
        const rpmT3 = (state.revenue.tier3.percent / 100) * (pageviewsPerUser / 1000) * state.revenue.tier3.rpm;
        return rpmT1 + rpmT2 + rpmT3;
    }, [state.revenue]);

    // --- PRICING SUGGESTION ---
    const breakEvenPricePerUser = totalCostPerUser + totalAdRevenuePerUser;
    const suggestedPrice = breakEvenPricePerUser * (1 + (state.profitMargin / 100));

    const totalMonthlyExpense = totalCostPerUser * state.users;
    const totalMonthlyAdRevenue = totalAdRevenuePerUser * state.users;
    
    const handleAddCharge = () => handleStateChange('expenses.otherCharges', [...state.expenses.otherCharges, { name: '', cost: 0 }]);
    const handleRemoveCharge = (index: number) => handleStateChange('expenses.otherCharges', state.expenses.otherCharges.filter((_, i) => i !== index));
    const handleChargeChange = (index: number, field: 'name' | 'cost', value: string | number) => {
        const newCharges = [...state.expenses.otherCharges];
        (newCharges[index] as any)[field] = value;
        handleStateChange('expenses.otherCharges', newCharges);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Business Cost & Revenue Calculator</DialogTitle>
                    <DialogDescription>
                        Model your operational costs and revenue streams to determine a data-driven price for your premium plan.
                    </DialogDescription>
                </DialogHeader>
                {isLoadingSettings ? <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Global Settings</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Model Users" tooltipText="The total number of monthly active users to base all calculations on." />
                                <Input type="number" value={state.users} onChange={(e) => handleStateChange('users', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Display Currency" tooltipText="Display all financial data in this currency." />
                                <Select value={state.currency} onValueChange={(val) => handleStateChange('currency', val as 'USD' | 'INR')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                                </Select>
                            </div>
                            {state.currency === 'INR' && (
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="USD to INR Rate" tooltipText="The exchange rate used for currency conversion." />
                                    <Input type="number" value={state.exchangeRate} onChange={e => handleStateChange('exchangeRate', Number(e.target.value))} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Monthly Expenses</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Mail Service (e.g., Mailgun)" tooltipText="Cost for processing incoming emails. Enter your total monthly volume and total bill from the provider." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume</Label><Input type="number" value={state.expenses.mail.volume} onChange={e => handleStateChange('expenses.mail.volume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" step="0.1" value={state.expenses.mail.cost} onChange={e => handleStateChange('expenses.mail.cost', Number(e.target.value))} /></div>
                                    </div>
                                     <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div><Label className="text-xs text-muted-foreground">Est. Volume/User</Label><Input type="number" value={state.expenses.mail.userVolume} onChange={e => handleStateChange('expenses.mail.userVolume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Est. Cost/User</Label><Input readOnly value={formatCurrency(toCurrentCurrency(mailCostPerUser), state.currency)} /></div>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firebase Auth (MAU)" tooltipText="Cost for monthly active users beyond the free tier." />
                                    <div className="grid grid-cols-4 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Free Tier</Label><Input type="number" value={state.expenses.auth.freeTier} onChange={e => handleStateChange('expenses.auth.freeTier', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Paid Cost/User ($)</Label><Input type="number" step="0.0001" value={state.expenses.auth.paidCost} onChange={e => handleStateChange('expenses.auth.paidCost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Usage/User</Label><Input type="number" readOnly value={state.expenses.auth.userVolume} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Est. Cost/User</Label><Input readOnly value={formatCurrency(toCurrentCurrency(authCostPerUser), state.currency)} /></div>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Cloud Hosting (GB)" tooltipText="Cost for data transfer (egress) beyond the free tier." />
                                     <div className="grid grid-cols-4 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Free Tier (GB)</Label><Input type="number" value={state.expenses.hosting.freeTier} onChange={e => handleStateChange('expenses.hosting.freeTier', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Paid Cost/GB ($)</Label><Input type="number" step="0.01" value={state.expenses.hosting.paidCost} onChange={e => handleStateChange('expenses.hosting.paidCost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Usage/User (GB)</Label><Input type="number" step="0.01" value={state.expenses.hosting.userVolume} onChange={e => handleStateChange('expenses.hosting.userVolume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Est. Cost/User</Label><Input readOnly value={formatCurrency(toCurrentCurrency(hostingCostPerUser), state.currency)} /></div>
                                    </div>
                                </div>
                                 <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Cloud Storage (GB)" tooltipText="Cost for storing files (attachments) beyond the free tier." />
                                    <div className="grid grid-cols-4 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Free Tier (GB)</Label><Input type="number" value={state.expenses.storage.freeTier} onChange={e => handleStateChange('expenses.storage.freeTier', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Paid Cost/GB ($)</Label><Input type="number" step="0.01" value={state.expenses.storage.paidCost} onChange={e => handleStateChange('expenses.storage.paidCost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Usage/User (GB)</Label><Input type="number" step="0.001" value={state.expenses.storage.userVolume} onChange={e => handleStateChange('expenses.storage.userVolume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Est. Cost/User</Label><Input readOnly value={formatCurrency(toCurrentCurrency(storageCostPerUser), state.currency)} /></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="Other Charges ($)" tooltipText="Add any other miscellaneous monthly costs (e.g., other APIs, software licenses)." />
                                    {state.expenses.otherCharges.map((charge, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input placeholder="Charge Name" value={charge.name} onChange={e => handleChargeChange(index, 'name', e.target.value)} />
                                            <Input type="number" placeholder="Cost ($)" value={charge.cost} onChange={e => handleChargeChange(index, 'cost', Number(e.target.value))} />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCharge(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={handleAddCharge}><PlusCircle className="h-4 w-4 mr-2" />Add Charge</Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Monthly AdSense Revenue</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="space-y-4 p-3 border rounded-lg">
                                        <FormLabelWithTooltip label="Ad Revenue Calculator" tooltipText="Model your ad revenue based on user activity and traffic geography. RPM is Revenue Per 1,000 Pageviews." />
                                        <div className="grid grid-cols-1 gap-4">
                                            <div><Label className="text-xs text-muted-foreground">Pageviews/User/Month</Label><Input type="number" value={state.revenue.pageviewsPerUser} onChange={e => handleStateChange('revenue.pageviewsPerUser', Number(e.target.value))} /></div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Traffic Distribution & RPM</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                 <div><Label className="text-xs text-muted-foreground">Tier 1 (e.g. USA) Traffic (%)</Label><Input type="number" value={state.revenue.tier1.percent} onChange={e => handleStateChange('revenue.tier1.percent', Number(e.target.value))} /></div>
                                                 <div><Label className="text-xs text-muted-foreground">Tier 1 RPM ($)</Label><Input type="number" value={state.revenue.tier1.rpm} onChange={e => handleStateChange('revenue.tier1.rpm', Number(e.target.value))} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">Tier 2 (e.g. Europe) Traffic (%)</Label><Input type="number" value={state.revenue.tier2.percent} onChange={e => handleStateChange('revenue.tier2.percent', Number(e.target.value))} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Tier 2 RPM ($)</Label><Input type="number" value={state.revenue.tier2.rpm} onChange={e => handleStateChange('revenue.tier2.rpm', Number(e.target.value))} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">Tier 3 (e.g. India) Traffic (%)</Label><Input type="number" value={state.revenue.tier3.percent} onChange={e => handleStateChange('revenue.tier3.percent', Number(e.target.value))} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Tier 3 RPM ($)</Label><Input type="number" step="0.01" value={state.revenue.tier3.rpm} onChange={e => handleStateChange('revenue.tier3.rpm', Number(e.target.value))} /></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <Separator />
                    
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Summary & Pricing Suggestion (for {state.users.toLocaleString()} users)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Monthly Expense</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalMonthlyExpense), state.currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalCostPerUser), state.currency)} / user</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Ad Revenue</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalMonthlyAdRevenue), state.currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalAdRevenuePerUser), state.currency)} / user</p>
                                </div>
                            </div>
                             <Card>
                                <CardHeader><FormLabelWithTooltip label="Premium Plan Pricing Suggestion" tooltipText="Calculates a suggested price for an ad-free plan to meet your profit goals." /></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                     <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm text-muted-foreground">Break-Even (Cost + Ad Loss)</p>
                                        <p className="text-xl font-bold">{formatCurrency(toCurrentCurrency(breakEvenPricePerUser), state.currency)}</p>
                                        <p className="text-xs text-muted-foreground">per user / month</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Desired Profit Margin (%)</Label>
                                        <Input type="number" value={state.profitMargin} onChange={e => handleStateChange('profitMargin', Number(e.target.value))} />
                                    </div>
                                    <div className={cn("p-4 rounded-lg border text-center", "bg-primary/10")}>
                                        <p className="text-sm text-primary">Suggested Ad-Free Price</p>
                                        <p className={cn("text-3xl font-bold text-primary")}>{formatCurrency(toCurrentCurrency(suggestedPrice), state.currency)}</p>
                                         <p className="text-xs text-primary">per user / month</p>
                                    </div>
                                </CardContent>
                             </Card>
                        </CardContent>
                    </Card>
                </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

    