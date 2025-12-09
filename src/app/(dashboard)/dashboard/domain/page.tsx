
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from '@/firebase';
import { PlusCircle, Globe, Trash2 } from 'lucide-react';
import { PremiumBanner } from '@/components/premium-banner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// This would come from Firestore in a real app
const sampleUserDomains = [
    { id: '1', domain: 'my-startup.com', verified: true },
    { id: '2', domain: 'personal-project.dev', verified: false },
]

export default function UserDomainPage() {
    const { userProfile } = useUser();
    const canAddDomains = userProfile?.plan?.features.customDomains;
    const maxDomains = userProfile?.plan?.features.totalCustomDomains || 0;

    const [userDomains, setUserDomains] = useState(sampleUserDomains);
    const [newDomain, setNewDomain] = useState('');

    const handleAddDomain = () => {
        if (newDomain.trim() === '') return;
        // In a real app, you would save this to Firestore
        setUserDomains(prev => [...prev, { id: `${Date.now()}`, domain: newDomain.trim(), verified: false }]);
        setNewDomain('');
    }

    const handleRemoveDomain = (id: string) => {
        setUserDomains(prev => prev.filter(d => d.id !== id));
    }


  return (
    <div className="space-y-6">
        <PremiumBanner />

        <Card>
            <CardHeader>
                <CardTitle>Manage Custom Domains</CardTitle>
                <CardDescription>Add your own domains to create branded temporary email addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!canAddDomains ? (
                     <Alert>
                        <Globe className="h-4 w-4" />
                        <AlertTitle>Premium Feature</AlertTitle>
                        <AlertDescription>
                          Adding custom domains is a premium feature. Please upgrade your plan to connect your own domains.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <div className="flex items-end gap-2">
                            <div className="flex-grow space-y-2">
                                <label htmlFor="new-domain" className="text-sm font-medium">New Domain</label>
                                <Input 
                                    id="new-domain" 
                                    placeholder="your-domain.com"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    disabled={userDomains.length >= maxDomains}
                                />
                            </div>
                            <Button onClick={handleAddDomain} disabled={!newDomain || userDomains.length >= maxDomains}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Domain
                            </Button>
                        </div>
                        <div className="border rounded-lg">
                            <div className="p-4 border-b">
                                <h4 className="font-medium">Your Domains ({userDomains.length}/{maxDomains})</h4>
                            </div>
                             {userDomains.map((d) => (
                                <div key={d.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                                    <div className="flex flex-col">
                                        <p className="font-mono">{d.domain}</p>
                                        <p className={`text-xs ${d.verified ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {d.verified ? 'Verified' : 'Pending Verification'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!d.verified && <Button variant="outline" size="sm">Verify</Button>}
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveDomain(d.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                             ))}
                             {userDomains.length === 0 && (
                                 <div className="p-8 text-center text-muted-foreground">
                                     You haven't added any domains yet.
                                 </div>
                             )}
                        </div>
                    </>
                )}
            </CardContent>
            {canAddDomains && (
                 <CardFooter>
                    <p className="text-sm text-muted-foreground">
                        You can add {maxDomains - userDomains.length} more domain(s).
                    </p>
                </CardFooter>
            )}
        </Card>
    </div>
  );
}
