"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// --- helpers ---
const joinUrl = (...parts) =>
  parts
    .map((p) => String(p ?? "").replace(/(^\/+|\/+$)/g, ""))
    .filter(Boolean)
    .join("/");
const resolveAccountsBase = (raw) => {
  const root = String(raw || "http://127.0.0.1:8000").replace(/\/+$/, "");
  return root.includes("/api/accounts") ? root : `${root}/api/accounts`;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  // form state
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [emailAdd, setEmailAdd] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(""); // current photo URL from server
  const [file, setFile] = useState(null); // new file
  const fileInputRef = useRef(null);

  // ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // derive initial user id (from route /localStorage/?uid=)
  const params = useParams();
  const pathname = usePathname();
  useEffect(() => {
    let uid = null;
    // 1) dynamic segment: /home/profile/[userId]/settings
    if (params?.userId) {
      uid = Number(params.userId) || null;
    }
    // 2) pathname fallback (in case params is unavailable for any reason)
    if (!uid && pathname) {
      const m = pathname.match(/\/profile\/(\d+)/i);
      if (m) uid = Number(m[1]) || null;
    }
    // 3) localStorage
    if (!uid) {
      try {
        uid = Number(localStorage.getItem("expair_user_id") || "") || null;
      } catch {}
    }
    // 4) ?uid= query
    if (!uid && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      uid = Number(sp.get("uid") || "") || null;
    }
    setUserId(uid);
  }, [params, pathname]);

  // load current profile
  useEffect(() => {
  if (userId == null) return; // ← avoid the initial /me/ 401 until we know the id

  const run = async () => {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const API_BASE = resolveAccountsBase(process.env.NEXT_PUBLIC_BACKEND_URL);
      const url = `${joinUrl(API_BASE, "users", String(userId))}/`; // always public
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Load failed (${res.status}): ${t.slice(0, 160)}`);
      }
      const data = await res.json();

      setUserId(Number(data.user_id || userId || 0) || null);
      try { if (data.user_id) localStorage.setItem("expair_user_id", String(data.user_id)); } catch {}

      setUsername(String(data.username || ""));
      setEmailAdd(String(data.emailAdd || data.email || ""));
      setBio(String(data.bio || ""));
      setProfilePicUrl(String(data.profilePic || "/assets/defaultavatar.png"));
    } catch (e) {
      console.error("[settings] load error", e);
      setError(e.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  run();
}, [userId]);


  const previewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return profilePicUrl || "/assets/defaultavatar.png";
  }, [file, profilePicUrl]);

  const norm = (v) => (v ?? "").trim();
  const isDirty =
    norm(username) ||
    norm(emailAdd) ||
    norm(bio) ||
    file
      ? true
      : false;

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setSaved(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const API_BASE = resolveAccountsBase(process.env.NEXT_PUBLIC_BACKEND_URL);

      // Build FormData for PATCH (so profilePic works)
      const fd = new FormData();
      // Only append changed things (ok to append all too)
      if (file) fd.append("profilePic", file);
      if (norm(username)) fd.append("username", norm(username));
      if (norm(emailAdd)) fd.append("emailAdd", norm(emailAdd));
      if (norm(bio)) fd.append("bio", norm(bio));
      if (userId) fd.append("user_id", String(userId)); // dev-friendly backend fallback

      const res = await fetch(`${joinUrl(API_BASE, "me")}/`, {
        method: "PATCH",
        credentials: "include",
        body: fd, // <-- multipart
        // headers: DO NOT set Content-Type manually for FormData; browser will set proper boundary.
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed (${res.status}): ${txt.slice(0, 200)}`);
      }

      const updated = await res.json();

      // Update UI from server echo
      setUsername(String(updated.username ?? username));
      setEmailAdd(String(updated.emailAdd ?? updated.email ?? emailAdd));
      setBio(String(updated.bio ?? bio));
      setProfilePicUrl(String(updated.profilePic ?? profilePicUrl));
      setFile(null);
      setSaved(true);
    } catch (e) {
      console.error("[settings] save error", e);
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "privacy", label: "Privacy" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Security" },
  ];

  return (
    <div className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4`}>
      <div className="max-w-[940px] mx-auto flex gap-10">
        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0">
          <Link href={`/home/profile/${userId ?? ""}`} className="flex items-center gap-2 mb-6 text-white/70 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> Back to Profile
          </Link>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`text-left px-4 py-2 rounded-[8px] transition ${
                  activeTab === item.key ? "bg-[#120A2A] text-white" : "text-white/70 hover:bg-[#1A0F3E]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content */}
        <main className="flex-1">
          <h1 className="text-3xl font-semibold mb-6">
            {menuItems.find((m) => m.key === activeTab)?.label} Settings
          </h1>

          {activeTab === "profile" && (
            <>
              {/* status */}
              {loading && (
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your settings…
                </div>
              )}
              {!loading && error && <p className="text-red-400 mb-4">{error}</p>}
              {!loading && saved && <p className="text-emerald-400 mb-4">Saved!</p>}

              {/* Profile Picture */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Profile Picture</p>
                <div className="flex items-center gap-4">
                  <Image
                    src={previewUrl || "/assets/defaultavatar.png"}
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    priority
                    style={{ height: "auto", width: "auto" }}
                  />
                  <button
                    type="button"
                    onClick={handlePickImage}
                    className="bg-[#0038FF] px-5 py-2 rounded-[10px] shadow hover:bg-[#1a4dff] text-sm"
                  >
                    Change
                  </button>
                  <input
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </section>

              {/* Username */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Username</p>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setSaved(false); }}
                  className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  placeholder="Your username"
                />
              </section>

              {/* Email */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Email</p>
                <input
                  type="email"
                  value={emailAdd}
                  onChange={(e) => { setEmailAdd(e.target.value); setSaved(false); }}
                  className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  placeholder="you@example.com"
                />
              </section>

              {/* Bio */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Bio</p>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => { setBio(e.target.value); setSaved(false); }}
                  className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm resize-none"
                  placeholder="Tell people about yourself"
                />
              </section>

              {/* Save */}
              <div className="flex justify-end">
                <button
                  disabled={saving || loading || !isDirty}
                  onClick={handleSave}
                  className="bg-[#0038FF] disabled:bg-[#0038FF]/60 px-6 py-3 rounded-[10px] shadow hover:bg-[#1a4dff] text-sm"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}

          {activeTab !== "profile" && (
            <p className="text-white/50">
              Settings for "{menuItems.find((m) => m.key === activeTab)?.label}" coming soon...
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
