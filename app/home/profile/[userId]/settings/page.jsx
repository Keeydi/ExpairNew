"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function SettingsPage() {
  const [name, setName] = useState("John Doe");
  const [bio, setBio] = useState("This is my bio. I love helping people and learning new skills.");
  const [email, setEmail] = useState("johndoe@example.com");
  const [activeTab, setActiveTab] = useState("profile");

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
          <Link href="/home/profile/1" className="flex items-center gap-2 mb-6 text-white/70 hover:text-white">
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
              {/* Profile Picture */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Profile Picture</p>
                <div className="flex items-center gap-4">
                  <Image
                    src="/assets/defaultavatar.png"
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                  <label
                    htmlFor="profile-picture"
                    className="bg-[#0038FF] px-5 py-2 rounded-[10px] shadow hover:bg-[#1a4dff] cursor-pointer text-sm"
                  >
                    Change
                  </label>
                  <input id="profile-picture" type="file" className="hidden" />
                </div>
              </section>

              {/* Name */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Full Name</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                />
              </section>

              {/* Email */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Email</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                />
              </section>

              {/* Bio */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Bio</p>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm resize-none"
                />
              </section>

              {/* Save Changes Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => alert("Changes saved!")}
                  className="bg-[#0038FF] px-6 py-3 rounded-[10px] shadow hover:bg-[#1a4dff] text-sm"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}

          {activeTab !== "profile" && (
            <p className="text-white/50">Settings for "{menuItems.find((m) => m.key === activeTab)?.label}" coming soon...</p>
          )}
        </main>
      </div>
    </div>
  );
}
