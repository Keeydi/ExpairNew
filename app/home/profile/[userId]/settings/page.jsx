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
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return; // wait until session is ready

    const run = async () => {
      try {
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
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
  const [editFirstName, setEditFirstName] = useState(false);
  const [editLastName, setEditLastName] = useState(false);
  const [editBio, setEditBio] = useState(false);
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  const [linkError, setLinkError] = useState("");

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
        setFirstName("");
        setLastName("");
        setUsername("");
        setEmailAdd("");
        setBio("");
        setLocation("");
        setLinks([]);
        setProfilePicUrl("/assets/defaultavatar.png");

        // Store as original values (empty)
        setOriginalFirstName("");
        setOriginalLastName("");
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

        let linksValue = [];

        if (Array.isArray(data.links)) {
          // ✅ Already an array, just clean each element
          linksValue = data.links.map((l) =>
            String(l)
              .replace(/^https?:\/\//, "")
              .replace(/^"|"$/g, "")
              .trim()
          );
        } else if (typeof data.links === "string" && data.links.trim() !== "") {
          try {
            const parsed = JSON.parse(data.links);
            if (Array.isArray(parsed)) {
              linksValue = parsed.map((l) =>
                String(l)
                  .replace(/^https?:\/\//, "")
                  .replace(/^"|"$/g, "")
                  .trim()
              );
            } else {
              linksValue = [data.links.trim()];
            }
          } catch {
            linksValue = data.links
              .split(",")
              .map((l) =>
                String(l)
                  .replace(/^https?:\/\//, "")
                  .replace(/^"|"$/g, "")
                  .trim()
              )
              .filter(Boolean);
          }
        } else {
          linksValue = [];
        }
        setUserId(Number(data.user_id || userId || 0) || null);
        const firstNameValue = data.first_name || "";
        const lastNameValue = data.last_name || "";
        const usernameValue = String(data.username || "");
        const emailValue = String(data.emailAdd || data.email || "");
        const bioValue = String(data.bio || "");
        const locationValue = String(data.location || "");

        setFirstName(firstNameValue);
        setLastName(lastNameValue);
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
        setOriginalFirstName(firstNameValue);
        setOriginalLastName(lastNameValue);
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
      norm(firstName) !== norm(originalFirstName) ||
      norm(lastName) !== norm(originalLastName) ||
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
    firstName,
    lastName,
    username,
    emailAdd,
    bio,
    location,
    links,
    file,
    password,
    originalFirstName,
    originalLastName,
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
    console.log("links before save", links);

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
        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        setOriginalUsername(username);
        setOriginalEmailAdd(emailAdd);
        setOriginalBio(bio);
        setOriginalLocation(location);
        setOriginalLinks(links);

        setFile(null);
        setPassword("");
        setConfirmPassword("");
        setSaved(true);
        setShowSavedPopup(true);
        setSaving(false);
      }, 1000);
      return;
    }

    try {
      console.log(">>> handleSave starting with links:", links);

      const API_BASE = resolveAccountsBase(backendUrl);
      const fd = new FormData();
      if (file) fd.append("profilePic", file);
      if (norm(firstName)) fd.append("first_name", norm(firstName));
      if (norm(lastName)) fd.append("last_name", norm(lastName));
      if (norm(username)) fd.append("username", norm(username));
      if (norm(emailAdd)) fd.append("emailAdd", norm(emailAdd));
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

      // --- Build cleanLinks: store exactly what user typed (trimmed) and validate
      const cleanLinks = (Array.isArray(links) ? links : [])
        .map((l) => (typeof l === "string" ? l.trim() : ""))
        .filter((l) => l.length > 0);

      // Check if there are invalid links
      const invalidLinks = cleanLinks.filter(
        (l) => l.trim() !== "" && !isValidLink(l)
      );
      if (invalidLinks.length > 0) {
        setLinkError(
          "One or more links are invalid. Please enter valid URLs (e.g. instagram.com/username)."
        );
        setSaving(false);
        return; // Stop save here
      }

      setLinkError(""); // Clear old error if all links valid
      fd.append("links", JSON.stringify(cleanLinks));

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
      const newFirstName = String(updated.first_name ?? firstName);
      const newLastName = String(updated.last_name ?? lastName);
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
      setFirstName(newFirstName);
      setLastName(newLastName);
      setUsername(newUsername);
      setEmailAdd(newEmailAdd);
      setBio(newBio);
      setLocation(newLocation);
      setProfilePicUrl(String(updated.profilePic ?? profilePicUrl));

      // Update original values after successful save
      setOriginalFirstName(newFirstName);
      setOriginalLastName(newLastName);
      setOriginalUsername(newUsername);
      setOriginalEmailAdd(newEmailAdd);
      setOriginalBio(newBio);
      setOriginalLocation(newLocation);
      setOriginalLinks(newLinks.filter((l) => l.trim() !== ""));

      // ✅ Reset edit modes so fields go back to read-only
      setEditFirstName(false);
      setEditLastName(false);
      setEditBio(false);
      setEditUsername(false);
      setEditPassword(false);
      setEditLocation(false);
      setEditLinks(false);

      setFile(null);
      setPassword("");
      setConfirmPassword("");
      setSaved(true);
      setEditUsername(false);
      setEditPassword(false);
      setEditLocation(false);
      setEditLinks(false);

      setShowSavedPopup(true);
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
    // Revert values to original
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setUsername(originalUsername);
    setEmailAdd(originalEmailAdd);
    setBio(originalBio);
    setLocation(originalLocation);
    setLinks(originalLinks.filter((l) => l.trim() !== ""));
    setFile(null);
    setPassword("");
    setConfirmPassword("");

    // Revert all edit modes to read-only
    setEditFirstName(false);
    setEditLastName(false);
    setEditBio(false);
    setEditUsername(false);
    setEditPassword(false);
    setEditLocation(false);
    setEditLinks(false);

    // Reset state
    setSaved(false);
    setError("");
  };

  const menuItems = [{ key: "profile", label: "Profile" }];

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
    setViewport({
      latitude,
      longitude,
      zoom: 14,
    });
    setMarker({
      latitude,
      longitude,
    });
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
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    setLinkError("");
    if (value.trim() && !isValidLink(value.trim())) {
      console.warn("Invalid URL:", value);
    }
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

  // Basic link validator (allows example.com, sub.example.co.uk/path, etc.)
  const isValidLink = (url) => {
    const s = String(url || "").trim();
    if (!s) return false;
    // Accept http://, https://, or no scheme
    return /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+([\/?#].*)?$/i.test(s);
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
              </section>

              {/* First Name */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">First Name</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditFirstName(!editFirstName)}
                  />
                </div>
                {editFirstName ? (
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  />
                ) : (
                  <p className="text-white/100">{firstName || "Not set"}</p>
                )}
              </section>

              {/* Last Name */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Last Name</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditLastName(!editLastName)}
                  />
                </div>
                {editLastName ? (
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  />
                ) : (
                  <p className="text-white/100">{lastName || "Not set"}</p>
                )}
              </section>

              {/* Bio */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Bio</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditBio(!editBio)}
                  />
                </div>
                {editBio ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm resize-none"
                  />
                ) : (
                  <p className="text-white/100 whitespace-pre-line">
                    {bio || "Not set"}
                  </p>
                )}
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
                  <p className="text-white/100">{username || "Not set"}</p>
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
                    {/* Password field with toggle */}
                    <div className="relative mb-3">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setSaved(false);
                        }}
                        className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-white/60"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Confirm Password field with toggle */}
                    <div className="relative mb-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setSaved(false);
                        }}
                        className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-white/60"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

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
                  <p className="text-white/100">••••••••</p>
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
                    {/* Search bar */}
                    <div className="relative w-full">
                      <Search
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          fetchSuggestions(e.target.value);
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
                    </div>

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

                    {/* Mapbox map */}
                    <div className="mt-4 h-64 w-full rounded-lg overflow-hidden">
                      <Map
                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                        initialViewState={viewport}
                        viewState={viewport} // <-- bind viewport properly
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="mapbox://styles/mapbox/streets-v11"
                        onMove={(evt) => setViewport(evt.viewState)}
                        onClick={(e) => {
                          const lng = e.lngLat.lng;
                          const lat = e.lngLat.lat;

                          setMarker({ longitude: lng, latitude: lat });
                          setViewport((prev) => ({
                            ...prev,
                            longitude: lng,
                            latitude: lat,
                            zoom: prev.zoom < 12 ? 12 : prev.zoom, // keep zoom reasonable
                          }));

                          reverseGeocode(lng, lat);
                        }}
                      >
                        <Marker
                          longitude={marker.longitude}
                          latitude={marker.latitude}
                          draggable
                          onDragEnd={(e) => {
                            const lng = e.lngLat.lng;
                            const lat = e.lngLat.lat;

                            setMarker({ longitude: lng, latitude: lat });
                            setViewport((prev) => ({
                              ...prev,
                              longitude: lng,
                              latitude: lat,
                            }));

                            reverseGeocode(lng, lat);
                          }}
                        />
                      </Map>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/100">{location || "Not set"}</p>
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
                    {/* ✅ filter out empty strings so they don't render as empty bullets */}
                    {links.filter((l) => l.trim() !== "").length > 0 ? (
                      <ul className="list-disc list-inside text-white/80">
                        {links
                          .filter((raw) => raw.trim() !== "") // 🚫 no empty bullets
                          .map((raw, index) => {
                            const displayText = raw.trim();
                            const href = displayText.startsWith("http")
                              ? displayText
                              : `https://${displayText}`; // only prepend when actually creating href

                            return (
                              <li key={index}>
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#4A9EFF] underline hover:opacity-80"
                                >
                                  {displayText}
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

                {/* 🚨 Validation error display */}
                {linkError && (
                  <p className="text-red-400 text-sm mt-2">{linkError}</p>
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
                  onClick={() => setConfirmOpen(true)}
                  className="bg-[#0038FF] disabled:bg-[#0038FF]/60 px-6 py-3 rounded-[10px] shadow hover:bg-[#1a4dff] text-sm"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </main>
        {/* Confirm before saving */}
        <ConfirmSaveModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            await handleSave(); // call your existing handleSave
          }}
          saving={saving}
        />

        {/* Saved popup */}
        <SavedPopup
          isOpen={showSavedPopup}
          onClose={() => setShowSavedPopup(false)}
        />
      </div>
    </div>
  );

  function SavedPopup({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
        <div
          className="w-[420px] min-h-[200px] flex flex-col items-center justify-center p-8 relative text-center"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            border: "2px solid #0038FF",
            boxShadow: "0px 4px 15px #D78DE5",
            backdropFilter: "blur(40px)",
            borderRadius: "15px",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-[20px] right-[20px] text-white hover:text-gray-300"
            type="button"
          >
            ✕
          </button>

          <h2 className="text-[22px] font-semibold text-white mb-4">
            ✅ Settings saved successfully!
          </h2>
          <button
            onClick={onClose}
            className="mt-2 w-[150px] h-[38px] bg-[#0038FF] rounded-[10px] text-white text-[15px] shadow-[0px_0px_10px_#284CCC] hover:bg-[#1a4dff] transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

function ConfirmSaveModal({ isOpen, onClose, onConfirm, saving }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-[420px] p-6 bg-black/70 border-2 border-[#0038FF] rounded-[12px] shadow-[0px_4px_15px_#D78DE5] z-50"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="absolute top-3 right-3 text-white/80"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold text-white mb-3">
          Are you sure you want to save changes?
        </h3>
        <p className="text-sm text-white/70 mb-6">
          This will update your profile. You can review changes before saving.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-[#1a1a3d] text-white"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-[#0038FF] text-white"
            onClick={onConfirm}
            disabled={saving}
            type="button"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
