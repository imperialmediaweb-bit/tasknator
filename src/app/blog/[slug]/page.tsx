import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Zap, Clock, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { marked } from "marked";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await db.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — Tasknator Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await db.blogPost.findUnique({
    where: { slug: params.slug, published: true },
  });

  if (!post) notFound();

  const htmlContent = marked(post.content);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Tasknator</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            {post.category}
          </span>
          {post.publishedAt && (
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">{post.excerpt}</p>

        <div className="flex items-center gap-3 mb-10 pb-10 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            {post.authorName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{post.authorName}</div>
            <div className="text-xs text-gray-500">Tasknator</div>
          </div>
        </div>

        <div
          className="prose prose-gray max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to fix your business?</h3>
          <p className="text-gray-600 mb-6">Run a free AI audit and get your personalized repair plan in minutes.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Free Audit <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Tasknator</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
