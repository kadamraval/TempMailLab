
"use client";
import imageData from '@/app/lib/placeholder-images.json';

// This file contains the default content for the application's sections.
// When an admin edits a section for the first time, this data is loaded
// into the editor and then saved to Firestore. Subsequent edits will
// load the data from Firestore.

// Data for UseCasesSection
export const useCases = [
  {
    iconName: "ShieldCheck",
    title: "Sign-Up Anonymously",
    description: "Register for sites and apps without exposing your real email.",
  },
  {
    iconName: "UserCheck",
    title: "Protect Your Privacy",
    description: "Use a temporary address for forums, newsletters, and social media.",
  },
  {
    iconName: "FileDown",
    title: "Secure Downloads",
    description: "Download resources without providing your real contact info.",
  },
  {
    iconName: "TestTube2",
    title: "Developer & QA Testing",
    description: "Quickly generate addresses for user registration and app testing.",
  },
];

// Data for FeaturesSection
export const features = [
  {
    "iconName": "Zap",
    "title": "Instant Setups",
    "description": "Generate a new email address with a single click. No registration required."
  },
  {
    "iconName": "ShieldCheck",
    "title": "Total Privacy",
    "description": "Keep your primary inbox clean from spam and marketing lists."
  },
  {
    "iconName": "Trash2",
    "title": "Auto-Deletion",
    "description": "All emails are automatically and permanently deleted after a set time."
  },
  {
    "iconName": "Globe",
    "title": "Custom Domains",
    "description": "Connect your own domain to generate branded temporary email addresses."
  },
  {
    "iconName": "Forward",
    "title": "Email Forwarding",
    "description": "Automatically forward incoming temporary emails to a real, verified email address."
  },
  {
    "iconName": "Code",
    "title": "Developer API",
    "description": "Integrate our temporary email service directly into your applications."
  }
];

// Data for FaqSection
export const faqs = [
    {
        question: "Why use a temporary email?",
        answer: "It's perfect for any situation where you don't want to give out your real email. This includes signing up for websites, downloading files, or avoiding marketing lists. It keeps your primary inbox clean from spam and protects your privacy."
    },
    {
        question: "How long do inboxes last?",
        answer: "For our free service, inboxes expire after 10 minutes. Our Premium plan offers extended lifetimes, including inboxes that last up to 24 hours, giving you more time to receive important messages."
    },
    {
        question: "Can I use my own domain?",
        answer: "Yes! With our Premium plan, you can connect your own domain names to generate temporary email addresses. This is great for developers, QA testers, or businesses who want branded, disposable email addresses."
    },
    {
        question: "Are my emails secure?",
        answer: "We prioritize your privacy. Once an inbox expires, all associated emails are permanently deleted from our servers. We use secure connections (SSL) to protect your data in transit."
    },
    {
        question: "What's the premium plan?",
        answer: "The Premium plan unlocks powerful features like unlimited inboxes, longer email retention, custom domains, email forwarding, API access, and an ad-free experience."
    },
    {
        question: "Can I recover an expired inbox?",
        answer: "No, once an inbox expires, it and all of its contents are permanently and irretrievably deleted to ensure user privacy. If you need longer-lasting inboxes, please consider our Premium plan."
    }
];

// Data for ComparisonSection
export const comparisonFeatures = [
    { feature: "Instant Address Generation", tempmailoz: true, others: true },
    { feature: "No Registration Required", tempmailoz: true, others: true },
    { feature: "Automatic Email Deletion", tempmailoz: true, others: false },
    { feature: "Ad-Free Experience", tempmailoz: true, others: false },
    { feature: "Custom Domain Names", tempmailoz: true, others: false },
    { feature: "Developer API Access", tempmailoz: true, others: false },
    { feature: "Email Forwarding", tempmailoz: true, others: false },
    { feature: "Secure Password Protection", tempmailoz: true, others: false },
];

// Data for Testimonials
export const testimonials = [
  {
    quote: "This is a game-changer for signing up for new services without worrying about spam. Super simple and effective.",
    name: "Alex Johnson",
    title: "Developer",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    quote: "As a QA tester, I generate dozens of test accounts daily. The API and custom domain features have saved me countless hours.",
    name: "Sarah Miller",
    title: "QA Engineer",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    quote: "Finally, a temporary email service that looks and feels professional. The interface is clean, and it just works.",
    name: "Michael Chen",
    title: "UX Designer",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    quote: "I love the peace of mind. I can download free resources or join newsletters without flooding my personal email.",
    name: "Emily Rodriguez",
    title: "Marketing Manager",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    quote: "The Pro plan is worth every penny. The team access and developer API are essential for our workflow.",
    name: "David Lee",
    title: "CTO, Tech Startup",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
];

// Data for ExclusiveFeatures
export const exclusiveFeatures = [
    {
      iconName: "KeyRound",
      title: "Password Protection",
      description: "Secure your temporary inboxes with a unique password, ensuring only you can access the contents.",
      image: imageData.exclusiveFeatures[0]
    },
    {
      iconName: "Users",
      title: "Team Member Access",
      description: "Invite your team to share plan features. Perfect for development teams and QA testing environments.",
      image: imageData.exclusiveFeatures[1]
    },
    {
      iconName: "BarChart",
      title: "Advanced Analytics",
      description: "Access a detailed dashboard to monitor your temporary email usage, track statistics, and gain insights.",
      image: imageData.exclusiveFeatures[2]
    },
];

// Data for BlogSection
export const blogPosts = [
  {
    title: "Why You Should Use a Temporary Email Address",
    description: "Learn how a temporary email can protect your privacy and keep your main inbox clean from spam and unwanted newsletters.",
    image: "https://picsum.photos/seed/blog1/600/400",
    link: "/blog/why-use-temp-mail",
    date: "May 20, 2024",
  },
  {
    title: "Top 5 Use Cases for Developers & QA Testers",
    description: "Discover how disposable emails can streamline your development workflow, from user registration testing to API integration.",
    image: "https://picsum.photos/seed/blog2/600/400",
    link: "/blog/use-cases-for-devs",
    date: "May 15, 2024",
  },
  {
    title: "Our New Feature: Custom Domains for Premium Users",
    description: "We're excited to announce that you can now bring your own domain to generate branded temporary email addresses.",
    image: "https://picsum.photos/seed/blog3/600/400",
    link: "/blog/custom-domains-feature",
    date: "May 10, 2024",
  },
];
