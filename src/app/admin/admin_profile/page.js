"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls via apiClient

export default function AdminProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    image: "/profile/profile.png",
    firstName: "Admin",
    lastName: "User",
    name: "Admin User",
    role: "Administrator",
    email: "",
    username: "",
    phone: "",
    permanentAddress: "",
    residentialAddress: "",
  });
  const [sameAddress, setSameAddress] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const normalizeProfile = useCallback((data) => ({
    firstName: data?.first_name || data?.firstName || '',
    lastName: data?.last_name || data?.lastName || '',
    name: `${data?.first_name || data?.firstName || ''} ${data?.last_name || data?.lastName || ''}`.trim() || 'Admin User',
    email: data?.email || '',
    username: data?.username || '',
    phone: data?.phone_no || data?.phoneNo || '',
    permanentAddress: data?.address || data?.permanentAddress || '',
    residentialAddress: data?.address || data?.residentialAddress || '',
    role: (data?.role || 'Administrator').toUpperCase(),
    image: data?.image || data?.profileImage || "/profile/profile.png",
  }), []);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch the current user data from admin endpoint to get fresh profile data
      const allUsers = await apiClient.admin.getUsers();
      const currentUser = allUsers?.find((u) => u.id === user.id);
      if (currentUser) {
        setProfile(normalizeProfile(currentUser));
      } else {
        // Fallback to localStorage if not found in admin list
        setProfile(normalizeProfile(user));
      }
    } catch (err) {
      console.error("Failed to load admin profile:", err);
      // Fallback to user from localStorage
      setProfile(normalizeProfile(user));
    } finally {
      setLoading(false);
    }
  }, [user, normalizeProfile]);

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

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        username: profile.username,
        phone_no: profile.phone,
        address: profile.permanentAddress,
        image: profile.image,
      };

      const data = await apiClient.admin.updateUser(user.id, updates);
      if (!data) throw new Error('Failed to update admin');

      await apiClient.admin.createActivity({
        user_id: user.id,
        action: "update_profile",
        description: "Updated admin profile details",
        source: "admin",
      });

      // Reload the profile from the database to ensure UI shows what was saved
      const allUsers = await apiClient.admin.getUsers();
      const updatedUserData = allUsers?.find((u) => u.id === user.id);

      if (updatedUserData) {
        // Update both state and localStorage with fresh data from database
        setProfile(normalizeProfile(updatedUserData));
        const updatedUser = {
          ...user,
          first_name: updatedUserData.firstName || updatedUserData.first_name,
          last_name: updatedUserData.lastName || updatedUserData.last_name,
          name: `${updatedUserData.firstName || updatedUserData.first_name || ''} ${updatedUserData.lastName || updatedUserData.last_name || ''}`.trim() || 'Admin User',
          image: updatedUserData.profileImage || updatedUserData.image,
          username: updatedUserData.username,
          phone_no: updatedUserData.phoneNo || updatedUserData.phone_no,
          email: updatedUserData.email,
          role: updatedUserData.role,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setIsEditing(false);
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Save profile error:", err);
      showNotification("Profile not updated", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "firstName" || field === "lastName") {
        updated.name = `${field === "firstName" ? value : prev.firstName || ""} ${field === "lastName" ? value : prev.lastName || ""}`.trim() || "Admin User";
      }
      if (field === "permanentAddress" && sameAddress) {
        updated.residentialAddress = value;
      }
      return updated;
    });
  };

  const handleSameAddress = (checked) => {
    setSameAddress(checked);
    if (checked) {
      setProfile((prev) => ({ ...prev, residentialAddress: prev.permanentAddress }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadImage = async () => {
      setImageUploading(true);
      try {
        const filenameBase = `${profile.username || 'admin'}_admin`;
        const result = await apiClient.uploadProfileImage(file, filenameBase);
        const publicPath = result?.path || "/profile/profile.png";

        await apiClient.admin.updateUser(user.id, { image: publicPath });

        setPreviewImage(`${publicPath}?v=${Date.now()}`);
        setProfile((prev) => ({ ...prev, image: publicPath }));

        // Reload profile to ensure the image path is correct in the database
        await loadProfile();
        
        const updatedUser = {
          ...user,
          image: publicPath,
          name: `${profile.firstName} ${profile.lastName}`.trim() || 'Admin User',
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showNotification("Profile image updated successfully!", "success");
      } catch (err) {
        console.error('Failed to upload admin profile image:', err);
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
              aria-label="Toggle edit profile"
              className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              <Icon icon="solar:pen-2-linear" width={16} />
            </button>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>{profile.role}</span>
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
                Image preview updates immediately. File will be stored as: <b>{profile.username || 'admin'}_admin</b>
              </p>
              {imageUploading && (
                <p className="text-xs text-blue-600 dark:text-cyan-300">Uploading profile image...</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="first-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">First Name</label>
            <input
              id="first-name"
              type="text"
              value={profile.firstName ?? ""}
              onChange={(event) => handleFieldChange("firstName", event.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="last-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">Last Name</label>
            <input
              id="last-name"
              type="text"
              value={profile.lastName ?? ""}
              onChange={(event) => handleFieldChange("lastName", event.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              id="email"
              type="email"
              value={profile.email ?? ""}
              onChange={(event) => handleFieldChange("email", event.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200">Username</label>
            <input
              id="username"
              type="text"
              value={profile.username ?? ""}
              onChange={(event) => handleFieldChange("username", event.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</label>
            <input
              id="phone"
              type="text"
              value={profile.phone ?? ""}
              onChange={(event) => handleFieldChange("phone", event.target.value)}
              disabled={!isEditing}
              className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="permanent-address" className="text-sm font-medium text-slate-700 dark:text-slate-200">Permanent Address</label>
            <textarea
              id="permanent-address"
              rows={3}
              value={profile.permanentAddress ?? ""}
              onChange={(event) => handleFieldChange("permanentAddress", event.target.value)}
              disabled={!isEditing}
              className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={(event) => handleSameAddress(event.target.checked)}
                disabled={!isEditing}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900"
              />
              Permanent and residential address are same
            </label>
          </div>

          {!sameAddress && (
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="residential-address" className="text-sm font-medium text-slate-700 dark:text-slate-200">Residential Address</label>
              <textarea
                id="residential-address"
                rows={3}
                value={profile.residentialAddress ?? ""}
                onChange={(event) => handleFieldChange("residentialAddress", event.target.value)}
                disabled={!isEditing}
                className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
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
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950 disabled:opacity-50"
          >
            {loading ? (
              <Icon icon="eos-icons:loading" width={18} />
            ) : (
              <Icon icon={isEditing ? "solar:diskette-linear" : "solar:pen-new-square-linear"} width={18} />
            )}
            {loading ? "Processing..." : (isEditing ? "Save Changes" : "Edit Profile")}
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
              <p className="font-semibold text-center text-lg">{notification.message}</p>
              
              {/* Animated Tick Icon */}
              <Icon 
                icon={notification.type === 'success' ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                width={48}
                className={notification.type === 'success' ? 'animate-bounce' : ''}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
