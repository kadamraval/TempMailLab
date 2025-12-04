
import { promises as fs } from 'fs';
import path from 'path';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// This is a Server Component, so we can read from the filesystem directly.
async function getFirestoreRules() {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  try {
    const rulesContent = await fs.readFile(rulesPath, 'utf-8');
    return rulesContent;
  } catch (error) {
    console.error("Could not read firestore.rules:", error);
    return "Error: Could not load the firestore.rules file.";
  }
}

export default async function RulesBookPage() {
  const rules = await getFirestoreRules();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firestore Rules Book</CardTitle>
        <CardDescription>
          This is a read-only view of the currently active Firestore security rules. These rules are automatically deployed when the `firestore.rules` file is changed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] bg-muted rounded-md">
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
            <code>{rules}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
