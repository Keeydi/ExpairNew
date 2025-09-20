"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Loader2, X, Pencil, Search, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useSession } from "next-auth/react";
import { authFetch } from "./authFetch";

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

const backendUrl = "http://localhost:8000";

export default function SettingsPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return; // wait until session is ready

    const run = async () => {
      try {
        console.log(
          "[callsite] calling authFetch for",
          url,
          "session preview:",
          !!session,
          session
            ? session.access
              ? "has access"
              : Object.keys(session)
            : session
        );
        const res = await authFetch(
          `${backendUrl}/api/accounts/me/`,
          {},
          session
        );
        const data = await res.json();
        console.log("Me endpoint:", data);
      } catch (err) {
        console.error("[settings] load error", err);
      }
    };

    run();
  }, [session]);

  const [activeTab, setActiveTab] = useState("profile");

  // form state
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [emailAdd, setEmailAdd] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [links, setLinks] = useState([]);
  const [location, setLocation] = useState("");

  // Original values for change detection
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmailAdd, setOriginalEmailAdd] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [originalLocation, setOriginalLocation] = useState("");
  const [originalLinks, setOriginalLinks] = useState("");

  const passwordRules = [
    { label: "At least one lowercase letter", test: /[a-z]/ },
    { label: "At least one uppercase letter", test: /[A-Z]/ },
    { label: "At least one number", test: /\d/ },
    { label: "Minimum 8 characters", test: /.{8,}/ },
  ];

  // ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // edit toggles
  const [editUsername, setEditUsername] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [editLocation, setEditLocation] = useState(false);
  const [editLinks, setEditLinks] = useState(false);

  // derive initial user id
  const params = useParams();
  const pathname = usePathname();

  if (status === "loading" || !session) {
    return (
      <div
        className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4 flex items-center justify-center`}
      >
        {status === "loading" ? (
          <p>Loading...</p>
        ) : (
          <p>You must log in first.</p>
        )}
      </div>
    );
  }

  useEffect(() => {
    console.log("🔍 Session object in Settings page:", session); // 👈 add here

    let uid = null;

    // Get user identifier from URL params or pathname
    if (params?.userId) {
      uid = params.userId; // This could be username or numeric ID
    } else if (pathname) {
      // Extract username/ID from path like /profile/nehemmdizon/settings
      const m = pathname.match(/\/profile\/([^\/]+)/i);
      if (m) {
        uid = m[1]; // This captures "nehemmdizon" or any user identifier
      }
    }

    // Fallback to URL search params if needed
    if (!uid && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      uid = sp.get("uid");
    }

    setUserId(uid);
  }, [params, pathname]);

  // load current profile
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      setSaved(false);

      // Check if backend is available
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        console.warn("[settings] No backend URL configured");
        // Initialize with empty values
        setUsername("");
        setEmailAdd("");
        setBio("");
        setLocation("");
        setLinks([]);
        setProfilePicUrl("/assets/defaultavatar.png");

        // Store as original values (empty)
        setOriginalUsername("");
        setOriginalEmailAdd("");
        setOriginalBio("");
        setOriginalLocation("");
        setOriginalLinks([]);

        setLoading(false);
        return;
      }

      try {
        const API_BASE = resolveAccountsBase(backendUrl);

        let url;
        if (userId != null) {
          // Check if userId is numeric (user ID) or string (username)
          if (/^\d+$/.test(String(userId))) {
            // It's a numeric ID - use the existing endpoint
            url = `${joinUrl(API_BASE, "users", String(userId))}/`;
          } else {
            // It's a username - use the username endpoint
            url = `${joinUrl(API_BASE, "users", "username", String(userId))}/`;
          }
        } else {
          // Fallback to /me endpoint for authenticated user
          url = `${joinUrl(API_BASE, "me")}/`;
        }

        console.log(
          "[callsite] calling authFetch for",
          url,
          "session preview:",
          !!session,
          session
            ? session.access
              ? "has access"
              : Object.keys(session)
            : session
        );

        const res = await authFetch(`${backendUrl}/api/accounts/me/`, {
          credentials: "include",
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Load failed (${res.status}): ${t.slice(0, 160)}`);
        }
        const data = await res.json();
        setUserId(Number(data.user_id || userId || 0) || null);

        const usernameValue = String(data.username || "");
        const emailValue = String(data.emailAdd || data.email || "");
        const bioValue = String(data.bio || "");
        const locationValue = String(data.location || "");
        let linksValue = [];
        if (Array.isArray(data.links)) {
          linksValue = data.links;
        } else if (typeof data.links === "string" && data.links.trim() !== "") {
          linksValue = data.links.split(",").map((l) => l.trim());
        } else {
          linksValue = [];
        }
        setLinks(Array.isArray(linksValue) ? linksValue : []);

        setUsername(usernameValue);
        setEmailAdd(emailValue);
        setBio(bioValue);
        setLocation(locationValue);
        setLinks(linksValue);
        setProfilePicUrl(
          String(data.profilePic || "/assets/defaultavatar.png")
        );

        // Store original values for change detection
        setOriginalUsername(usernameValue);
        setOriginalEmailAdd(emailValue);
        setOriginalBio(bioValue);
        setOriginalLocation(locationValue);
        setOriginalLinks(linksValue);
      } catch (e) {
        console.error("[settings] load error", e);
        if (
          e.message.includes("Failed to fetch") ||
          e.message.includes("ERR_CONNECTION_REFUSED")
        ) {
          setError("Backend server is not available.");
          // Initialize with empty values so user can still interact with the form
          setOriginalUsername("");
          setOriginalEmailAdd("");
          setOriginalBio("");
          setOriginalLocation("");
          setOriginalLinks([]);
        } else {
          setError(e.message || "Failed to load settings.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  const DEFAULT_AVATAR = "/assets/defaultavatar.png";
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR);

  // Keep preview in sync with server photo when no new file is picked
  useEffect(() => {
    if (!file) {
      setPreviewUrl(profilePicUrl || DEFAULT_AVATAR);
    }
  }, [profilePicUrl, file]);

  // When a new file is chosen, create/revoke an object URL
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const norm = (v) => String(v ?? "").trim();

  const isDirty = useMemo(() => {
    if (
      norm(username) !== norm(originalUsername) ||
      norm(emailAdd) !== norm(originalEmailAdd) ||
      norm(bio) !== norm(originalBio) ||
      norm(location) !== norm(originalLocation) ||
      JSON.stringify(links) !== JSON.stringify(originalLinks) ||
      !!file ||
      !!password
    ) {
      return true;
    }
    return false;
  }, [
    username,
    emailAdd,
    bio,
    location,
    links,
    file,
    password,
    originalUsername,
    originalEmailAdd,
    originalBio,
    originalLocation,
    originalLinks,
  ]);

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

    // Check if backend is available
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.warn("[settings] No backend URL configured, simulating save");
      // Simulate save without backend
      setTimeout(() => {
        // Update original values to current values (simulate successful save)
        setOriginalUsername(username);
        setOriginalEmailAdd(emailAdd);
        setOriginalBio(bio);
        setOriginalLocation(location);
        setOriginalLinks(links);

        setFile(null);
        setPassword("");
        setConfirmPassword("");
        setSaved(true);
        setSaving(false);
      }, 1000);
      return;
    }

    try {
      const API_BASE = resolveAccountsBase(backendUrl);
      const fd = new FormData();
      if (file) fd.append("profilePic", file.name); // send only the filename, not the file blob
      if (norm(username)) fd.append("username", norm(username));
      if (norm(emailAdd)) fd.append("emailAdd", norm(emailAdd));
      if (norm(bio)) fd.append("bio", norm(bio));
      if (norm(location)) fd.append("location", norm(location));
      if (links.length > 0) {
        // Store as JSON array (safer for backend)
        fd.append("links", JSON.stringify(links));
      }
      if (userId) fd.append("user_id", String(userId));

      if (password || confirmPassword) {
        const isValid = passwordRules.every((rule) => rule.test.test(password));
        if (!isValid) {
          setError("Password does not meet requirements.");
          setSaving(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setSaving(false);
          return;
        }
        fd.append("password", password);
      }

      const targetUrl =
        userId != null
          ? `${joinUrl(API_BASE, "users", String(userId))}/`
          : `${joinUrl(API_BASE, "me")}/`;

      console.log(
        "[callsite] calling authFetch for",
        url,
        "session preview:",
        !!session,
        session
          ? session.access
            ? "has access"
            : Object.keys(session)
          : session
      );
      const res = await authFetch(targetUrl, {
        method: "PATCH",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed (${res.status}): ${txt.slice(0, 200)}`);
      }

      const updated = await res.json();
      const newUsername = String(updated.username ?? username);
      const newEmailAdd = String(updated.emailAdd ?? updated.email ?? emailAdd);
      const newBio = String(updated.bio ?? bio);
      const newLocation = String(updated.location ?? location);

      let newLinks = [];
      try {
        if (Array.isArray(updated.links)) {
          newLinks = updated.links;
        } else if (
          typeof updated.links === "string" &&
          updated.links.trim() !== ""
        ) {
          // If backend accidentally sends a string, wrap it in an array
          newLinks = [updated.links];
        } else {
          newLinks = links; // fallback
        }
      } catch {
        newLinks = links;
      }
      setUsername(newUsername);
      setEmailAdd(newEmailAdd);
      setBio(newBio);
      setLocation(newLocation);
      setProfilePicUrl(String(updated.profilePic ?? profilePicUrl));

      // Update original values after successful save
      setOriginalUsername(newUsername);
      setOriginalEmailAdd(newEmailAdd);
      setOriginalBio(newBio);
      setOriginalLocation(newLocation);
      setOriginalLinks(newLinks);

      setFile(null);
      setPassword("");
      setConfirmPassword("");
      setSaved(true);
      setEditUsername(false);
      setEditPassword(false);
      setEditLocation(false);
      setEditLinks(false);
    } catch (e) {
      console.error("[settings] save error", e);
      if (
        e.message.includes("Failed to fetch") ||
        e.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        setError(
          "Backend server is not available. Changes saved locally only."
        );
        // Still update the original values to simulate save
        setOriginalUsername(username);
        setOriginalEmailAdd(emailAdd);
        setOriginalBio(bio);
        setOriginalLocation(location);
        setOriginalLinks(links);
        setSaved(true);
      } else {
        setError(e.message || "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(originalUsername);
    setEmailAdd(originalEmailAdd);
    setBio(originalBio);
    setLocation(originalLocation);
    setLinks(originalLinks);
    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setEditUsername(false);
    setEditPassword(false);
    setEditLocation(false);
    setEditLinks(false);
    setSaved(false);
    setError("");
  };

  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "privacy", label: "Privacy & Security" },
  ];

  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?autocomplete=true&limit=5&access_token=${token}`;

      console.log(
        "[callsite] calling authFetch for",
        url,
        "session preview:",
        !!session,
        session
          ? session.access
            ? "has access"
            : Object.keys(session)
          : session
      );
      const res = await authFetch(url);
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
      }
    } catch (err) {
      console.error("Mapbox fetch error:", err);
    }
  };

  const handleSelectSuggestion = (place) => {
    setLocation(place.place_name);
    setSuggestions([]); // clear dropdown
    setSaved(false);
  };

  const handleSearch = async () => {
    if (!location) return;
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        location
      )}.json?limit=1&access_token=${token}`;
      console.log(
        "[callsite] calling authFetch for",
        url,
        "session preview:",
        !!session,
        session
          ? session.access
            ? "has access"
            : Object.keys(session)
          : session
      );
      const res = await authFetch(`${backendUrl}/api/accounts/me/`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setLocation(data.features[0].place_name);
      }
    } catch (err) {
      console.error("Mapbox search error:", err);
    }
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    setLinks(updatedLinks);
    setSaved(false);
  };

  const handleAddLink = () => {
    setLinks([...links, ""]);
    setSaved(false);
  };

  const handleRemoveLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    setSaved(false);
  };

  return (
    <div
      className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4`}
    >
      <div className="max-w-[940px] mx-auto flex gap-10">
        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0">
          <Link
            href={`/home/profile/${userId ?? ""}`}
            className="flex items-center gap-2 mb-6 text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Profile
          </Link>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`text-left px-4 py-2 rounded-[8px] transition ${
                  activeTab === item.key
                    ? "bg-[#120A2A] text-white"
                    : "text-white/70 hover:bg-[#1A0F3E]"
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
              {loading && (
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your
                  settings…
                </div>
              )}
              {!loading && error && (
                <p className="text-red-400 mb-4">{error}</p>
              )}
              {!loading && saved && (
                <p className="text-emerald-400 mb-4">Saved!</p>
              )}

              {/* Profile Picture */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Profile Picture</p>
                <div className="flex items-center gap-4">
                  {/* Fixed-size square container; stays square and crops center */}
                  <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border border-white/20 bg-[#0B0420]">
                    <Image
                      src={previewUrl || DEFAULT_AVATAR}
                      alt="Profile photo preview"
                      fill
                      priority
                      sizes="200px"
                      className="object-cover object-center"
                    />
                  </div>

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

                <p className="mt-2 text-s text-white/40">
                  JPG or PNG up to 5MB. Square images work best.
                </p>
              </section>

              {/* Username */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Username</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditUsername(!editUsername)}
                  />
                </div>
                {editUsername ? (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setSaved(false);
                    }}
                    className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  />
                ) : (
                  <p className="text-white/80">{username || "Not set"}</p>
                )}
              </section>

              {/* Password */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Password</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditPassword(!editPassword)}
                  />
                </div>
                {editPassword ? (
                  <>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setSaved(false);
                      }}
                      className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm mb-3"
                      placeholder="Enter new password"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setSaved(false);
                      }}
                      className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm mb-2"
                      placeholder="Confirm new password"
                    />
                    <ul className="text-xs text-white/60 space-y-1 mt-2">
                      {passwordRules.map((rule, idx) => (
                        <li
                          key={idx}
                          className={
                            rule.test.test(password)
                              ? "text-emerald-400"
                              : "text-white/40"
                          }
                        >
                          • {rule.label}
                        </li>
                      ))}
                      {confirmPassword && confirmPassword !== password && (
                        <li className="text-red-400">
                          • Passwords do not match
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <p className="text-white/80">••••••••</p>
                )}
              </section>

              {/* Location */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Location</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditLocation(!editLocation)}
                  />
                </div>

                {editLocation ? (
                  <div className="relative w-full">
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        fetchSuggestions(e.target.value); // para gumana suggestions
                        setSaved(false);
                      }}
                      placeholder="Search for your location here..."
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full h-[50px] sm:h-[57px] pl-12 pr-12 rounded-[12px] sm:rounded-[15px] border border-[rgba(255,255,255,0.4)] bg-[#120A2A] text-white text-[14px] sm:text-[16px] shadow focus:outline-none"
                    />
                    <MapPin
                      onClick={handleSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                      size={20}
                    />

                    {/* Dropdown suggestions */}
                    {suggestions.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-1 bg-[#120A2A] border border-[rgba(255,255,255,0.4)] rounded-[15px] shadow-lg overflow-hidden z-20">
                        {suggestions.map((place) => (
                          <li
                            key={place.id}
                            className="px-4 py-2 text-left text-white hover:bg-[#1a1a3d] cursor-pointer transition-colors"
                            onClick={() => handleSelectSuggestion(place)}
                          >
                            {place.place_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-white/80">{location || "Not set"}</p>
                )}
              </section>

              {/* Links */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Links</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditLinks(!editLinks)}
                  />
                </div>

                {editLinks ? (
                  <div className="flex-1 min-w-[200px] sm:min-w-[400px] text-left">
                    <div className="max-h-[200px] sm:max-h-[310px] overflow-y-auto custom-scrollbar">
                      {links.map((link, index) => (
                        <div
                          key={index}
                          className="relative mb-[10px] sm:mb-[12px]"
                        >
                          <input
                            type="url"
                            value={link}
                            onChange={(e) =>
                              handleLinkChange(index, e.target.value)
                            }
                            placeholder="Link here"
                            className="bg-[#120A2A] text-white border border-white/40 rounded-[10px] sm:rounded-[12px] w-full pr-8 sm:pr-10 h-[45px] sm:h-[50px] placeholder-[#413663] placeholder:text-[14px] sm:placeholder:text-[15px] px-4 py-3"
                          />
                          <X
                            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/70 cursor-pointer"
                            onClick={() => handleRemoveLink(index)}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="font-[400] text-[14px] sm:text-[15px] text-[#0038FF] hover:underline text-left mt-1"
                    >
                      + Add another link
                    </button>
                  </div>
                ) : (
                  <div>
                    {links.length > 0 ? (
                      <ul className="list-disc list-inside text-white/80">
                        {links.map((link, index) => (
                          <li key={index}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4A9EFF] hover:underline"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/80">Not set</p>
                    )}
                  </div>
                )}
              </section>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-[#1a1a3d] px-6 py-3 rounded-[10px] shadow text-sm text-white hover:bg-[#2a2a4d] transition"
                >
                  Cancel
                </button>
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
              Settings for "{menuItems.find((m) => m.key === activeTab)?.label}"
              coming soon...
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
