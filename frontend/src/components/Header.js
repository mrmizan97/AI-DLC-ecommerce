"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ShoppingCart, User, LogOut, Package, Menu, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore((state) => state.totalItems());
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white text-2xl font-bold whitespace-nowrap">
            AI-DLC
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
            <div className="relative flex">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for products, brands, categories..."
                className="flex-1 px-4 py-2 rounded-l bg-white text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-dark hover:bg-orange-700 text-white px-5 rounded-r flex items-center"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          <nav className="hidden md:flex items-center gap-4 text-white">
            <Link href="/cart" className="relative flex items-center gap-1 hover:opacity-80">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1 hover:opacity-80">
                  <User size={22} />
                  <span className="hidden lg:inline">{user.name}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded shadow-lg w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                    <User size={16} /> Profile
                  </Link>
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                    <Package size={16} /> My Orders
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-primary">
                      <LayoutDashboard size={16} /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="hover:opacity-80">
                  Login
                </Link>
                <Link href="/register" className="hover:opacity-80">
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={24} />
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden mt-3 flex flex-col gap-2 text-white pb-2">
            <Link href="/cart" className="py-2">Cart ({cartCount})</Link>
            {user ? (
              <>
                <Link href="/profile" className="py-2">Profile</Link>
                <Link href="/orders" className="py-2">My Orders</Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="py-2 font-medium">Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="text-left py-2">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-2">Login</Link>
                <Link href="/register" className="py-2">Sign Up</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
