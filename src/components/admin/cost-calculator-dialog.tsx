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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
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

interface OtherCharge {
    id: string;
    type: 'basic' | 'advanced';
    name: string;
    // Basic
    cost?: number;
    // Advanced
    freeTier?: number;
    paidTierVolume?: number;
    paidTierPrice?: number;
    userVolume?: number;
}


const initialCalculatorState = {
    users: 1000,
    currency: 'USD' as 'USD' | 'INR',
    exchangeRate: 90.01,
    profitMargin: 50,
    expenses: {
        mail: { volume: 50000, cost: 0.8, userVolume: 50 },
        hosting: { freeTier: 2000000, paidTierVolume: 1000000, paidTierPrice: 0.4, userVolume: 100 },
        storage: { freeTier: 5, paidTierVolume: 1, paidTierPrice: 0.02, userVolume: 0.001 },
        auth: { freeTier: 50000, paidTierVolume: 1, paidTierPrice: 0.0055, userVolume: 1 },
        dbOps: { readFree: 50000, writeFree: 20000, readPrice: 0.06, writePrice: 0.18, userReads: 100, userWrites: 50 },
        otherCharges: [
            { id: 'domains', type: 'basic', name: 'Domain Name Renewals (Annual)', cost: 15 },
            { id: 'outbound', type: 'basic', name: 'Outbound Email Service (e.g., SendGrid)', cost: 10 },
        ] as OtherCharge[],
    },
    revenue: {
        totalSubscription: 0,
        pageviewsPerUser: 30,
        tier1: { percent: 10, rpm: 15 },
        tier2: { percent: 40, rpm: 5 },
        tier3: { percent: 50, rpm: 0.70 },
    }
};

type CalculatorState = typeof initialCalculatorState;

const isObject = (item: any): item is object => item && typeof item === 'object' && !Array.isArray(item);

const mergeDeep = (target: any, ...sources: any[]): any => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (source[key] !== undefined) {
        if (isObject(source[key])) {
          if (!target[key] || !isObject(target[key])) {
            Object.assign(target, { [key]: {} });
          }
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
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
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current: any = newState;
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

    const calculateServiceCostPerUser = (config: { freeTier?: number, paidTierVolume?: number, paidTierPrice?: number, userVolume?: number }) => {
        const totalUsage = (state.users || 0) * (config.userVolume || 0);
        const chargeableUsage = Math.max(0, totalUsage - (config.freeTier || 0));
        const costPerPaidUnit = (config.paidTierPrice || 0) / (config.paidTierVolume || 1);
        const totalCost = chargeableUsage * costPerPaidUnit;
        return totalCost / (state.users || 1);
    };
    
    const mailCostPerUser = useMemo(() => {
        const costPerUnit = (state.expenses.mail.cost || 0) / (state.expenses.mail.volume || 1);
        return costPerUnit * (state.expenses.mail.userVolume || 0);
    }, [state.expenses.mail]);
    
    const hostingCostPerUser = useMemo(() => calculateServiceCostPerUser(state.expenses.hosting), [state.expenses.hosting, state.users]);
    const storageCostPerUser = useMemo(() => calculateServiceCostPerUser(state.expenses.storage), [state.expenses.storage, state.users]);
    const authCostPerUser = useMemo(() => calculateServiceCostPerUser(state.expenses.auth), [state.expenses.auth, state.users]);

    const dbOpsCostPerUser = useMemo(() => {
        const totalReads = state.users * state.expenses.dbOps.userReads;
        const totalWrites = state.users * state.expenses.dbOps.userWrites;

        const chargeableReads = Math.max(0, totalReads - state.expenses.dbOps.readFree);
        const chargeableWrites = Math.max(0, totalWrites - state.expenses.dbOps.writeFree);
        
        const readCost = (chargeableReads / 100000) * state.expenses.dbOps.readPrice;
        const writeCost = (chargeableWrites / 100000) * state.expenses.dbOps.writePrice;
        
        return (readCost + writeCost) / (state.users || 1);
    }, [state.expenses.dbOps, state.users]);

    const otherChargesPerUser = useMemo(() => {
        return state.expenses.otherCharges.reduce((acc, charge) => {
            if (charge.type === 'basic') {
                return acc + ((charge.cost || 0) / (state.users || 1));
            }
            if (charge.type === 'advanced') {
                return acc + calculateServiceCostPerUser(charge);
            }
            return acc;
        }, 0);
    }, [state.expenses.otherCharges, state.users]);


    const totalCostPerUser = mailCostPerUser + hostingCostPerUser + storageCostPerUser + authCostPerUser + dbOpsCostPerUser + otherChargesPerUser;
    
    const totalAdRevenuePerUser = useMemo(() => {
        const pageviewsPerUser = state.revenue.pageviewsPerUser || 0;
        const rpmT1 = (state.revenue.tier1.percent / 100) * (pageviewsPerUser / 1000) * state.revenue.tier1.rpm;
        const rpmT2 = (state.revenue.tier2.percent / 100) * (pageviewsPerUser / 1000) * state.revenue.tier2.rpm;
        const rpmT3 = (state.revenue.tier3.percent / 100) * (pageviewsPerUser / 1000) * state.revenue.tier3.rpm;
        return rpmT1 + rpmT2 + rpmT3;
    }, [state.revenue]);

    const breakEvenPricePerUser = totalCostPerUser + totalAdRevenuePerUser;
    const suggestedPrice = breakEvenPricePerUser / (1 - (state.profitMargin / 100));
    
    const handleAddCharge = (type: 'basic' | 'advanced') => {
        const newCharge: OtherCharge = { id: `charge-${Date.now()}`, type, name: '' };
        if (type === 'basic') newCharge.cost = 0;
        if (type === 'advanced') {
            newCharge.freeTier = 0;
            newCharge.paidTierVolume = 1;
            newCharge.paidTierPrice = 0;
            newCharge.userVolume = 0;
        }
        handleStateChange('expenses.otherCharges', [...state.expenses.otherCharges, newCharge]);
    };
    const handleRemoveCharge = (id: string) => handleStateChange('expenses.otherCharges', state.expenses.otherCharges.filter((c) => c.id !== id));
    const handleChargeChange = (id: string, field: keyof OtherCharge, value: string | number) => {
        const newCharges = state.expenses.otherCharges.map(c => 
            c.id === id ? { ...c, [field]: value } : c
        );
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
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Monthly Expenses</CardTitle>
                                <CardDescription>Enter your estimated monthly costs for various services.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <FormLabelWithTooltip label="Mail Service (e.g., Mailgun)" tooltipText="Cost for processing incoming emails. Enter your total monthly volume and total bill from the provider." />
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Total Emails / month</Label>
                                          <Input type="number" value={state.expenses.mail.volume} onChange={e => handleStateChange('expenses.mail.volume', Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Total Cost ($)</Label>
                                          <Input type="number" step="0.1" value={state.expenses.mail.cost} onChange={e => handleStateChange('expenses.mail.cost', Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Est. Emails / User</Label>
                                          <Input type="number" value={state.expenses.mail.userVolume} onChange={e => handleStateChange('expenses.mail.userVolume', Number(e.target.value))} />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <p className="text-sm text-muted-foreground">
                                            Cost per User: <span className="font-bold text-foreground">{formatCurrency(toCurrentCurrency(mailCostPerUser), state.currency)}</span>
                                        </p>
                                    </CardFooter>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="pb-2">
                                        <FormLabelWithTooltip label="Hosting (Cloud Run)" tooltipText={`Cost for server-side code execution (e.g. webhooks) beyond the free tier.`} />
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Free Requests / month</Label>
                                          <Input type="number" value={state.expenses.hosting.freeTier} onChange={e => handleStateChange(`expenses.hosting.freeTier`, Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Paid Requests Unit</Label>
                                          <Input type="number" value={state.expenses.hosting.paidTierVolume} onChange={e => handleStateChange(`expenses.hosting.paidTierVolume`, Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Price per Unit ($)</Label>
                                          <Input type="number" step="0.0001" value={state.expenses.hosting.paidTierPrice} onChange={e => handleStateChange(`expenses.hosting.paidTierPrice`, Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground">Est. Requests / User</Label>
                                          <Input type="number" step="0.001" value={state.expenses.hosting.userVolume} onChange={e => handleStateChange(`expenses.hosting.userVolume`, Number(e.target.value))} />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <p className="text-sm text-muted-foreground">
                                            Cost per User: <span className="font-bold text-foreground">{formatCurrency(toCurrentCurrency(hostingCostPerUser), state.currency)}</span>
                                        </p>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <FormLabelWithTooltip label="Firestore Database Operations" tooltipText={`Cost for reading and writing documents in your database.`} />
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 gap-4">
                                        <div className="p-4 border rounded-md space-y-4">
                                            <Label className="font-semibold">Read Operations</Label>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Free Reads / month</Label>
                                                <Input type="number" value={state.expenses.dbOps.readFree} onChange={e => handleStateChange(`expenses.dbOps.readFree`, Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Price per 100k Reads ($)</Label>
                                                <Input type="number" step="0.01" value={state.expenses.dbOps.readPrice} onChange={e => handleStateChange(`expenses.dbOps.readPrice`, Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Est. Reads / User</Label>
                                                <Input type="number" value={state.expenses.dbOps.userReads} onChange={e => handleStateChange(`expenses.dbOps.userReads`, Number(e.target.value))} />
                                            </div>
                                        </div>
                                        <div className="p-4 border rounded-md space-y-4">
                                            <Label className="font-semibold">Write Operations</Label>
                                             <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Free Writes / month</Label>
                                                <Input type="number" value={state.expenses.dbOps.writeFree} onChange={e => handleStateChange(`expenses.dbOps.writeFree`, Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Price per 100k Writes ($)</Label>
                                                <Input type="number" step="0.01" value={state.expenses.dbOps.writePrice} onChange={e => handleStateChange(`expenses.dbOps.writePrice`, Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Est. Writes / User</Label>
                                                <Input type="number" value={state.expenses.dbOps.userWrites} onChange={e => handleStateChange(`expenses.dbOps.userWrites`, Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <p className="text-sm text-muted-foreground">
                                            Cost per User: <span className="font-bold text-foreground">{formatCurrency(toCurrentCurrency(dbOpsCostPerUser), state.currency)}</span>
                                        </p>
                                    </CardFooter>
                                </Card>

                                {[['storage', 'Storage (GiB)'], ['auth', 'Authentication (MAUs)']].map(([service, serviceLabel]) => {
                                    const s = service as 'storage' | 'auth';
                                    const config = state.expenses[s];
                                    const costPerUser = calculateServiceCostPerUser(config);
                                    const unit = s === 'storage' ? 'GiB' : 'Users';
                                    return (
                                        <Card key={s}>
                                            <CardHeader className="pb-2">
                                                <FormLabelWithTooltip label={serviceLabel} tooltipText={`Cost for ${s} beyond the free tier.`} />
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                  <Label className="text-xs text-muted-foreground">Free Tier Volume ({unit})</Label>
                                                  <Input type="number" value={config.freeTier} onChange={e => handleStateChange(`expenses.${s}.freeTier`, Number(e.target.value))} />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs text-muted-foreground">Paid Tier Volume ({unit})</Label>
                                                  <Input type="number" value={config.paidTierVolume} onChange={e => handleStateChange(`expenses.${s}.paidTierVolume`, Number(e.target.value))} />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs text-muted-foreground">Paid Tier Price ($)</Label>
                                                  <Input type="number" step="0.0001" value={config.paidTierPrice} onChange={e => handleStateChange(`expenses.${s}.paidTierPrice`, Number(e.target.value))} />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs text-muted-foreground">Est. Usage/User ({unit})</Label>
                                                  <Input type="number" step="0.001" value={config.userVolume} onChange={e => handleStateChange(`expenses.${s}.userVolume`, Number(e.target.value))} />
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <p className="text-sm text-muted-foreground">
                                                    Cost per User: <span className="font-bold text-foreground">{formatCurrency(toCurrentCurrency(costPerUser), state.currency)}</span>
                                                </p>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}

                                <Card>
                                    <CardHeader className="pb-2">
                                        <FormLabelWithTooltip label="Other Charges" tooltipText="Add any other miscellaneous monthly costs (e.g., other APIs, software licenses)." />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {state.expenses.otherCharges.map((charge) => (
                                            <div key={charge.id} className="p-4 border rounded-md space-y-4 relative">
                                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleRemoveCharge(charge.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                <Input placeholder="Charge Name" value={charge.name} onChange={e => handleChargeChange(charge.id, 'name', e.target.value)} />
                                                {charge.type === 'basic' ? (
                                                     <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Total Monthly Cost ($)</Label>
                                                        <Input type="number" value={charge.cost || ''} onChange={e => handleChargeChange(charge.id, 'cost', Number(e.target.value))} />
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="space-y-2">
                                                          <Label className="text-xs text-muted-foreground">Free Tier Volume</Label>
                                                          <Input type="number" value={charge.freeTier || ''} onChange={e => handleChargeChange(charge.id, 'freeTier', Number(e.target.value))} />
                                                        </div>
                                                        <div className="space-y-2">
                                                          <Label className="text-xs text-muted-foreground">Paid Tier Volume</Label>
                                                          <Input type="number" value={charge.paidTierVolume || ''} onChange={e => handleChargeChange(charge.id, 'paidTierVolume', Number(e.target.value))} />
                                                        </div>
                                                        <div className="space-y-2">
                                                          <Label className="text-xs text-muted-foreground">Paid Tier Price ($)</Label>
                                                          <Input type="number" value={charge.paidTierPrice || ''} onChange={e => handleChargeChange(charge.id, 'paidTierPrice', Number(e.target.value))} />
                                                        </div>
                                                        <div className="space-y-2">
                                                          <Label className="text-xs text-muted-foreground">Est. Usage/User</Label>
                                                          <Input type="number" value={charge.userVolume || ''} onChange={e => handleChargeChange(charge.id, 'userVolume', Number(e.target.value))} />
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-sm text-muted-foreground">
                                                    Cost per User: <span className="font-bold text-foreground">{formatCurrency(toCurrentCurrency(charge.type === 'basic' ? (charge.cost || 0) / (state.users || 1) : calculateServiceCostPerUser(charge)), state.currency)}</span>
                                                </p>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleAddCharge('basic')}><PlusCircle className="h-4 w-4 mr-2" />Add Basic Charge</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAddCharge('advanced')}><PlusCircle className="h-4 w-4 mr-2" />Add Advanced Charge</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-4">
                                <div className="w-full flex justify-between items-center">
                                    <p className="text-md font-semibold">Total Cost Per User / Month</p>
                                    <p className="text-lg font-bold">{formatCurrency(toCurrentCurrency(totalCostPerUser), state.currency)}</p>
                                </div>
                            </CardFooter>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                                <CardDescription>Model your potential revenue from advertising.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <FormLabelWithTooltip label="Ad Revenue Calculator" tooltipText="Model your ad revenue based on user activity and traffic geography. RPM is Revenue Per 1,000 Pageviews." />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Pageviews/User/Month</Label>
                                        <Input type="number" value={state.revenue.pageviewsPerUser} onChange={e => handleStateChange('revenue.pageviewsPerUser', Number(e.target.value))} />
                                        </div>
                                        <Separator className="my-2"/>
                                        <Label className="font-semibold text-xs">Traffic Distribution & RPM</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Tier 1 (e.g. USA) Traffic (%)</Label>
                                            <Input type="number" value={state.revenue.tier1.percent} onChange={e => handleStateChange('revenue.tier1.percent', Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Tier 1 RPM ($)</Label>
                                            <Input type="number" value={state.revenue.tier1.rpm} onChange={e => handleStateChange('revenue.tier1.rpm', Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Tier 2 (e.g. Europe) Traffic (%)</Label>
                                            <Input type="number" value={state.revenue.tier2.percent} onChange={e => handleStateChange('revenue.tier2.percent', Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Tier 2 RPM ($)</Label>
                                            <Input type="number" value={state.revenue.tier2.rpm} onChange={e => handleStateChange('revenue.tier2.rpm', Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Tier 3 (e.g. India) Traffic (%)</Label>
                                            <Input type="number" value={state.revenue.tier3.percent} onChange={e => handleStateChange('revenue.tier3.percent', Number(e.target.value))} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Tier 3 RPM ($)</Label>
                                            <Input type="number" step="0.01" value={state.revenue.tier3.rpm} onChange={e => handleStateChange('revenue.tier3.rpm', Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </div>
                    <Separator />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Summary & Pricing Suggestion (for {state.users.toLocaleString()} users)</CardTitle>
                            <CardDescription>Use the results of your modeling to determine a data-driven price point.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Monthly Expense</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalCostPerUser * state.users), state.currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalCostPerUser), state.currency)} / user</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Ad Revenue</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalAdRevenuePerUser * state.users), state.currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalAdRevenuePerUser), state.currency)} / user</p>
                                </div>
                            </div>
                             <Card>
                                <CardHeader><FormLabelWithTooltip label="Premium Plan Pricing Suggestion" tooltipText="Calculates a suggested price for an ad-free plan to meet your profit goals." /></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div className="space-y-2">
                                        <Label>Desired Profit Margin (%)</Label>
                                        <Input type="number" value={state.profitMargin} onChange={e => handleStateChange('profitMargin', Number(e.target.value))} />
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card space-y-2">
                                        <p className="text-sm text-muted-foreground">Break-Even (Cost + Ad Loss)</p>
                                        <p className="text-xl font-bold">{formatCurrency(toCurrentCurrency(breakEvenPricePerUser), state.currency)}</p>
                                        <p className="text-xs text-muted-foreground">per user / month</p>
                                    </div>
                                    <div className={cn("p-4 rounded-lg border text-center space-y-2", "bg-primary/10")}>
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
