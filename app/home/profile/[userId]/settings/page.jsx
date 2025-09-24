"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  X,
  Pencil,
  Search,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useSession } from "next-auth/react";
import { authFetch } from "./authFetch";
import Map, { Marker } from "react-map-gl";
import ProfileAvatar from "@/components/avatar";

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
  const { data: session, update } = useSession();

  const [activeTab, setActiveTab] = useState("profile");

  // form state
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [emailAdd, setEmailAdd] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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

  // location states
  const [viewport, setViewport] = useState({
    longitude: 121.0437,
    latitude: 14.5995,
    zoom: 12,
  });

  const [marker, setMarker] = useState({
    longitude: 121.0437,
    latitude: 14.5995,
  });

  const [searchQuery, setSearchQuery] = useState(location || "");
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [isUserInteracted, setIsUserInteracted] = useState(false); // Track user interaction

  const DEFAULT_AVATAR = "/assets/defaultavatar.png";
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR);

  const [userProfile, setUserProfile] = useState({});

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

        const res = await authFetch(url, { credentials: "include" });

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
        setSearchQuery(locationValue);
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

  // 📍 When location string changes (from DB or user typing), geocode it into coords
  useEffect(() => {
    if (!location) return;

    const fetchCoords = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          location
        )}.json?limit=1&access_token=${token}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          setViewport((prev) => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            zoom: 12,
          }));

          setMarker({ longitude: lng, latitude: lat });
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    };

    fetchCoords(); // ✅ actually call it
  }, [location]);

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
    setShowDisclaimer(true);
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
      console.log(">>> handleSave starting with links:", links);

      const API_BASE = resolveAccountsBase(backendUrl);
      const fd = new FormData();
      if (file) fd.append("profilePic", file);
      if (norm(username)) fd.append("username", norm(username));
      if (norm(emailAdd)) fd.append("email", norm(emailAdd));
      if (norm(bio)) fd.append("bio", norm(bio));
      if (norm(location)) fd.append("location", norm(location));
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

      // --- normalize & validate links robustly ---
      const normalizeAndValidate = (raw) => {
        if (!raw && raw !== 0) return null;
        let s = typeof raw === "string" ? raw.trim() : null;

        if (!s && typeof raw === "object" && raw !== null) {
          s = (raw.value || raw.url || "").toString().trim();
        }

        if (!s) return null;

        // ✅ ensure scheme
        if (!/^https?:\/\//i.test(s)) {
          s = "https://" + s; // prepend https:// if user forgot
        }

        try {
          const u = new URL(s);
          return u.toString(); // fully normalized
        } catch {
          return null;
        }
      };

      const cleanedLinks = (Array.isArray(links) ? links : [])
        .map(normalizeAndValidate)
        .filter((x) => !!x);

      console.log(">>> Sending cleanedLinks:", cleanedLinks);

      fd.append("links", JSON.stringify(cleanedLinks || []));

      const targetUrl =
        userId != null
          ? `${joinUrl(API_BASE, "users", String(userId))}/`
          : `${joinUrl(API_BASE, "me")}/`;

      console.log(">>> FormData about to send:");
      for (let [key, value] of fd.entries()) {
        console.log("   ", key, value);
      }

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

      // Add this line to force a session refresh
      await update();

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
    setShowDisclaimer(false);
  };

  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "privacy", label: "Privacy & Security" },
  ];
  const [coords, setCoords] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch autocomplete suggestions
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

      const res = await fetch(url);
      const data = await res.json();

      if (data.features) {
        setSuggestions(data.features);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select suggestion
  const handleSelectSuggestion = (place) => {
    console.log("Selected place:", place); // Debugging
    setSearchQuery(place.place_name); // Set the location to the text field
    const [longitude, latitude] = place.center;
    setViewport({ latitude, longitude, zoom: 14, });
    setMarker({ latitude, longitude, });
    setSuggestions([]); // Clear suggestions
    setIsUserInteracted(true); // User interacted with the location
    setErrorMessage(""); // Clear error if location is valid
  };

  // Manual search via Enter or icon
  const handleSearch = async () => {
    if (!searchQuery) {
      setErrorMessage("Please enter a location to search.");
      return;
    }
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        setViewport((prev) => ({
          ...prev,
          latitude,
          longitude,
          zoom: 14,
        }));
        setMarker({ latitude, longitude });
        setIsUserInteracted(true); // Mark that the user interacted with the location
        setErrorMessage("");
      } else {
        setErrorMessage("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleMarkerChange = async (newMarker) => {
    console.log("New marker selected:", newMarker); // Debugging
    setMarker(newMarker); // Update marker state
    setViewport((prev) => ({
      ...prev,
      latitude: newMarker.latitude,
      longitude: newMarker.longitude,
    }));
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newMarker.longitude},${newMarker.latitude}.json?access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setSearchQuery(data.features[0].place_name); // Update searchQuery with place name
        setIsUserInteracted(true); // User interacted with the map
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
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

  // Reusable reverse geocoding
  const reverseGeocode = async (lng, lat) => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        setLocation(placeName); // save to backend value
        setSearchQuery(placeName); // reflect in input
      } else {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setLocation(fallback);
        setSearchQuery(fallback);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLocation(fallback);
      setSearchQuery(fallback);
    }
  };

  return (
    <div className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4`} >
      <div className="max-w-[940px] mx-auto flex gap-10">
        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0">
          <Link href={`/home/profile/${userId ?? ""}`} className="flex items-center gap-2 mb-6 text-white/70 hover:text-white" >
            <ChevronLeft className="w-5 h-5" /> Back to Profile
          </Link>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button key={item.key} onClick={() => setActiveTab(item.key)} className={`text-left px-4 py-2 rounded-[8px] transition ${ activeTab === item.key ? "bg-[#120A2A] text-white" : "text-white/70 hover:bg-[#1A0F3E]" }`} >
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your settings…
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
                    <ProfileAvatar src={previewUrl} size={200} />
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
                {showDisclaimer && (
                    <p className="mt-2 text-sm text-yellow-300">
                        Disclaimer: Your profile picture may not reflect instantly, and may require you to relog in.
                    </p>
                )}
              </section>

              {/* Account Details */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-medium">Account Details</h2>
                  {editUsername ? (
                    <button
                      type="button"
                      onClick={() => setEditUsername(false)}
                      className="text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditUsername(true)}
                      className="text-white/70 hover:text-white"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {/* Username */}
                  <div>
                    <p className="mb-1 text-sm text-white/70">Username</p>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!editUsername}
                      className="w-full bg-[#120A2A] text-white rounded-[10px] px-4 py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition disabled:opacity-50"
                    />
                  </div>
                  {/* Email Address */}
                  <div>
                    <p className="mb-1 text-sm text-white/70">Email Address</p>
                    <input
                      type="email"
                      value={emailAdd}
                      onChange={(e) => setEmailAdd(e.target.value)}
                      disabled={!editUsername}
                      className="w-full bg-[#120A2A] text-white rounded-[10px] px-4 py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition disabled:opacity-50"
                    />
                  </div>
                  {/* Bio */}
                  <div>
                    <p className="mb-1 text-sm text-white/70">Bio</p>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[#120A2A] text-white rounded-[10px] px-4 py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition disabled:opacity-50 min-h-[100px]"
                    />
                  </div>
                </div>
              </section>

              {/* Password */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-medium">Password</h2>
                  {editPassword ? (
                    <button
                      type="button"
                      onClick={() => setEditPassword(false)}
                      className="text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditPassword(true)}
                      className="text-white/70 hover:text-white"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {/* New Password */}
                  <div>
                    <p className="mb-1 text-sm text-white/70">New Password</p>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={!editPassword}
                        className="w-full bg-[#120A2A] text-white rounded-[10px] px-4 py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                        disabled={!editPassword}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {/* Confirm Password */}
                  <div>
                    <p className="mb-1 text-sm text-white/70">Confirm Password</p>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={!editPassword}
                        className="w-full bg-[#120A2A] text-white rounded-[10px] px-4 py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                        disabled={!editPassword}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {/* Password Rules */}
                  <div className="text-sm text-white/60 mt-1">
                    <ul className="list-disc list-inside">
                      {passwordRules.map((rule) => (
                        <li key={rule.label} className={password && rule.test.test(password) ? "text-emerald-400" : ""}>
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Location */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-medium">Location</h2>
                  {editLocation ? (
                    <button
                      type="button"
                      onClick={() => setEditLocation(false)}
                      className="text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditLocation(true)}
                      className="text-white/70 hover:text-white"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="relative w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                        setErrorMessage("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      disabled={!editLocation}
                      className="w-full pl-10 pr-4 bg-[#120A2A] text-white rounded-[10px] py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition disabled:opacity-50"
                      placeholder="Search for a location"
                    />
                  </div>
                  {editLocation && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-[#1A0F3E] border border-white/20 rounded-[10px] mt-1 shadow-lg">
                      {suggestions.map((place) => (
                        <li
                          key={place.id}
                          onClick={() => handleSelectSuggestion(place)}
                          className="px-4 py-3 text-sm text-white cursor-pointer hover:bg-[#2A1856]"
                        >
                          {place.place_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {errorMessage && (
                    <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
                  )}
                </div>
                {editLocation && (
                  <div className="w-full h-[250px] mt-4 rounded-[10px] overflow-hidden">
                    <Map
                      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                      {...viewport}
                      onMove={(e) => setViewport(e.viewState)}
                      mapStyle="mapbox://styles/mapbox/dark-v11"
                      onDblClick={(e) => {
                        const newMarker = {
                          longitude: e.lngLat.lng,
                          latitude: e.lngLat.lat,
                        };
                        handleMarkerChange(newMarker);
                      }}
                    >
                      <Marker
                        longitude={marker.longitude}
                        latitude={marker.latitude}
                        anchor="bottom"
                      >
                        <MapPin className="text-[#0038FF] w-6 h-6" />
                      </Marker>
                    </Map>
                  </div>
                )}
              </section>

              {/* Links */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-medium">Links</h2>
                  {editLinks ? (
                    <button
                      type="button"
                      onClick={() => setEditLinks(false)}
                      className="text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditLinks(true)}
                      className="text-white/70 hover:text-white"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {editLinks ? (
                  <div className="flex flex-col gap-3">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handleLinkChange(index, e.target.value)}
                          className="flex-1 bg-[#120A2A] text-white rounded-[10px] px-4 py-3 border border-white/20 focus:outline-none focus:border-[#0038FF] transition"
                          placeholder="https://yourwebsite.com"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="w-full bg-[#1A0F3E] text-white/70 py-3 rounded-[10px] hover:bg-[#2A1856] transition"
                    >
                      + Add a Link
                    </button>
                  </div>
                ) : (
                  <div>
                    {links.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {links.map((href, index) => {
                          const url = new URL(href);
                          return (
                            <li key={index}>
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4A9EFF] hover:underline"
                              >
                                {href}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-white/100">Not set</p>
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