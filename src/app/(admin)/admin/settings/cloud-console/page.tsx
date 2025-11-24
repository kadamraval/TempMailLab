
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CloudConsolePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Google Cloud Console</CardTitle>
                <CardDescription>Quick links to manage your underlying Google Cloud services.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                 <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-base">Cloud Home</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Main dashboard for your Google Cloud project.
                            </p>
                        </CardContent>
                    </Card>
                </a>
                 <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-base">Firebase Console</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Manage your Firebase project, including Auth and Firestore.
                            </p>
                        </CardContent>
                    </Card>
                </a>
                 <a href="https://console.cloud.google.com/run" target="_blank" rel="noopener noreferrer">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-base">Cloud Run</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Manage your containerized services and backend logic.
                            </p>
                        </CardContent>
                    </Card>
                </a>
                 <a href="https://console.cloud.google.com/functions" target="_blank" rel="noopener noreferrer">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-base">Cloud Functions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Deploy and manage serverless functions for backend tasks.
                            </p>
                        </CardContent>
                    </Card>
                </a>
            </CardContent>
        </Card>
    )
}
