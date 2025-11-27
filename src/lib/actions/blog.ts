'use server';

import { revalidatePath } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/server-init';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { BlogPost } from '@/app/(admin)/admin/blog/types';

type BlogPostInput = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Saves a blog post to Firestore. Handles both creating a new post and updating an existing one.
 * @param postData The data for the blog post.
 * @param postId Optional ID of the post to update. If not provided, a new post is created.
 * @returns An object indicating success or an error message.
 */
export async function savePostAction(postData: BlogPostInput, postId?: string) {
    try {
        const firestore = getAdminFirestore();
        const dataToSave: any = { ...postData };
        
        // If the status is changing to 'published' and it wasn't before, set the publishedAt date
        if (postData.status === 'published' && (!postId || (await firestore.doc(`posts/${postId}`).get()).data()?.status !== 'published')) {
            dataToSave.publishedAt = FieldValue.serverTimestamp();
        } else if (postData.status === 'draft') {
            dataToSave.publishedAt = null; // Or FieldValue.delete() if you want to remove it
        }

        if (postId) {
            // Update existing post
            const postRef = firestore.doc(`posts/${postId}`);
            dataToSave.updatedAt = FieldValue.serverTimestamp();
            await postRef.update(dataToSave);
        } else {
            // Create new post
            const collectionRef = firestore.collection("posts");
            dataToSave.createdAt = FieldValue.serverTimestamp();
            dataToSave.updatedAt = FieldValue.serverTimestamp();
            await collectionRef.add(dataToSave);
        }
        
        revalidatePath('/admin/blog');
        revalidatePath('/blog');
        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        return { error: error.message || 'An unknown error occurred.' };
    }
}


/**
 * Creates sample blog posts if they don't already exist.
 */
export async function createSampleBlogPostsAction() {
    try {
        const firestore = getAdminFirestore();
        const postsCollection = firestore.collection('posts');
        const snapshot = await postsCollection.limit(1).get();

        // If posts already exist, don't add more.
        if (!snapshot.empty) {
            return { success: true, message: "Sample posts already exist." };
        }

        const samplePosts = [
            {
                title: "5 Reasons to Use a Temporary Email Address Today",
                slug: "5-reasons-to-use-temporary-email",
                content: "<p>In an age of constant data breaches and overwhelming spam, protecting your primary email address has never been more important. A temporary, disposable email address acts as a shield, keeping your real inbox secure and clean. Here are five compelling reasons to start using one today.</p><h3>1. Avoid Spam and Unwanted Newsletters</h3><p>Signing up for services, promotions, or forums often leads to an endless barrage of marketing emails. Use a temporary address to register and keep your main inbox free from clutter.</p><h3>2. Protect Your Privacy</h3><p>Every time you share your real email, you're creating a link to your identity. A disposable address allows you to interact online with a greater degree of anonymity, protecting you from trackers and data brokers.</p><h3>3. Enhance Your Security</h3><p>Publicly visible email addresses are prime targets for phishing attempts and hacking. By using a temporary email for non-critical sign-ups, you reduce the risk of your real account being compromised.</p><h3>4. Test Services and Apps Safely</h3><p>As a developer or a curious user, you might want to test a new application without committing your personal data. A temporary email is the perfect tool for creating trial accounts safely.</p><h3>5. Secure Downloads and Access Content</h3><p>Many websites require an email address to download e-books, whitepapers, or access gated content. A disposable email grants you access without the long-term commitment or follow-up spam.</p>",
                excerpt: "Discover why using a disposable email is a crucial step towards better online privacy, security, and a cleaner inbox.",
                featuredImage: "https://images.unsplash.com/photo-1558522195-e1271d24294b?q=80&w=2070&auto=format&fit=crop",
                status: "published",
                authorId: "system",
                tags: ["privacy", "security", "email"],
                publishedAt: Timestamp.now(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            {
                title: "How Developers Can Supercharge Their Workflow with a Temp Mail API",
                slug: "temp-mail-api-for-developers",
                content: "<p>Automated testing and user simulation are critical parts of the modern development lifecycle. However, managing countless test email accounts can be a logistical nightmare. This is where a powerful temporary email API comes in, providing the tools to streamline your entire workflow.</p><h3>Automate User Registration Flows</h3><p>With a simple API call, you can generate a new email address on the fly for every test run of your sign-up process. This ensures a clean slate for every test, eliminating dependencies and flaky results from pre-existing user data.</p><h3>Programmatically Read Emails</h3><p>A good temp mail API doesn't just create addresses; it lets you read the emails sent to them. This is essential for testing email verification links, password resets, and welcome messages. You can programmatically fetch the content of an email, extract the necessary link or code, and complete your end-to-end test without any manual intervention.</p><h3>Integrate into CI/CD Pipelines</h3><p>Incorporate the API into your Continuous Integration/Continuous Deployment (CI/CD) pipelines to run fully automated integration tests on every commit, ensuring your authentication and communication systems are always working as expected.</p>",
                excerpt: "Streamline your development and testing cycles by integrating a robust temporary email API to automate user sign-ups and email verification.",
                featuredImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop",
                status: "published",
                authorId: "system",
                tags: ["api", "developers", "testing"],
                publishedAt: Timestamp.now(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            {
                title: "From Clutter to Clean: Reclaiming Your Primary Inbox",
                slug: "reclaiming-your-inbox",
                content: "<p>Is your primary inbox a battlefield of spam, promotions, and forgotten newsletters? It's a common problem, but one with a simple solution. By strategically using temporary email addresses, you can filter the noise and restore your inbox to a place of productivity and important communication.</p><h3>The Strategy: A Two-Inbox Approach</h3><p>Think of your digital life as having two doors. Your primary email is the private, VIP entrance reserved for trusted contacts: friends, family, work colleagues, and essential services like banking. Your temporary email address is the public entrance, used for everything else—one-time sign-ups, online shopping, forum discussions, and content downloads.</p><h3>Putting It Into Practice</h3><ol><li><strong>Identify Your Core Services:</strong> Make a list of the truly essential accounts linked to your primary email.</li><li><strong>Create a Disposable Address:</strong> Use a service like this one to generate a temporary email in seconds.</li><li><strong>Sign Up for Everything Else:</strong> Use your new temporary address for all non-essential online activities.</li><li><strong>Enjoy the Silence:</strong> Watch as your primary inbox becomes cleaner and more manageable, free from the daily flood of marketing messages.</li></ol><p>This simple habit change can have a profound impact on your digital well-being, reducing stress and increasing your focus on what truly matters.</p>",
                excerpt: "Tired of a cluttered inbox? Learn how a simple two-inbox strategy using a temporary email address can help you filter out spam and reclaim your focus.",
                featuredImage: "https://images.unsplash.com/photo-1588961376889-4148a4554b45?q=80&w=2070&auto.format&fit=crop",
                status: "published",
                authorId: "system",
                tags: ["productivity", "organization", "spam"],
                publishedAt: Timestamp.now(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
        ];

        const batch = firestore.batch();
        samplePosts.forEach(post => {
            const docRef = postsCollection.doc();
            batch.set(docRef, post);
        });
        await batch.commit();
        
        revalidatePath('/admin/blog');
        revalidatePath('/blog');
        revalidatePath('/');

        return { success: true, message: 'Sample posts created successfully.' };
    } catch (error: any) {
        console.error("Error creating sample posts:", error);
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
}
