import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
}

/**
 * SEO Component - Dynamically updates page meta tags for better SEO
 * Use this component on each page to set page-specific SEO metadata
 */
export function SEO({
  title = 'BookAgreed - Smart Scheduling Made Simple | Free Online Booking System',
  description = 'BookAgreed is a modern, free scheduling platform for professionals. Create booking pages, manage availability, automate reminders, and streamline your appointments.',
  keywords = 'scheduling software, appointment booking, calendar management, meeting scheduler, booking system, online scheduling',
  ogImage = 'https://bookagreed.vercel.app/og-image.png',
  ogType = 'website',
  canonicalPath,
}: SEOProps) {
  const location = useLocation();
  const canonicalUrl = canonicalPath 
    ? `https://bookagreed.vercel.app${canonicalPath}`
    : `https://bookagreed.vercel.app${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'twitter:title', title);
    updateMetaTag('property', 'twitter:description', description);
    updateMetaTag('property', 'twitter:image', ogImage);

    // Update canonical link
    updateCanonicalLink(canonicalUrl);
  }, [title, description, keywords, ogImage, ogType, canonicalUrl]);

  return null;
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(attribute: string, attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Helper function to update canonical link
 */
function updateCanonicalLink(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  
  link.href = url;
}

/**
 * Pre-defined SEO configurations for common pages
 */
export const SEO_CONFIGS = {
  home: {
    title: 'BookAgreed - Smart Scheduling Made Simple | Free Online Booking System',
    description: 'BookAgreed is a modern, free scheduling platform for professionals. Create booking pages, manage availability, automate reminders, and streamline your appointments. No credit card required.',
    keywords: 'scheduling software, appointment booking, calendar management, meeting scheduler, booking system, free calendly alternative, online scheduling app',
    canonicalPath: '/',
  },
  pricing: {
    title: 'Pricing Plans - BookAgreed | Free & Premium Scheduling Software',
    description: 'Choose the perfect plan for your scheduling needs. Start with our free plan or upgrade to Pro for advanced features. No credit card required for free plan.',
    keywords: 'scheduling software pricing, appointment booking cost, free calendly alternative, scheduling app plans, booking system pricing',
    canonicalPath: '/pricing',
  },
  features: {
    title: 'Features - BookAgreed | Powerful Scheduling Tools',
    description: 'Explore BookAgreed features: automated reminders, calendar integration, timezone support, custom booking pages, team scheduling, and more. Streamline your appointments today.',
    keywords: 'scheduling features, appointment booking features, calendar integration, automated reminders, timezone support, team scheduling',
    canonicalPath: '/features',
  },
  about: {
    title: 'About Us - BookAgreed | Our Story & Mission',
    description: 'Learn about BookAgreed mission to eliminate scheduling hassles. Founded in 2024, we help thousands of professionals save time and focus on what matters most.',
    keywords: 'about bookagreed, scheduling platform story, appointment booking company, professional scheduling tool',
    canonicalPath: '/about',
  },
  blog: {
    title: 'Blog - BookAgreed | Scheduling Tips & Productivity Insights',
    description: 'Discover scheduling best practices, productivity tips, and time management strategies. Learn how to optimize your calendar and boost efficiency.',
    keywords: 'scheduling tips, productivity blog, time management, appointment booking guide, calendar optimization, meeting efficiency',
    canonicalPath: '/blog',
  },
  helpCenter: {
    title: 'Help Center - BookAgreed | Support & Documentation',
    description: 'Get help with BookAgreed. Browse FAQs, guides, and tutorials for account setup, event types, availability, integrations, and troubleshooting.',
    keywords: 'bookagreed help, scheduling software support, appointment booking guide, calendar help center, booking system tutorial',
    canonicalPath: '/help-center',
  },
  contact: {
    title: 'Contact Us - BookAgreed | Get in Touch',
    description: 'Have questions? Contact BookAgreed support team. We typically respond within 24 hours on weekdays.',
    keywords: 'contact bookagreed, scheduling software support, appointment booking help, customer service',
    canonicalPath: '/contact',
  },
};
