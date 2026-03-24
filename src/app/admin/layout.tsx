export const dynamic = "force-dynamic";

import { Providers } from "@/components/layout/providers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </Providers>
  );
}
