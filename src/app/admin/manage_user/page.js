"use client";

import { useCallback, useEffect, useState } from "react";
// Database operations use API calls instead
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

function statusClasses(status) {
  const s = status?.toLowerCase();
  if (s === "active" || s === "client" || s === "admin") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (s === "pending") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300";
  }
  return "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300";
}

export default function AdminManageUserPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [editForm, setEditForm] = useState({
    id: "",
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_no: "",
    role: "client",
    image: "",
    address: "",
    residentialAddress: "",
    password: "",
  });

  const toRow = (u) => ({
    id: u.id,
    first_name: u.firstName || "",
    last_name: u.lastName || "",
    username: u.username || "",
    email: u.email || "",
    phone_no: u.phoneNo || "",
    role: u.role || "client",
    image: u.profileImage || "",
    address: u.permanentAddress || "",
    residentialAddress: u.residentialAddress || u.permanentAddress || "",
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unknown User",
    status: (u.role || "client").toUpperCase(),
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getUsers();
      setUsers((data || []).map(toRow));
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    if (fromStorage) {
      queueMicrotask(() => {
        setCurrentUser(fromStorage);
      });
    } else {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      queueMicrotask(() => {
        loadUsers();
      });
    }
  }, [loadUsers, currentUser]);

  const handleDelete = async (userId, userName) => {
    if (currentUser?.id === userId) return;
    if (!window.confirm(`Are you sure you want to delete user ${userName}?`)) return;
    setLoading(true);
    try {
      await apiClient.admin.deleteUser(userId);

      await apiClient.admin.createActivity({
        user_id: currentUser.id,
        action: "delete_user",
        description: `Deleted user: ${userName}`,
        source: "admin",
      });

      loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    const form = {
      id: user.id,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      email: user.email || "",
      phone_no: user.phone_no || "",
      role: (user.role || "client").toLowerCase(),
      image: user.image || "",
      address: user.address || "",
      residentialAddress: user.residentialAddress || user.address || "",
      password: "",
    };
    setEditForm(form);
    setSameAddress((form.residentialAddress || "") === (form.address || ""));
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "address" && sameAddress) {
        next.residentialAddress = value;
      }
      return next;
    });
  };

  const handleSameAddress = (checked) => {
    setSameAddress(checked);
    if (checked) {
      setEditForm((prev) => ({ ...prev, residentialAddress: prev.address }));
    }
  };

  const handleSave = async () => {
    if (!editForm.id || !currentUser?.id) return;
    setSaving(true);
    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        username: editForm.username,
        email: editForm.email,
        phone_no: editForm.phone_no,
        role: editForm.role,
        image: editForm.image,
        address: editForm.address,
        residentialAddress: editForm.residentialAddress || editForm.address,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await apiClient.admin.updateUser(editForm.id, payload);
      await apiClient.admin.createActivity({
        user_id: currentUser.id,
        action: "update_user",
        description: `Updated user: ${editForm.email}`,
        source: "admin",
      });

      closeEditModal();
      await loadUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const usernamePart = (editForm.username || "user").trim().toLowerCase();
      const rolePart = (editForm.role || "client").trim().toLowerCase();
      const filenameBase = `${usernamePart}_${rolePart}`;
      const result = await apiClient.uploadProfileImage(file, filenameBase);
      const publicPath = result?.path || "";
      if (publicPath) {
        setEditForm((prev) => ({ ...prev, image: publicPath }));
      }
    } catch (err) {
      console.error("Failed to upload profile image:", err);
      alert("Image upload failed. Please try another image.");
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage User</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">View user details and manage account actions.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/70">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-200">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-200">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-200">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-200">Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        aria-label={`Edit ${user.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path strokeDasharray="44" strokeDashoffset="44" d="M7 17v-4l10 -10l4 4l-10 10h-4"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.3s" dur="0.5s" to="0"/></path><path strokeDasharray="20" d="M3 21h18"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="20;0"/></path><path strokeDasharray="8" strokeDashoffset="8" d="M14 6l4 4"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.8s" dur="0.2s" to="0"/></path></g></svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={loading || currentUser?.id === user.id}
                        aria-label={`Delete ${user.name}`}
                        title={currentUser?.id === user.id ? "You cannot delete your own account while logged in." : `Delete ${user.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-rose-500 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-400 dark:hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" fillRule="evenodd" d="m6.774 6.4l.812 13.648a.8.8 0 0 0 .798.752h7.232a.8.8 0 0 0 .798-.752L17.226 6.4h1.203l-.817 13.719A2 2 0 0 1 15.616 22H8.384a2 2 0 0 1-1.996-1.881L5.571 6.4zM9.5 9h1.2l.5 9H10zm3.8 0h1.2l-.5 9h-1.2zM4.459 2.353l15.757 2.778a.5.5 0 0 1 .406.58L20.5 6.4L3.758 3.448l.122-.69a.5.5 0 0 1 .579-.405m6.29-1.125l3.94.695a.5.5 0 0 1 .406.58l-.122.689l-4.924-.869l.122-.689a.5.5 0 0 1 .579-.406z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit User Profile</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">First Name</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => handleFieldChange("first_name", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Last Name</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => handleFieldChange("last_name", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => handleFieldChange("username", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone_no}
                  onChange={(e) => handleFieldChange("phone_no", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleFieldChange("role", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                >
                  <option value="client">Client</option>
                  <option value="doctor">Doctor</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Upload Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700 dark:border-slate-700 dark:file:bg-cyan-400 dark:file:text-slate-950 dark:hover:file:bg-cyan-300"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current image: {editForm.image || "No image uploaded"}
                </p>
                {imageUploading && (
                  <p className="text-xs text-blue-600 dark:text-cyan-300">Uploading profile image...</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
                <textarea
                  rows={3}
                  value={editForm.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => handleSameAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                  Residential address is same as address above
                </label>
              </div>

              {!sameAddress && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Residential Address</label>
                  <textarea
                    rows={3}
                    value={editForm.residentialAddress}
                    onChange={(e) => handleFieldChange("residentialAddress", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                  />
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password (optional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
