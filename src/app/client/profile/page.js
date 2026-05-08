"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls via apiClient

export default function ClientProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    image: "/profile/profile.png",
    first_name: "",
    last_name: "",
    role: "client",
    email: "",
    username: "",
    phone_no: "",
    address: "",
    residentialAddress: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const normalizeProfile = useCallback((data) => ({
    image: data?.image || data?.profileImage || "/profile/profile.png",
    first_name: data?.first_name || data?.firstName || "",
    last_name: data?.last_name || data?.lastName || "",
    role: data?.role || "client",
    email: data?.email || "",
    username: data?.username || "",
    phone_no: data?.phone_no || data?.phoneNo || "",
    address: data?.address || data?.permanentAddress || "",
    residentialAddress: data?.residentialAddress || data?.address || "",
  }), []);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiClient.client.getProfile(user.id);
      if (data) {
        setProfile(normalizeProfile(data));
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [normalizeProfile, user]);

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    
    if (fromStorage) {
      queueMicrotask(() => {
        setUser(fromStorage);
      });
    } else {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      queueMicrotask(() => {
        loadProfile();
      });
    }
  }, [loadProfile, user]);

  const handleFieldChange = (field, value) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "address" && sameAddress) {
        updated.residentialAddress = value;
      }
      return updated;
    });
  };

  const handleSameAddress = (checked) => {
    setSameAddress(checked);
    if (checked) {
      setProfile((prev) => ({ ...prev, residentialAddress: prev.address }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const uploadImage = async () => {
      setImageUploading(true);
      try {
        const filenameBase = `${profile.username || user.email.split('@')[0]}_${profile.role || 'client'}`;
        const result = await apiClient.uploadProfileImage(file, filenameBase);
        const publicPath = result?.path || "/profile/profile.png";

        setPreviewImage(`${publicPath}?v=${Date.now()}`);
        setProfile((prev) => ({ ...prev, image: publicPath }));
      } catch (err) {
        console.error('Failed to upload profile image:', err);
        setPreviewImage(null);
        setProfile((prev) => ({ ...prev, image: "/profile/profile.png" }));
        alert('Image upload failed. Default profile image will be used.');
      } finally {
        setImageUploading(false);
      }
    };

    queueMicrotask(() => {
      void uploadImage();
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiClient.client.updateProfile(user.id, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        phone_no: profile.phone_no,
        address: profile.address,
        residentialAddress: profile.residentialAddress || profile.address,
        image: profile.image,
      });

      if (!data) throw new Error('Failed to update profile');

      await apiClient.client.createActivity({
        user_id: user.id,
        action: "update_profile",
        description: "User updated their profile information",
        source: "client",
      });

      // Update localStorage with new profile data so other components see the changes
      const updatedUser = {
        ...user,
        first_name: profile.first_name,
        last_name: profile.last_name,
        image: profile.image,
        username: profile.username,
        phone_no: profile.phone_no,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showNotification("Profile not updated", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile.email) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Icon icon="eos-icons:loading" width={40} className="text-blue-600 dark:text-cyan-400" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="rounded-full bg-linear-to-tr from-blue-600 to-cyan-400 p-1">
              <div className="relative h-30 w-30 overflow-hidden rounded-full border-4 border-white dark:border-slate-900">
                <Image
                  src={previewImage || profile.image}
                  alt="Profile avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              <Icon icon="solar:pen-2-linear" width={16} />
            </button>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {profile.first_name} {profile.last_name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="capitalize">{profile.role}</span>
            <Icon icon="solar:verified-check-line-duotone" width={18} className="text-blue-500" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {isEditing && (
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="profile-image" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Upload Profile Image
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700 dark:border-slate-700 dark:file:bg-cyan-400 dark:file:text-slate-950 dark:hover:file:bg-cyan-300"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recommended: Square image, max 2MB. File will be stored as: <b>{profile.username || 'user'}_{profile.role || 'client'}</b>
              </p>
              {imageUploading && (
                <p className="text-xs text-blue-600 dark:text-cyan-300">Uploading profile image...</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">First Name</label>
            <input
              type="text"
              value={profile.first_name ?? ""}
              onChange={(e) => handleFieldChange("first_name", e.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Last Name</label>
            <input
              type="text"
              value={profile.last_name ?? ""}
              onChange={(e) => handleFieldChange("last_name", e.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email (Read-only)</label>
            <input
              type="email"
              value={profile.email ?? ""}
              disabled
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none opacity-70 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Username</label>
            <input
              type="text"
              value={profile.username ?? ""}
              onChange={(e) => handleFieldChange("username", e.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</label>
            <input
              type="text"
              value={profile.phone_no ?? ""}
              onChange={(e) => handleFieldChange("phone_no", e.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
            <textarea
              rows={3}
              value={profile.address ?? ""}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={(e) => handleSameAddress(e.target.checked)}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900"
              />
              Residential address is same as address above
            </label>
          </div>

          {!sameAddress && (
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Residential Address</label>
              <textarea
                rows={3}
                value={profile.residentialAddress ?? ""}
                onChange={(e) => handleFieldChange("residentialAddress", e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={() => { setIsEditing(false); setPreviewImage(null); loadProfile(); }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
          >
            {loading ? (
              <Icon icon="eos-icons:loading" width={18} />
            ) : (
              <Icon icon={isEditing ? "solar:diskette-linear" : "solar:pen-new-square-linear"} width={18} />
            )}
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>
      </div>

      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`relative rounded-2xl px-8 py-8 shadow-2xl backdrop-blur-sm pointer-events-auto min-w-72 ${
            notification.type === 'success'
              ? 'bg-green-500/95 text-white'
              : 'bg-red-500/95 text-white'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setNotification(null)}
              className="absolute top-3 right-3 p-1 hover:opacity-80 transition"
              aria-label="Close notification"
            >
              <Icon icon="solar:close-circle-bold" width={24} />
            </button>

            {/* Content - Centered */}
            <div className="flex flex-col items-center gap-4">
              {/* Animated Tick Icon */}
              <Icon 
                icon={notification.type === 'success' ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                width={48}
                className={notification.type === 'success' ? 'animate-bounce' : ''}
              />
              
              <p className="font-semibold text-center text-lg">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

