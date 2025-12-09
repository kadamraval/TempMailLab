
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
    const [mail, setMail] = useState({ volume: 50000, cost: 15, userVolume: 50 });
    const [auth, setAuth] = useState({ volume: 10000, cost: 0, userVolume: 1 });
    const [storage, setStorage] = useState({ volume: 5, cost: 0.12, userVolume: 0.05 }); // GB
    const [otherCharges, setOtherCharges] = useState<{name: string, cost: number}[]>([]);
    
    // Revenue States
    const [pageviewsPerUser, setPageviewsPerUser] = useState(30);
    const [adsPerPage, setAdsPerPage] = useState(2);
    const [tier1Traffic, setTier1Traffic] = useState({ percent: 50, rpm: 15 });
    const [tier2Traffic, setTier2Traffic] = useState({ percent: 50, rpm: 0.70 });
    const [totalSubscriptionRevenue, setTotalSubscriptionRevenue] = useState(500); // Manual input

    const toCurrentCurrency = (usdValue: number) => currency === 'INR' ? usdValue * exchangeRate : usdValue;

    // --- EXPENSES ---
    const costPerMail = mail.cost / (mail.volume || 1);
    const mailCostPerUser = costPerMail * mail.userVolume;
    
    const costPerAuth = auth.cost / (auth.volume || 1);
    const authCostPerUser = costPerAuth * auth.userVolume;

    const costPerGbStorage = storage.cost / (storage.volume || 1);
    const storageCostPerUser = costPerGbStorage * storage.userVolume;
    
    const otherChargesPerUser = otherCharges.reduce((acc, charge) => acc + charge.cost, 0) / (users || 1);

    const totalExpensePerUser = mailCostPerUser + authCostPerUser + storageCostPerUser + otherChargesPerUser;
    const totalExpenses = totalExpensePerUser * users;

    // --- REVENUE ---
    const totalAdRevenue = useMemo(() => {
        const totalPageviews = users * pageviewsPerUser;
        const tier1Pageviews = totalPageviews * (tier1Traffic.percent / 100);
        const tier2Pageviews = totalPageviews * (tier2Traffic.percent / 100);

        const tier1Earnings = (tier1Pageviews / 1000) * tier1Traffic.rpm;
        const tier2Earnings = (tier2Pageviews / 1000) * tier2Traffic.rpm;

        return tier1Earnings + tier2Earnings;
    }, [users, pageviewsPerUser, tier1Traffic, tier2Traffic]);

    const totalRevenue = totalSubscriptionRevenue + totalAdRevenue;
    const perUserRevenue = totalRevenue / (users || 1);

    // --- SUMMARY ---
    const netProfit = totalRevenue - totalExpenses;

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
                        Model your operational costs and revenue streams. All financial figures are in USD and converted to your selected currency.
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
                                <FormLabelWithTooltip label="Model Users" tooltipText="The total number of monthly active users to base all calculations on." />
                                <Input type="number" value={users} onChange={(e) => setUsers(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <FormLabelWithTooltip label="Display Currency" tooltipText="Display all financial data in this currency." />
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
                                        <div><Label className="text-xs text-muted-foreground">Total Volume (# Mails)</Label><Input type="number" placeholder="Volume" value={mail.volume} onChange={e => setMail(p => ({...p, volume: Number(e.target.value)}))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" placeholder="Total Cost" value={mail.cost} onChange={e => setMail(p => ({...p, cost: Number(e.target.value)}))} /></div>
                                        <div className="col-span-2"><Label className="text-xs text-muted-foreground">Est. Volume / User</Label><Input type="number" value={mail.userVolume} onChange={e => setMail(p => ({...p, userVolume: Number(e.target.value)}))} /></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right pt-1">Est. Cost/User: {formatCurrency(toCurrentCurrency(mailCostPerUser), currency)}</p>
                                </div>
                                <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Firebase Auth" tooltipText="Cost for user authentications." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume (MAUs)</Label><Input type="number" value={auth.volume} onChange={e => setAuth(p => ({...p, volume: Number(e.target.value)}))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" value={auth.cost} onChange={e => setAuth(p => ({...p, cost: Number(e.target.value)}))} /></div>
                                        <div className="col-span-2"><Label className="text-xs text-muted-foreground">Est. Volume / User</Label><Input type="number" value={auth.userVolume} onChange={e => setAuth(p => ({...p, userVolume: Number(e.target.value)}))} /></div>
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right pt-1">Est. Cost/User: {formatCurrency(toCurrentCurrency(authCostPerUser), currency)}</p>
                                </div>
                                 <div className="space-y-2 p-3 border rounded-lg">
                                    <FormLabelWithTooltip label="Cloud Storage" tooltipText="Cost for storing email attachments, etc." />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label className="text-xs text-muted-foreground">Total Volume (GB)</Label><Input type="number" value={storage.volume} onChange={e => setStorage(p => ({...p, volume: Number(e.target.value)}))} /></div>
                                        <div><Label className="text-xs text-muted-foreground">Total Cost ($)</Label><Input type="number" value={storage.cost} onChange={e => setStorage(p => ({...p, cost: Number(e.target.value)}))} /></div>
                                        <div className="col-span-2"><Label className="text-xs text-muted-foreground">Est. Volume / User (GB)</Label><Input type="number" value={storage.userVolume} onChange={e => setStorage(p => ({...p, userVolume: Number(e.target.value)}))} /></div>
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right pt-1">Est. Cost/User: {formatCurrency(toCurrentCurrency(storageCostPerUser), currency)}</p>
                                </div>
                                <div className="space-y-2">
                                    <FormLabelWithTooltip label="Other Charges" tooltipText="Add any other miscellaneous monthly costs (e.g., other APIs, software licenses)." />
                                    {otherCharges.map((charge, index) => (
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
                        
                        {/* --- Revenue --- */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Monthly Revenue</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="space-y-4 p-3 border rounded-lg">
                                        <FormLabelWithTooltip label="Google AdSense Revenue Calculator" tooltipText="Model your ad revenue based on user activity and traffic geography. RPM is Revenue Per 1,000 Impressions." />
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Pageviews/User/Mo</Label>
                                                <Input type="number" value={pageviewsPerUser} onChange={e => setPageviewsPerUser(Number(e.target.value))} />
                                            </div>
                                             <div>
                                                <Label className="text-xs text-muted-foreground">Ads/Page</Label>
                                                <Input type="number" value={adsPerPage} onChange={e => setAdsPerPage(Number(e.target.value))} />
                                            </div>
                                        </div>
                                        
                                        <Separator />

                                        <div className="space-y-2">
                                            <Label className="font-semibold">Traffic Distribution</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                 <div><Label className="text-xs text-muted-foreground">USA/Tier 1 Traffic (%)</Label><Input type="number" value={tier1Traffic.percent} onChange={e => setTier1Traffic(p => ({...p, percent: Number(e.target.value)}))} /></div>
                                                 <div><Label className="text-xs text-muted-foreground">Tier 1 RPM ($)</Label><Input type="number" value={tier1Traffic.rpm} onChange={e => setTier1Traffic(p => ({...p, rpm: Number(e.target.value)}))} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><Label className="text-xs text-muted-foreground">India/Tier 2 Traffic (%)</Label><Input type="number" value={tier2Traffic.percent} onChange={e => setTier2Traffic(p => ({...p, percent: Number(e.target.value)}))} /></div>
                                                <div><Label className="text-xs text-muted-foreground">Tier 2 RPM ($)</Label><Input type="number" value={tier2Traffic.rpm} onChange={e => setTier2Traffic(p => ({...p, rpm: Number(e.target.value)}))} /></div>
                                            </div>
                                        </div>

                                         <p className="text-xs text-muted-foreground text-right pt-1">Est. Ad Revenue/User: {formatCurrency(toCurrentCurrency(totalAdRevenue / (users || 1)), currency)}</p>
                                    </div>
                                    <div className="space-y-2 p-3 border rounded-lg">
                                        <FormLabelWithTooltip label="Total Monthly Subscription Revenue ($)" tooltipText="Enter your estimated total monthly revenue from all paying subscribers in USD." />
                                        <Input type="number" value={totalSubscriptionRevenue} onChange={e => setTotalSubscriptionRevenue(Number(e.target.value))} />
                                        <p className="text-xs text-muted-foreground text-right pt-1">Est. Subscription Revenue/User: {formatCurrency(toCurrentCurrency(totalSubscriptionRevenue / (users || 1)), currency)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <Separator />
                    
                    {/* --- Summary --- */}
                     <Card>
                        <CardHeader><CardTitle className="text-lg">Summary (for {users.toLocaleString()} users)</CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Monthly Expense</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalExpenses), currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(totalExpensePerUser), currency)} / user</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Total Monthly Revenue</p>
                                    <p className="text-2xl font-bold">{formatCurrency(toCurrentCurrency(totalRevenue), currency)}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(toCurrentCurrency(perUserRevenue), currency)} / user</p>
                                </div>
                            </div>
                            <div className={cn("p-4 rounded-lg border text-center", netProfit >= 0 ? "bg-emerald-100/50 dark:bg-emerald-900/30" : "bg-red-100/50 dark:bg-red-900/30")}>
                                <p className="text-sm text-muted-foreground">Est. Net Monthly Profit / (Loss)</p>
                                <p className={cn("text-3xl font-bold", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{formatCurrency(toCurrentCurrency(netProfit), currency)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    
    