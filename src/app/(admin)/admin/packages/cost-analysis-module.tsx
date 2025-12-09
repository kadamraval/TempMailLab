
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, BarChart, Info, Users, AlertTriangle } from 'lucide-react';
import { type Plan } from "./data";
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CostAnalysisModuleProps {
    planData: Partial<Plan>;
}

const formatCurrency = (amount: number, currency: 'USD' | 'INR' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    }).format(amount);
};

export function CostAnalysisModule({ planData }: CostAnalysisModuleProps) {
    const [modelUsers, setModelUsers] = useState(1000);
    
    // Usage Assumptions
    const [avgEmails, setAvgEmails] = useState(15);
    const [avgPageviews, setAvgPageviews] = useState(50);
    const [avgEmailSize, setAvgEmailSize] = useState(0.1); // in MB

    // Cost Assumptions
    const [firestoreWriteCost, setFirestoreWriteCost] = useState(0.0000018); // Cost per write
    const [firestoreReadCost, setFirestoreReadCost] = useState(0.0000006); // Cost per read
    const [firestoreStorageCost, setFirestoreStorageCost] = useState(0.18); // Cost per GB/month

    // Revenue Assumptions
    const [region, setRegion] = useState('usa');
    const [rpm, setRpm] = useState(10);
    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
    const [exchangeRate, setExchangeRate] = useState(83.5);

    useEffect(() => {
        // Update RPM when region changes
        const revenueRegions: any = { usa: 10, inr: 2, other: 5 };
        setRpm(revenueRegions[region] || 5);
    }, [region]);
    
    const analysis = useMemo(() => {
        // --- COST CALCULATION (per 1000 users / month) ---
        const totalEmails = modelUsers * avgEmails;
        const totalPageviews = modelUsers * avgPageviews;

        // Firestore Writes
        const writeCost = totalEmails * firestoreWriteCost;

        // Firestore Reads
        const totalReads = totalPageviews * 2; // Assume 2 reads per pageview
        const readCost = totalReads * firestoreReadCost;

        // Firestore Storage
        const totalStorageGB = (totalEmails * avgEmailSize) / 1024;
        const storageCost = totalStorageGB * firestoreStorageCost;
        
        const totalFirebaseCost = writeCost + readCost + storageCost;

        // --- REVENUE CALCULATION (per 1000 users / month) ---
        let totalAdRevenue = 0;
        if (!planData.features?.noAds) {
            const impressionsPerUser = avgPageviews * 1.5; // Assume 1.5 ads per pageview
            const totalImpressions = impressionsPerUser * modelUsers;
            totalAdRevenue = (totalImpressions / 1000) * rpm;
        }
        
        const planPrice = planData.price || 0;
        const totalSubscriptionRevenue = planData.billing === 'yearly'
            ? (planPrice / 12) * modelUsers
            : planPrice * modelUsers;

        const totalRevenue = totalAdRevenue + totalSubscriptionRevenue;
        const netProfit = totalRevenue - totalFirebaseCost;

        // Currency Conversion
        const toCurrentCurrency = (usdValue: number) => currency === 'INR' ? usdValue * exchangeRate : usdValue;

        return {
            totalCost: toCurrentCurrency(totalFirebaseCost),
            totalAdRevenue: toCurrentCurrency(totalAdRevenue),
            totalSubscriptionRevenue: toCurrentCurrency(totalSubscriptionRevenue),
            netProfit: toCurrentCurrency(netProfit),
        };
    }, [planData, modelUsers, avgEmails, avgPageviews, avgEmailSize, firestoreWriteCost, firestoreReadCost, firestoreStorageCost, rpm, currency, exchangeRate]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            Profitability Calculator
                        </CardTitle>
                        <CardDescription>
                            Estimate the profitability of this plan based on a cohort of users.
                        </CardDescription>
                    </div>
                     <div className="flex gap-2">
                         <div className="w-48">
                            <Label htmlFor="model-users" className="text-xs">Model Size</Label>
                            <Input id="model-users" type="number" value={modelUsers} onChange={(e) => setModelUsers(Number(e.target.value))} className="h-8" />
                         </div>
                         <div className="w-24">
                             <Label htmlFor="currency-select" className="text-xs">Currency</Label>
                            <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
                                <SelectTrigger id="currency-select" className="w-full text-xs h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD" className="text-xs">USD</SelectItem>
                                    <SelectItem value="INR" className="text-xs">INR</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assumptions Column */}
                    <div className="space-y-4">
                        <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-base">Usage Assumptions (Per User / Month)</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Avg. Emails Received</Label>
                                    <Input type="number" value={avgEmails} onChange={e => setAvgEmails(Number(e.target.value))} className="h-8"/>
                                </div>
                                 <div className="space-y-1">
                                    <Label className="text-xs">Avg. Pageviews</Label>
                                    <Input type="number" value={avgPageviews} onChange={e => setAvgPageviews(Number(e.target.value))} className="h-8"/>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs">Avg. Email Size (MB)</Label>
                                    <Input type="number" step="0.01" value={avgEmailSize} onChange={e => setAvgEmailSize(Number(e.target.value))} className="h-8"/>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                             <CardHeader><CardTitle className="text-base">Cost Assumptions (USD)</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <Label className="text-xs">Firestore Write Cost (per)</Label>
                                    <Input type="number" step="0.0000001" value={firestoreWriteCost} onChange={e => setFirestoreWriteCost(Number(e.target.value))} className="h-8"/>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Firestore Read Cost (per)</Label>
                                    <Input type="number" step="0.0000001" value={firestoreReadCost} onChange={e => setFirestoreReadCost(Number(e.target.value))} className="h-8"/>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Storage Cost (per GB/mo)</Label>
                                    <Input type="number" step="0.01" value={firestoreStorageCost} onChange={e => setFirestoreStorageCost(Number(e.target.value))} className="h-8"/>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/30">
                             <CardHeader><CardTitle className="text-base">Revenue Assumptions</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <Label className="text-xs">Ad Revenue Region</Label>
                                    <Select value={region} onValueChange={(val) => setRegion(val as any)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="usa" className="text-xs">USA / Europe</SelectItem>
                                            <SelectItem value="inr" className="text-xs">India</SelectItem>
                                            <SelectItem value="other" className="text-xs">Other Regions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-1">
                                    <Label className="text-xs">Ad RPM (USD)</Label>
                                    <Input type="number" value={rpm} onChange={e => setRpm(Number(e.target.value))} className="h-8"/>
                                </div>
                                {currency === 'INR' && (
                                     <div className="space-y-1">
                                        <Label className="text-xs">USD to INR Rate</Label>
                                        <Input type="number" step="0.1" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="h-8"/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    {/* Results Column */}
                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Disclaimer</AlertTitle>
                            <AlertDescription>
                                These calculations are estimates and do not account for free tier allowances. Actual costs may vary.
                            </AlertDescription>
                        </Alert>
                         <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-base">Monthly Financial Summary</CardTitle><CardDescription>Based on a cohort of {modelUsers.toLocaleString()} users.</CardDescription></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Subscription Revenue</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(analysis.totalSubscriptionRevenue, currency)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Est. Ad Revenue</TableCell>
                                            <TableCell className={cn("text-right font-medium", planData.features?.noAds && "line-through text-muted-foreground")}>{formatCurrency(analysis.totalAdRevenue, currency)}</TableCell>
                                        </TableRow>
                                         <TableRow className="font-bold bg-green-500/10">
                                            <TableCell>Total Revenue</TableCell>
                                            <TableCell className="text-right">{formatCurrency(analysis.totalSubscriptionRevenue + analysis.totalAdRevenue, currency)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Est. Firebase Costs</TableCell>
                                            <TableCell className="text-right font-medium">({formatCurrency(analysis.totalCost, currency)})</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        
                        <Card className={cn(
                            analysis.netProfit >= 0 ? "bg-emerald-100/50 dark:bg-emerald-900/30" : "bg-red-100/50 dark:bg-red-900/30"
                        )}>
                            <CardHeader>
                                <CardTitle className="text-base">Net Monthly Profit / (Loss)</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <p className={cn(
                                    "text-4xl font-bold tracking-tight",
                                     analysis.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {formatCurrency(analysis.netProfit, currency)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
