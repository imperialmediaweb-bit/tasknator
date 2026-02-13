import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { ArrowLeft, Zap } from "lucide-react";
import { getSiteBranding } from "@/lib/branding";

export default async function CustomPageView({ params }: { params: { slug: string } }) {
  const page = await db.customPage.findUnique({
    where: { slug: params.slug },
  });

  if (!page || !page.published) notFound();

  const htmlContent = marked(page.content);

  // Load header/footer menus + branding
  const [menuItems, branding] = await Promise.all([
    db.menuItem.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    getSiteBranding(),
  ]);
  const headerItems = menuItems.filter(i => i.location === "HEADER");
  const footerItems = menuItems.filter(i => i.location === "FOOTER");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.siteName} className="h-8 max-w-[180px] object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">{branding.siteName}</span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-6">
            {headerItems.map(item => (
              <Link key={item.id} href={item.href} target={item.openNew ? "_blank" : undefined} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{page.title}</h1>

        <div
          className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Tasknator</span>
          <div className="flex items-center gap-4">
            {footerItems.map(item => (
              <Link key={item.id} href={item.href} target={item.openNew ? "_blank" : undefined} className="text-sm text-gray-400 hover:text-gray-600">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
