
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
    exchangeRate: 83.5,
    profitMargin: 50,
    expenses: {
        mail: { volume: 50000, cost: 15, userVolume: 50 },
        auth: { volume: 50000, cost: 0.00, userVolume: 1 },
        storage: { volume: 5, cost: 0, userVolume: 0.05 },
        hosting: { volume: 10, cost: 0, userVolume: 0.1 },
        otherCharges: [] as {name: string, cost: number}[],
    },
    revenue: {
        pageviewsPerUser: 30,
        tier1Traffic: { percent: 10, rpm: 15 },
        tier2Traffic: { percent: 40, rpm: 5 },
        tier3Traffic: { percent: 50, rpm: 0.70 },
    }
};

type CalculatorState = typeof initialCalculatorState;

// Deep merge utility
const isObject = (item: any) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

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

    const handleNestedChange = (path: string, value: any) => {
        setState(prev => {
            const keys = path.split('.');
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
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

    // --- EXPENSES ---
    const totalOtherCharges = state.expenses.otherCharges.reduce((acc, charge) => acc + charge.cost, 0);
    const totalExpenses = state.expenses.mail.cost + state.expenses.auth.cost + state.expenses.storage.cost + state.expenses.hosting.cost + totalOtherCharges;
    const totalExpensePerUser = totalExpenses / (state.users || 1);


    // --- REVENUE ---
    const { totalAdRevenue, adRevenuePerUser } = useMemo(() => {
        const totalPageviews = state.users * state.revenue.pageviewsPerUser;
        
        const tier1Pageviews = totalPageviews * (state.revenue.tier1Traffic.percent / 100);
        const tier1Earnings = (tier1Pageviews / 1000) * state.revenue.tier1Traffic.rpm;

        const tier2Pageviews = totalPageviews * (state.revenue.tier2Traffic.percent / 100);
        const tier2Earnings = (tier2Pageviews / 1000) * state.revenue.tier2Traffic.rpm;
        
        const tier3Pageviews = totalPageviews * (state.revenue.tier3Traffic.percent / 100);
        const tier3Earnings = (tier3Pageviews / 1000) * state.revenue.tier3Traffic.rpm;
        
        const totalRevenue = tier1Earnings + tier2Earnings + tier3Earnings;
        const revenuePerUser = totalRevenue / (state.users || 1);

        return { totalAdRevenue: totalRevenue, adRevenuePerUser: revenuePerUser };
    }, [state.users, state.revenue]);

    // --- PRICING SUGGESTION ---
    const breakEvenPricePerUser = totalExpensePerUser + adRevenuePerUser;
    const suggestedPrice = breakEvenPricePerUser * (1 + (state.profitMargin / 100));


    const handleAddCharge = () => handleNestedChange('expenses.otherCharges', [...state.expenses.otherCharges, { name: '', cost: 0 }]);
    const handleRemoveCharge = (index: number) => handleNestedChange('expenses.otherCharges', state.expenses.otherCharges.filter((_, i) => i !== index));
    const handleChargeChange = (index: number, field: 'name' | 'cost', value: string | number) => {
        const newCharges = [...state.expenses.otherCharges];
        (newCharges[index] as any)[field] = value;
        handleNestedChange('expenses.otherCharges', newCharges);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Business Cost & Revenue Calculator</DialogTitle>
                    <DialogDescription>
                        Model your operational costs and revenue streams. All financial figures are in USD and converted to your selected currency.
                    </DialogDescription>
                </DialogHeader>
                {isLoadingSettings ? <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Global Settings</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Model Users" tooltipText="The total number of monthly active users to base all calculations on." />
                                <Input type="number" value={state.users} onChange={(e) => handleNestedChange('users', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Display Currency" tooltipText="Display all financial data in this currency." />
                                <Select value={state.currency} onValueChange={(val) => handleNestedChange('currency', val as 'USD' | 'INR')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                                </Select>
                            </div>
                            {state.currency === 'INR' && (
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="USD to INR Rate" tooltipText="The exchange rate used for currency conversion." />
                                    <Input type="number" value={state.exchangeRate} onChange={e => handleNestedChange('exchangeRate', Number(e.target.value))} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Monthly Expenses</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Mail (e.g., inbound.new)" tooltipText="Cost for processing incoming emails. Enter your total monthly volume and total bill from the provider." />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume</Label><Input type="number" value={state.expenses.mail.volume} onChange={e => handleNestedChange('expenses.mail.volume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" value={state.expenses.mail.cost} onChange={e => handleNestedChange('expenses.mail.cost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">(Info) Vol/User</Label><Input type="number" value={state.expenses.mail.userVolume} onChange={e => handleNestedChange('expenses.mail.userVolume', Number(e.target.value))} /></div>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firebase Auth (MAU)" tooltipText="Cost for monthly active users. Set total volume and cost (often $0 if within free tier)." />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume</Label><Input type="number" value={state.expenses.auth.volume} onChange={e => handleNestedChange('expenses.auth.volume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" value={state.expenses.auth.cost} onChange={e => handleNestedChange('expenses.auth.cost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">(Info) Vol/User</Label><Input type="number" readOnly value={state.expenses.auth.userVolume} /></div>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Cloud Hosting (GB)" tooltipText="Cost for data transfer (egress). Set total GB transferred and the total cost from your bill." />
                                     <div className="grid grid-cols-3 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume (GB)</Label><Input type="number" value={state.expenses.hosting.volume} onChange={e => handleNestedChange('expenses.hosting.volume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" step="0.01" value={state.expenses.hosting.cost} onChange={e => handleNestedChange('expenses.hosting.cost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">(Info) GB/User</Label><Input type="number" step="0.1" value={state.expenses.hosting.userVolume} onChange={e => handleNestedChange('expenses.hosting.userVolume', Number(e.target.value))} /></div>
                                    </div>
                                </div>
                                 <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Cloud Storage (GB)" tooltipText="Cost for storing files (attachments). Set total GB stored and the total cost from your bill." />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume (GB)</Label><Input type="number" value={state.expenses.storage.volume} onChange={e => handleNestedChange('expenses.storage.volume', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" step="0.01" value={state.expenses.storage.cost} onChange={e => handleNestedChange('expenses.storage.cost', Number(e.target.value))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">(Info) GB/User</Label><Input type="number" step="0.01" value={state.expenses.storage.userVolume} onChange={e => handleNestedChange('expenses.storage.userVolume', Number(e.target.value))} /></div>
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
                                            <div><Label className="text-xs text-muted-foreground">Pageviews/User/Month</Label><Input type="number" value={state.revenue.pageviewsPerUser} onChange={e => handleNestedChange('revenue.pageviewsPerUser', Number(e.target.value))} /></div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Traffic Distribution & RPM</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                 <div><Label className="text-xs text-muted-foreground">USA/Tier 1 Traffic (%)</Label><Input type="number" value={state.revenue.tier1Traffic.percent} onChange={e => handleNestedChange('revenue.tier1Traffic.percent', Number(e.target.value))} /></div>
                                                 <div><Label className="text-xs text-muted-foreground">Tier 1 RPM ($)</Label><Input type="number" value={state.revenue.tier1Traffic.rpm} onChange={e => handleNestedChange('revenue.tier1Traffic.rpm', Number(e.target.value))} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">Europe/Tier 2 Traffic (%)</Label><Input type="number" value={state.revenue.tier2Traffic.percent} onChange={e => handleNestedChange('revenue.tier2Traffic.percent', Number(e.target.value))} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Tier 2 RPM ($)</Label><Input type="number" value={state.revenue.tier2Traffic.rpm} onChange={e => handleNestedChange('revenue.tier2Traffic.rpm', Number(e.target.value))} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">India/Tier 3 Traffic (%)</Label><Input type="number" value={state.revenue.tier3Traffic.percent} onChange={e => handleNestedChange('revenue.tier3Traffic.percent', Number(e.target.value))} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Tier 3 RPM ($)</Label><Input type="number" value={state.revenue.tier3Traffic.rpm} onChange={e => handleNestedChange('revenue.tier3Traffic.rpm', Number(e.target.value))} /></div>
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
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalExpenses), state.currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalExpensePerUser), state.currency)} / user</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Ad Revenue</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalAdRevenue), state.currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(adRevenuePerUser), state.currency)} / user</p>
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
                                        <Input type="number" value={state.profitMargin} onChange={e => handleNestedChange('profitMargin', Number(e.target.value))} />
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
