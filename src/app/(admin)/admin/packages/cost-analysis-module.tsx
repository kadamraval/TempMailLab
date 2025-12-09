
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, BarChart, Info } from 'lucide-react';
import { type Plan } from "./data";
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


interface CostAnalysisModuleProps {
    planData: Partial<Plan>;
}

const costs = {
    inboundMail: { name: "Inbound Mail (inbound.new)", cost: 0, note: "Generous free tier covers typical usage." },
    hosting: { name: "Firebase Hosting", cost: 0, note: "Free tier covers most small to medium traffic." },
    auth: { name: "Firebase Authentication", cost: 0, note: "10,000 MAUs free." },
    firestore: { name: "Firestore Database", cost: 0, note: "Generous free tier for reads/writes/storage." },
};

const revenueRegions = {
    usa: { name: "USA / Europe", rpm: 10 },
    inr: { name: "India", rpm: 2 },
    other: { name: "Other Regions", rpm: 5 },
};

const formatCurrency = (amount: number, currency: 'USD' | 'INR' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    }).format(amount);
};

export function CostAnalysisModule({ planData }: CostAnalysisModuleProps) {
    const [region, setRegion] = useState<keyof typeof revenueRegions>('usa');
    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

    const analysis = useMemo(() => {
        const totalCost = Object.values(costs).reduce((acc, service) => acc + service.cost, 0);

        const impressionsPerUser = 60; // Assumption: 30 visits/month * 2 ads/visit
        const selectedRegion = revenueRegions[region];
        const revenuePerImpression = selectedRegion.rpm / 1000;
        
        let estimatedAdRevenue = 0;
        if (!planData.features?.noAds) {
            estimatedAdRevenue = impressionsPerUser * revenuePerImpression;
        }

        const planPrice = planData.price || 0;
        
        const netProfit = (planPrice + estimatedAdRevenue) - totalCost;

        // Convert to INR if selected
        const exchangeRate = 83; // Approximate
        const toCurrentCurrency = (usdValue: number) => currency === 'INR' ? usdValue * exchangeRate : usdValue;
        
        return {
            totalCost: toCurrentCurrency(totalCost),
            estimatedAdRevenue: toCurrentCurrency(estimatedAdRevenue),
            netProfit: toCurrentCurrency(netProfit),
        };
    }, [planData, region, currency]);

    return (
        <Card className="border-dashed">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            Cost & Revenue Analysis (Per User / Month)
                        </CardTitle>
                        <CardDescription>
                            Estimate the profitability of this plan based on typical usage.
                        </CardDescription>
                    </div>
                     <div className="flex gap-2">
                        <Select value={region} onValueChange={(val) => setRegion(val as any)}>
                            <SelectTrigger className="w-[140px] text-xs h-8">
                                <SelectValue placeholder="Region" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(revenueRegions).map(([key, value]) => (
                                    <SelectItem key={key} value={key} className="text-xs">{value.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
                            <SelectTrigger className="w-[80px] text-xs h-8">
                                <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD" className="text-xs">USD</SelectItem>
                                <SelectItem value="INR" className="text-xs">INR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Costs */}
                    <div className="space-y-2">
                        <Label>Estimated Costs</Label>
                        <Card className="bg-muted/50">
                            <CardContent className="p-4">
                                <Table>
                                    <TableBody>
                                        {Object.values(costs).map(service => (
                                            <TableRow key={service.name}>
                                                <TableCell className="font-medium text-xs flex items-center">
                                                    {service.name}
                                                     <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 ml-2 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                            <p>{service.note}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-right text-xs">{formatCurrency(service.cost, currency)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                 <div className="text-right font-bold mt-2 pr-4 text-sm">
                                    Total: {formatCurrency(analysis.totalCost, currency)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue */}
                    <div className="space-y-2">
                        <Label>Estimated Revenue</Label>
                        <Card className="bg-muted/50">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-center p-2 rounded-md">
                                    <span className="text-xs font-medium">Plan Price</span>
                                    <span className="text-sm font-bold">{formatCurrency(currency === 'INR' ? (planData.price || 0) * 83 : (planData.price || 0), currency)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-md">
                                     <span className="text-xs font-medium flex items-center">
                                        Ad Revenue
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 ml-2 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                <p>Based on ~60 impressions/user at an RPM of {formatCurrency(revenueRegions[region].rpm)}.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </span>
                                    <span className={cn("text-sm", planData.features?.noAds && "line-through text-muted-foreground")}>{formatCurrency(analysis.estimatedAdRevenue, currency)}</span>
                                </div>
                                <div className="text-right font-bold mt-2 pr-2 text-sm">
                                    Total: {formatCurrency(analysis.netProfit + analysis.totalCost, currency)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Net Profit */}
                    <div className="space-y-2">
                         <Label>Net Profit / (Loss)</Label>
                        <Card className={cn(
                            analysis.netProfit >= 0 ? "bg-emerald-100/50 dark:bg-emerald-900/30" : "bg-red-100/50 dark:bg-red-900/30"
                        )}>
                            <CardContent className="p-4 flex items-center justify-center">
                                <p className={cn(
                                    "text-4xl font-bold tracking-tight",
                                     analysis.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {formatCurrency(analysis.netProfit, currency)}
                                </p>
                            </CardContent>
                        </Card>
                         <p className="text-xs text-muted-foreground text-center">
                            This is an estimate for a single user per month. Actual results will vary.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

