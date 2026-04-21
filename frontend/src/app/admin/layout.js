"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Folder,
  Tag,
  ShoppingBag,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Folder },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin", label: "Reports", icon: LayoutDashboard },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user === null) return; // still loading from localStorage
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-gray-500">Checking access…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg p-4 lg:sticky lg:top-24">
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-4">
              <ArrowLeft size={16} /> Back to shop
            </Link>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${
                      active
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="lg:col-span-4">{children}</main>
      </div>
    </div>
  );
}
