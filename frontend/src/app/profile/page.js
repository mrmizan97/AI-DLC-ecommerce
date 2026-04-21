"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import MediaUploader from "@/components/MediaUploader";
import { getProfilePhoto } from "@/lib/media";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  const refetch = () => {
    api.get("/auth/profile").then((r) => setProfile(r.data.data));
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;
    api
      .get("/auth/profile")
      .then((r) => setProfile(r.data.data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;
  if (loading) return <div className="max-w-3xl mx-auto p-8"><div className="bg-white h-64 rounded animate-pulse" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center text-3xl font-bold">
            {getProfilePhoto(profile) ? (
              <img src={getProfilePhoto(profile)} alt={profile?.name} className="w-full h-full object-cover" />
            ) : (
              profile?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
            <p className="text-gray-500 capitalize">{profile?.role}</p>
          </div>
        </div>

        {profile?.id && (
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-medium text-gray-900 mb-2">Profile Photo</h3>
            <MediaUploader
              mediable_type="User"
              mediable_id={profile.id}
              collection="profile"
              items={(profile.media || []).filter((m) => m.collection === "profile")}
              onChange={refetch}
              label="Change photo"
            />
          </div>
        )}

        <div className="space-y-4">
          <InfoRow icon={<User size={18} />} label="Name" value={profile?.name} />
          <InfoRow icon={<Mail size={18} />} label="Email" value={profile?.email} />
          <InfoRow icon={<Phone size={18} />} label="Phone" value={profile?.phone || "Not set"} />
          <InfoRow icon={<Shield size={18} />} label="Role" value={profile?.role} className="capitalize" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, className = "" }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-medium text-gray-900 ${className}`}>{value}</p>
      </div>
    </div>
  );
}
