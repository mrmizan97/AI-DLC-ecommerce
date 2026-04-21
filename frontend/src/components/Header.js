"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart, User, LogOut, Package, Menu, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import NotificationBell from "@/components/NotificationBell";
import { getProfilePhoto } from "@/lib/media";
import api from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const cartCount = useCartStore((state) => state.totalItems());
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const fetchedProfileFor = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (fetchedProfileFor.current === user.id) return;
    fetchedProfileFor.current = user.id;
    api
      .get("/auth/profile")
      .then((r) => updateUser(r.data.data))
      .catch(() => {});
  }, [user?.id, updateUser]);

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

            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80"
                >
                  {getProfilePhoto(user) ? (
                    <img
                      src={getProfilePhoto(user)}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/50"
                    />
                  ) : (
                    <User size={22} />
                  )}
                  <span className="hidden lg:inline">{user.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded shadow-xl w-48 z-50 overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                    >
                      <User size={16} /> Profile
                    </Link>
                    {user.role !== "admin" && (
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      >
                        <Package size={16} /> My Orders
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link
                        href="/admin/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-primary font-medium"
                      >
                        <LayoutDashboard size={16} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
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
                {user.role !== "admin" && (
                  <Link href="/orders" className="py-2">My Orders</Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin/orders" className="py-2 font-medium">Admin Panel</Link>
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
