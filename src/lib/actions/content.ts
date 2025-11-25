
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const contentFilePath = path.join(process.cwd(), 'src', 'lib', 'content-data.ts');

const contentFileTemplate = (key: string, data: any) => {
    const stringifiedData = JSON.stringify(data, null, 2);
    // This is a simplified template. A real implementation would need to read the existing file,
    // parse it, update the specific key, and then write it back.
    // For now, we are creating a very basic structure.
    return `
"use client";
import imageData from '@/app/lib/placeholder-images.json';

const contentStore: Record<string, any> = {
    "useCases": [],
    "features": [],
    "faqs": [],
    "comparisonFeatures": [],
    "testimonials": [],
    "exclusiveFeatures": [],
    "blogPosts": []
};

// This is a placeholder for where we would load existing data from the file
// For this simulation, we'll just overwrite it.
contentStore['${key}'] = ${stringifiedData};

export const useCases = contentStore['useCases'];
export const features = contentStore['features'];
export const faqs = contentStore['faqs'];
export const comparisonFeatures = contentStore['comparisonFeatures'];
export const testimonials = contentStore['testimonials'];
export const exclusiveFeatures = contentStore['exclusiveFeatures'];
export const blogPosts = contentStore['blogPosts'];
`;
};


// A map to convert section IDs to the variable names used in content-data.ts
const sectionIdToDataKey: Record<string, string> = {
    'why': 'useCases',
    'features': 'features',
    'faq': 'faqs',
    'comparison': 'comparisonFeatures',
    'testimonials': 'testimonials',
    'exclusive-features': 'exclusiveFeatures'
};


export async function saveContentAction(sectionId: string, data: any) {
    const dataKey = sectionIdToDataKey[sectionId];
    if (!dataKey) {
        return { success: false, error: 'Invalid section ID provided.' };
    }

    try {
        // In a real app, you'd read the file, update the specific export, and write it back.
        // This is a simplified version for demonstration.
        
        // Let's create a more robust update
        const currentFileContent = await fs.readFile(contentFilePath, 'utf-8');
        
        // This is a regex-based approach, which is fragile. A better way would be to use an AST parser
        // like Babel or TypeScript's own parser, but for this context, regex is a simpler dependency-free way.
        const dataString = JSON.stringify(data, null, 2);
        
        const regex = new RegExp(`export const ${dataKey} = ([\\s\\S]*?];)`);
        
        if (!regex.test(currentFileContent)) {
            throw new Error(`Could not find 'export const ${dataKey}' in the content file.`);
        }
        
        const newFileContent = currentFileContent.replace(regex, `export const ${dataKey} = ${dataString};`);
        
        await fs.writeFile(contentFilePath, newFileContent, 'utf-8');

        // Revalidate all paths to reflect content changes everywhere
        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error saving content:', error);
        return { success: false, error: error.message || 'Failed to write to content file.' };
    }
}

    