"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Home,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Bangladesh",
  is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // address object when editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const fetched = useRef(false);

  const fetchAddresses = () => {
    api
      .get("/addresses")
      .then((r) => setAddresses(r.data.data || []))
      .catch(() => toast.error("Failed to load addresses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (address) => {
    setEditTarget(address);
    setForm({
      label: address.label || "Home",
      recipient_name: address.recipient_name || "",
      phone: address.phone || "",
      address_line: address.address_line || "",
      city: address.city || "",
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country || "Bangladesh",
      is_default: !!address.is_default,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipient_name.trim() || !form.address_line.trim() || !form.city.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/addresses/${editTarget.id}`, form);
        toast.success("Address updated");
      } else {
        await api.post("/addresses", form);
        toast.success("Address added");
      }
      closeModal();
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this address?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/addresses/${id}`);
      toast.success("Address deleted");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await api.patch(`/addresses/${id}/default`);
      toast.success("Default address updated");
      fetchAddresses();
    } catch {
      toast.error("Failed to set default");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const LabelIcon = ({ label }) => {
    if (label === "Work") return <Briefcase size={16} className="text-blue-400" />;
    return <Home size={16} style={{ color: "var(--primary)" }} />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin size={26} style={{ color: "var(--primary)" }} />
          <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          Add New Address
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-36 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center">
          <MapPin size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No addresses saved</h2>
          <p className="text-gray-500 mb-6">Add your delivery addresses to speed up checkout.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            <Plus size={18} />
            Add First Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-xl p-5 border-2 transition ${
                address.is_default ? "border-orange-400" : "border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <LabelIcon label={address.label} />
                    <span className="font-semibold text-gray-800">{address.label || "Home"}</span>
                    {address.is_default && (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        <CheckCircle size={11} />
                        Default
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-gray-900">{address.recipient_name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {address.address_line}
                    {address.city && `, ${address.city}`}
                    {address.state && `, ${address.state}`}
                    {address.postal_code && ` ${address.postal_code}`}
                  </p>
                  <p className="text-sm text-gray-600">{address.country}</p>
                  {address.phone && (
                    <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={settingDefaultId === address.id}
                      className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      {settingDefaultId === address.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Star size={13} />
                      )}
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(address)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deletingId === address.id}
                    className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    {deletingId === address.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editTarget ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, label: l }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        form.label === l
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="recipient_name"
                  value={form.recipient_name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+880..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                />
              </div>

              {/* Address Line */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address_line"
                  value={form.address_line}
                  onChange={handleChange}
                  placeholder="House, Road, Area"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  required
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Dhaka"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Dhaka Division"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Postal Code & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    placeholder="1200"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Bangladesh"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Default */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={form.is_default}
                  onChange={handleChange}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editTarget ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
