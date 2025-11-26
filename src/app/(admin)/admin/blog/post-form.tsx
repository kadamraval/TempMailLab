
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { type BlogPost, blogPostSchema } from './types';
import { savePostAction } from '@/lib/actions/blog';


const formSchema = blogPostSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    authorId: true,
    publishedAt: true, // This field is handled by the server action
});

interface PostFormProps {
  post?: BlogPost | null;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featuredImage: '',
      status: 'draft',
      categoryId: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        ...post,
        tags: post.tags || [],
      });
    }
  }, [post, form]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    form.setValue('title', title);
    form.setValue('slug', slug);
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to save a post.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    
    const postDataWithAuthor = { ...values, authorId: user.uid };

    try {
        const result = await savePostAction(postDataWithAuthor, post?.id);

        if (result.error) {
            throw new Error(result.error);
        }

        toast({ title: "Success", description: `Post ${post ? 'updated' : 'created'} successfully.`});
        router.push('/admin/blog');
        router.refresh();

    } catch (error: any) {
        toast({ title: "Error Saving Post", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{post ? 'Edit Post' : 'Add New Post'}</CardTitle>
                <CardDescription>
                  {post ? 'Update the content for this blog post.' : 'Fill out the details to create a new blog post.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Post Title"
                          {...field}
                          onChange={handleTitleChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your blog post content here..."
                          rows={15}
                          {...field}
                        />
                      </FormControl>
                       <FormDescription>
                        You can use Markdown for formatting.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A short summary of the post..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                         <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="draft" />
                            </FormControl>
                            <FormLabel className="font-normal">Draft</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="published" />
                            </FormControl>
                            <FormLabel className="font-normal">Published</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="your-post-title" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL-friendly version of the title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
               <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {post ? 'Update Post' : 'Save Post'}
                  </Button>
               </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Organization</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">Category and tag management coming soon.</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
