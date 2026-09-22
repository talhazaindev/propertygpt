"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  BookOpen, Tag, Clock, User, ArrowLeft, Share2
} from "lucide-react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  images: string[];
  tags: string[];
  createdAt: string;
  publishedAt: string | null;
  author: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blog
  useEffect(() => {
    const fetchBlog = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/blogs/${params.slug}`);
        
        if (response.status === 404) {
          router.push("/blogs");
          return;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch blog");
        }
        
        const data = await response.json();
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load blog. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [params.slug, router]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Share article
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        text: blog?.summary,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-6"></div>
        <div className="h-64 bg-slate-200 rounded-lg mb-8"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3 mb-8"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6 mb-3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <Link href="/blogs" className="mt-2 inline-flex items-center text-sm text-red-700 hover:underline">
                <ArrowLeft size={16} className="mr-1" /> Return to blogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <main className="bg-slate-50 min-h-screen pt-20">
      {/* Hero Image */}
      <div className="w-full h-64 md:h-96 relative bg-gradient-to-r from-primary to-secondary">
        {blog.coverImage ? (
          <Image
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            fill
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={80} className="text-white/40" />
          </div>
        )}
      </div>
      
      {/* Blog Content */}
      <article className="max-w-4xl mx-auto px-4 py-12 bg-white -mt-10 rounded-t-3xl shadow-sm">
        {/* Back to blogs link */}
        <Link
          href="/blogs"
          className="inline-flex items-center text-sm text-secondary hover:text-primary transition-colors duration-200 mb-8 group"
        >
          <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform duration-200" /> Back to all blogs
        </Link>
        
        {/* Article header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            {/* Author */}
            <div className="flex items-center">
              {blog.author?.image ? (
                <div className="flex-shrink-0 h-10 w-10 relative">
                  <Image
                    src={blog.author.image}
                    alt={blog.author.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                    width={40}
                    height={40}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <User size={18} className="text-secondary" />
                </div>
              )}
              <div className="ml-3">
                <p className="font-medium text-gray-900">{blog.author?.name || "Manzil By AlWahabCo Team"}</p>
              </div>
            </div>
            
            {/* Date */}
            <div className="flex items-center">
              <Clock size={16} className="mr-1 text-secondary/70" />
              {blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)}
            </div>
            
            {/* Share button */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 ml-auto text-secondary hover:text-primary transition-colors duration-200 group"
            >
              <Share2 size={16} className="group-hover:rotate-12 transition-transform duration-200" />
              <span>Share</span>
            </button>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {blog.tags.map((tag) => (
              <Link 
                key={tag}
                href={`/blogs?tag=${tag}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-light/50 text-secondary hover:bg-secondary-light transition-colors duration-200"
              >
                <Tag size={14} className="mr-1" />
                {tag}
              </Link>
            ))}
          </div>
          
          {/* Summary */}
          <div className="text-xl text-gray-600 border-l-4 border-primary pl-4 py-2 italic bg-primary-light/10">
            {blog.summary}
          </div>
        </header>
        
        {/* Article content */}
        <div className="prose prose-lg max-w-none prose-headings:text-secondary prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </div>
        
        {/* Additional images */}
        {blog.images && blog.images.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blog.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Image
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-auto"
                    width={500}
                    height={300}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Author bio */}
        {blog.author && (
          <div className="mt-16 p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-start gap-4">
              {blog.author.image ? (
                <div className="flex-shrink-0 h-16 w-16 relative">
                  <Image
                    src={blog.author.image}
                    alt={blog.author.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                    width={64}
                    height={64}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center">
                  <User size={24} className="text-secondary" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{blog.author.name}</h3>
                <p className="text-gray-600 mt-1">
                  Property expert and content creator at Manzil By AlWahabCo.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Back to blogs button */}
        <div className="mt-16 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all duration-300 group"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" /> 
            Back to all blogs
          </Link>
        </div>
      </article>
    </main>
  );
} 