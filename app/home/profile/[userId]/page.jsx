"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  Star,
  Heart,
  Flag,
} from "lucide-react";

const safeFixed = (val, digits = 1) => {
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(digits) : (0).toFixed(digits);
};

const RAW = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const API_BASE = RAW.includes("/api/accounts")
  ? RAW.replace(/\/+$/, "")
  : `${RAW.replace(/\/+$/, "")}/api/accounts`;

const inter = Inter({ subsets: ["latin"] });

export default function ProfilePage() {

  const { data: session } = useSession();
  const params = useParams();
  const [error, setError] = useState(null);
 

  const [editingCredentials, setEditingCredentials] = useState(null); // null, 'all', or a specific credential object
  const [expanded, setExpanded] = useState(Array(5).fill(false)); // Initialize state for all categories
  const [sortOption, setSortOption] = useState("Latest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const slug = useMemo(() => {
    const raw = params?.userId;
    return Array.isArray(raw) ? raw[0] : raw || null;
  }, [params]);

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    joined: "",
    rating: 0,   
    reviews: 0,
      
});

  const RAW_ORIGIN = RAW.replace(/\/api\/accounts\/?$/, "");

  const toAbsolute = (u) => {
  if (!u) return null;
  try {
    // If u is already absolute, URL(u) keeps it; if it's relative, it resolves vs RAW_ORIGIN
    return new URL(u, RAW_ORIGIN).href;
  } catch {
    return u;
  }
};

  useEffect(() => {
  if (!slug) return;

  const isNumeric = /^\d+$/.test(String(slug));
  const isUsername = /^[a-zA-Z0-9_.]{3,30}$/.test(String(slug));

  if (!(slug === "me" || isNumeric || isUsername)) {
    setError("Invalid profile URL.");       
    return;
  }

  let cancelled = false;

  (async () => {
    try {
      const isNumeric = /^\d+$/.test(String(slug));
      const url =
      slug === "me"
        ? `${API_BASE}/accounts/me/`
        : isNumeric
          ? `${API_BASE}/users/${slug}/`
          : `${API_BASE}/users/by-username/${encodeURIComponent(slug)}/`;

      const headers = { Accept: "application/json" };
      if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

      console.log("[profile] GET", url);
      const res = await fetch(url, {
        headers,
        credentials: slug === "me" ? "include" : "same-origin",
      });
      console.log("[profile] status", res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (cancelled) return;

      setUser((prev) => ({
        ...prev,
        firstName: data.first_Name || "",
        lastName:  data.last_Name  || "",
        username:  data.username   || "",
        profilePic: data.profilePic || null,
        joined:    data.created_at
          ? new Date(data.created_at).toLocaleString(undefined, { month: "long", year: "numeric" })
          : "",
        rating:    Number(data.avgStars ?? data.rating) || 0,
        reviews:   Number(data.ratingCount ?? data.reviews) || 0,
        bio:       data.bio || prev.bio || "",
        rank: (data.xpRank ?? data.rank ?? "Rank").toString(),
        level:     Number.isFinite(Number(data.level)) ? Number(data.level) : 0,
        xpPoints:  Number.isFinite(Number(data.tot_XpPts)) ? Number(data.tot_XpPts) : 0,
      }));

      const userId = isNumeric ? String(slug) : String(data.id ?? data.user_id ?? "");
      if (userId) {
        const [iRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/users/${userId}/interests/`, { headers }),
          fetch(`${API_BASE}/users/${userId}/skills/`,    { headers }),
        ]);
        const [iJson, sJson] = await Promise.all([iRes.json(), sRes.json()]);
        if (cancelled) return;

        setUserInterests(Array.isArray(iJson?.interests) ? iJson.interests : []);
        setSelectedSkillGroups(Array.isArray(sJson?.skill_groups) ? sJson.skill_groups : []);
      }
    } catch (e) {
      console.error("[profile] load error", e);
      setError("Failed to load profile.");
    }
  })();

  return () => { cancelled = true; };
}, [slug, session?.accessToken]);



  const [credentials, setCredentials] = useState([
    {
      title: "Adobe Certified Expert (ACE)",
      org: "Adobe Systems Inc",
      issueDate: "March 2023",
      expiryDate: "March 2026",
      id: "ACE-123456789",
      url: "https://adobe.com/cert/ACE-123456789",
      skills: ["Graphic Design", "Illustration", "Animation"],
    },
    {
      title: "Certified Graphic Designer (CGD)",
      org: "Graphic Designers of Canada (GDC)",
      issueDate: "June 2022",
      expiryDate: "June 2025",
      id: "CGD-987654321",
      url: "https://gdc.net/cert/CGD-987654321",
      skills: ["Graphic Design", "Illustration"],
    },
    {
      title: "Google Analytics Certified",
      org: "Google",
      issueDate: "August 2023",
      expiryDate: "August 2026",
      id: "GA-123456789",
      url: "https://skillshop.exceedlms.com/student/award/GA-123456789",
      skills: ["Data Analysis", "Marketing", "SEO"],
    },
  ]);
  const [showAllCreds, setShowAllCreds] = useState(false);
  const [reviews, setReviews] = useState([
    {
      requester: "David Chen",
      tradePartner: "John Doe",
      tradeCompletionDate: "May 12",
      requestTitle: "Corporate Training",
      offerTitle: "Gardening",
      rating: 5.0,
      reviewDescription:
        "John was patient and clear in his corporate training sessions. He adapted well to my learning pace and made the experience enjoyable. I learned a lot thanks to his help.",
      likes: 42,
    },
    {
      requester: "Sarah Kim",
      tradePartner: "John Doe",
      tradeCompletionDate: "June 10",
      requestTitle: "Personal Training",
      offerTitle: "Graphic Design",
      rating: 4.5,
      reviewDescription:
        "John was a dedicated personal trainer who tailored workouts to my needs. He was punctual, encouraging, and professional throughout our sessions. I highly recommend him for anyone looking to improve their fitness.",
      likes: 34,
    },
    {
      requester: "Michael Lee",
      tradePartner: "John Doe",
      tradeCompletionDate: "June 2",
      requestTitle: "Illustration",
      offerTitle: "Web Development",
      rating: 4.0,
      reviewDescription:
        "John provided excellent illustration work for my website graphics. He was responsive to feedback and delivered quality designs on time. It was a pleasure collaborating with him.",
      likes: 21,
    },
    {
      requester: "Priya Patel",
      tradePartner: "John Doe",
      tradeCompletionDate: "May 20",
      requestTitle: "Tutoring",
      offerTitle: "Language Instruction",
      rating: 3.5,
      reviewDescription:
        "John helped me with tutoring sessions and was very organized. There were a few small misunderstandings initially, but he was quick to address them. Overall, a reliable trade partner.",
      likes: 15,
    },
    {
      requester: "Mark Thompson",
      tradePartner: "John Doe",
      tradeCompletionDate: "April 15",
      requestTitle: "Event Planning",
      offerTitle: "Handyman Services",
      rating: 4.2,
      reviewDescription:
        "John was very helpful setting up for my event and offered useful handyman services on site. He was punctual and easy to communicate with. I’d gladly trade with him again.",
      likes: 18,
    },
  ]);

  const handleDeleteReview = (reviewToDelete) => {
    // Filter out the review to be deleted and update the state
    setReviews(reviews.filter((review) => review !== reviewToDelete));
  };

  const toggleCategory = (index) => {
    setExpanded((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  useState({
    firstName: "",
    lastName: "",
    bio: "",
    username: "",
    joined: "",
    rating: 0,
    reviews: 0,
    rank: "",
    level: 0,
    verified: false,
  });

  // Determine if viewing own profile
  // Replace with actual logged-in user ID logic from your auth system
  const loggedInUserId = "123"; // Example: get from auth context
  const isOwnProfile = true;

  // Mock data for review ratings to match a 4.3 average for 25 reviews
  const reviewRatings = {
    5: 12,
    4: 10,
    3: 2,
    2: 1,
    1: 0,
    0: 0,
  };

  // Function to render stars based on a rating, now using filled and outlined stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="w-4 h-4 fill-[#906EFF] text-[#906EFF]"
        />
      );
    }
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300 stroke-2" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className="w-4 h-4 fill-[#906EFF] text-[#906EFF]" />
          </div>
        </div>
      );
    }
    // Empty stars with a clearer border
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 stroke-2" />
      );
    }
    return stars;
  };

  // Full list of main categories (used for adding interests/skills)
  const mainCategories = [
    "Creative & Design",
    "Technical & IT",
    "Business & Management",
    "Communication & Interpersonal",
    "Health & Wellness",
    "Education & Training",
    "Home & Lifestyle",
    "Handiwork & Maintenance",
    "Digital & Social Media",
    "Language & Translation",
    "Financial & Accounting",
    "Sports & Fitness",
    "Arts & Performance",
    "Culture & Diversity",
    "Research & Critical Thinking",
  ];

  // Full subcategory mapping (used when adding a specific skill)
  const subcategories = {
    "Creative & Design": [
      "Graphic Design",
      "Photography",
      "Video Editing",
      "Illustration",
      "Animation",
    ],
    "Technical & IT": [
      "Web Development",
      "Software Development",
      "IT Support",
      "Network Administration",
      "Cybersecurity",
    ],
    "Business & Management": [
      "Project Management",
      "Business Consulting",
      "Human Resources",
      "Operations Management",
      "Marketing Strategy",
    ],
    "Communication & Interpersonal": [
      "Customer Service",
      "Public Relations",
      "Copywriting",
      "Translation",
      "Social Media Management",
    ],
    "Health & Wellness": [
      "Nutrition Coaching",
      "Personal Training",
      "Mental Health Counseling",
      "Yoga Instruction",
      "Physical Therapy",
    ],
    "Education & Training": [
      "Tutoring",
      "Language Instruction",
      "Corporate Training",
      "Curriculum Development",
      "Test Preparation",
    ],
    "Home & Lifestyle": [
      "Interior Decorating",
      "Cleaning Services",
      "Gardening",
      "Event Planning",
      "Personal Assistance",
    ],
    "Handiwork & Maintenance": [
      "Furniture Assembly",
      "Sewing & Alterations",
      "Handyman Services",
      "Painting & Decorating",
      "Crafting",
    ],
    "Digital & Social Media": [
      "Social Media Management",
      "Content Creation",
      "SEO",
      "Digital Advertising",
      "Email Marketing",
    ],
    "Language & Translation": [
      "Translation",
      "Interpretation",
      "Language Tutoring",
      "Transcription",
      "Localization",
    ],
    "Financial & Accounting": [
      "Bookkeeping",
      "Tax Preparation",
      "Financial Planning",
      "Payroll Services",
      "Auditing",
    ],
    "Sports & Fitness": [
      "Personal Training",
      "Group Fitness Instruction",
      "Sports Coaching",
      "Nutrition for Athletes",
      "Physical Therapy",
    ],
    "Arts & Performance": [
      "Music Lessons",
      "Dance Instruction",
      "Acting Coaching",
      "Visual Arts",
      "Creative Writing",
    ],
    "Culture & Diversity": [
      "Diversity Training",
      "Cultural Consulting",
      "Language & Cultural Exchange",
      "Community Outreach",
      "Inclusion Workshops",
    ],
    "Research & Critical Thinking": [
      "Market Research",
      "Data Analysis",
      "Academic Research",
      "Competitive Analysis",
      "Strategic Planning",
    ],
  };

  // A smaller list used to render the UI initially (this was in your original file).
  const skillCategories = [
    {
      name: "Creative & Design",
      skills: ["Graphic Design", "Illustration", "Photography"],
    },
    {
      name: "Education & Training",
      skills: ["Tutoring", "Test Preparation"],
    },
    {
      name: "Home & Lifestyle",
      skills: ["Event Planning"],
    },
    {
      name: "Sports & Fitness",
      skills: ["Personal Training", "Sports Coaching", "Physical Therapy"],
    },
    {
      name: "Arts & Performance",
      skills: ["Creative Writing", "Visual Arts"],
    },
  ];

  const interestsInitial = [
    "Digital Art",
    "Photography",
    "Travel",
    "Indie Music",
    "Film Analysis",
  ];

  // ----------------------------
  // NEW: Editable Skills & Interests
  // ----------------------------

  // verification popup state
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("unverified"); // "unverified" | "pending"
  const [idFile, setIdFile] = useState(null); // File object
  const [idPreviewUrl, setIdPreviewUrl] = useState(null); // local preview URL for images

  // For Basic Information editing
  const [basicInfoEditing, setBasicInfoEditing] = useState(false);
  const [editableFirstName, setEditableFirstName] = useState(
    user.firstName || ""
  );
  const [editableLastName, setEditableLastName] = useState(user.lastName || "");
  const [editableBio, setEditableBio] = useState(user?.bio || "");

  // editing toggles
  const [skillsEditing, setSkillsEditing] = useState(false);
  const [interestsEditing, setInterestsEditing] = useState(false);

  // For adding specific skills in a category
  const [selectedSpecificSkills, setSelectedSpecificSkills] = useState([]);

  // For adding interests
  const [selectedInterests, setSelectedInterests] = useState([]);

  // selected skills state:
  // array of objects: { category: "Creative & Design", skills: ["Graphic Design", ...] }
  // initialize with a few groups derived from skillCategories (you can adjust this initial state)
  const [selectedSkillGroups, setSelectedSkillGroups] = useState(() =>
    skillCategories.map((g) => ({ category: g.name, skills: [...g.skills] }))
  );

  // interests
  const [userInterests, setUserInterests] = useState(interestsInitial);

  // add/remove category (removes whole group)
  const removeSkillCategory = (category) => {
    setSelectedSkillGroups((prev) =>
      prev.filter((g) => g.category !== category)
    );
  };

  // remove a specific skill within a category
  const removeSpecificSkill = (category, skillToRemove) => {
    setSelectedSkillGroups(
      (prev) =>
        prev
          .map((g) =>
            g.category === category
              ? { ...g, skills: g.skills.filter((s) => s !== skillToRemove) }
              : g
          )
          .filter((g) => g.skills.length > 0) // optional: remove empty groups
    );
  };

  // Add flow state for skills add form
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [addSkillCategory, setAddSkillCategory] = useState("");
  const [addSkillSub, setAddSkillSub] = useState("");

  // Add skill action (category -> specific skill)
  const totalSpecificSkillsCount = selectedSkillGroups.reduce(
    (sum, g) => sum + g.skills.length,
    0
  );

  const MAX_SKILLS = 6;

  const handleAddSkill = () => {
    if (!addSkillCategory || selectedSpecificSkills.length === 0) return;

    if (
      selectedSkillGroups.length >= 6 &&
      !selectedSkillGroups.some((g) => g.category === addSkillCategory)
    ) {
      alert("You can only have up to 6 general skills.");
      return;
    }

    setSelectedSkillGroups((prev) => {
      const existing = prev.find((g) => g.category === addSkillCategory);
      if (existing) {
        if (existing.skills.length + selectedSpecificSkills.length > 5) {
          alert("Max 5 specific skills per category.");
          return prev;
        }
        return prev.map((g) =>
          g.category === addSkillCategory
            ? {
                ...g,
                skills: [...new Set([...g.skills, ...selectedSpecificSkills])],
              }
            : g
        );
      }
      return [
        ...prev,
        { category: addSkillCategory, skills: selectedSpecificSkills },
      ];
    });

    setAddSkillCategory("");
    setSelectedSpecificSkills([]);
    setShowAddSkillForm(false);
  };

  // Interests add/remove
  const removeInterest = (interest) => {
    setUserInterests((prev) => prev.filter((i) => i !== interest));
  };

  const [showAddInterestForm, setShowAddInterestForm] = useState(false);
  const [addInterestValue, setAddInterestValue] = useState("");

  // call this when input changes
  const handleIdFileChange = (file) => {
    if (!file) {
      setIdFile(null);
      setIdPreviewUrl(null);
      return;
    }

    setIdFile(file);

    // if it's an image, create a preview URL
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setIdPreviewUrl(url);
    } else {
      setIdPreviewUrl(null);
    }
  };

  const handleAddInterest = () => {
    setUserInterests((prev) => [...new Set([...prev, ...selectedInterests])]);
    setSelectedInterests([]);
    setShowAddInterestForm(false);
  };

  // ----------------------------
  // existing memoized reviews etc
  // ----------------------------
  const sortedReviews = useMemo(() => {
    let sorted = [...reviews];
    if (sortOption === "Latest") {
      sorted.sort(
        (a, b) =>
          new Date(b.tradeCompletionDate) - new Date(a.tradeCompletionDate)
      );
    } else if (sortOption === "Highest Rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "Lowest Rating") {
      sorted.sort((a, b) => a.rating - b.rating);
    }
    return sorted;
  }, [reviews, sortOption]);

  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  // Handler for editing all credentials
  const handleEditAllCredentials = () => {
    setEditingCredentials("all");
  };

  // Handler for editing a single credential
  const handleEditSingleCredential = (credential) => {
    setEditingCredentials(credential);
  };

  // Handler for saving changes
  const handleSaveCredentials = (updatedCredentials) => {
    if (Array.isArray(editingCredentials)) {
      setCredentials(updatedCredentials);
    } else {
      const updatedList = credentials.map((cred) =>
        cred.id === updatedCredentials[0].id ? updatedCredentials[0] : cred
      );
      setCredentials(updatedList);
    }
    setEditingCredentials(null);
  };

  // Conditionally render the edit page or the profile page
  if (editingCredentials) {
    const credsToEdit =
      editingCredentials === "all" ? credentials : [editingCredentials];
    return (
      <div
        className={`px-6 pb-20 pt-10 mx-auto max-w-[940px] text-white ${inter.className}`}
      >
        <EditCredentialsPage
          credentialsToEdit={credsToEdit}
          onCancel={() => setEditingCredentials(null)}
          onSave={handleSaveCredentials}
        />
      </div>
    );
  }
// Inline Button component
const Button = ({ children, className, onClick, ...props }) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Inline helper for Trade Details to keep code clean
const TradePill = ({ content }) => {
  return (
    <div
      className={clsx(
        "inline-flex items-center px-[15px] py-[10px] text-[13px] rounded-full border-2 text-white overflow-hidden"
      )}
    >
      <span className="whitespace-nowrap">{content}</span>
    </div>
  );
};

// Inline ReviewCard component with updated design
const ReviewCard = ({ review }) => {
  const {
    requester,
    tradePartner,
    tradeCompletionDate,
    requestTitle,
    offerTitle,
    rating,
    reviewDescription,
    likes,
  } = review;
  const [isLiked, setIsLiked] = useState(false);

  // Function to render stars based on a rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="w-5 h-5 fill-[#906EFF] text-[#906EFF]"
        />
      );
    }
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-5 h-5">
          <Star className="absolute w-5 h-5 text-gray-300 stroke-2" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className="w-5 h-5 fill-[#906EFF] text-[#906EFF]" />
          </div>
        </div>
      );
    }
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 stroke-2" />
      );
    }
    return stars;
  };

  // Function to handle the report action
  const handleReport = () => {
    // In a real app, this would be a client-side navigation or a more complex interaction
    console.log(`Navigating to help form for reporting review by ${requester}`);
    window.location.href = "/help#help-form";
  };

  return (
    <div
      className="flex flex-col gap-[20px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] relative transition-all duration-300 hover:scale-[1.01]"
      style={{
        background:
          "radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)",
      }}
    >
      <div className="flex justify-between items-start">
        {/* User and Partner Avatars with 'X' separator, names, and date */}
        <div className="flex items-start gap-[15px]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {/* Use the defaultavatar.png for the review cards */}
              <Image
                src="/assets/defaultavatar.png"
                alt={`${tradePartner}'s avatar`}
                width={35}
                height={35}
                className="rounded-full object-cover"
              />
              <Icon icon="ic:baseline-close" className="w-4 h-4 text-white" />
              {/* Use the defaultavatar.png for the review cards */}
              <Image
                src="/assets/defaultavatar.png"
                alt={`${requester}'s avatar`}
                width={35}
                height={35}
                className="rounded-full object-cover"
              />
              <div className="flex flex-col justify-start">
                <span className="font-semibold text-white text-base">{`${tradePartner} & ${requester}`}</span>
                <span className="text-white/50 text-base">
                  {tradeCompletionDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-5 text-white text-sm">
          {/* Rating number on the left */}
          <span className="text-lg">{safeFixed(user.rating, 1)}</span>
          <div className="flex items-center gap-[5px]">
            {renderStars(rating)}
          </div>
          <button
            onClick={handleReport}
            className="p-1 rounded-full hover:bg-white/10 transition"
          >
            <Flag className="w-5 h-5 cursor-pointer text-white/50" />
          </button>
        </div>
      </div>

      {/* Trade Details and Review Text */}
      <div className="flex flex-col md:flex-row gap-[25px] w-full">
        {/* Trade Details Section */}
        <div className="flex-1 flex flex-col gap-[25px]">
          <div className="flex items-center gap-[15px] w-full">
            <h6 className="text-white text-base text-white/50 whitespace-nowrap">
              Name requested
            </h6>
            <div className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-2 text-white bg-[#284CCC]/20 border-[#284CCC]/80 text-[#C1C9E1]">
              <span className="whitespace-nowrap">{requestTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-[15px] w-full">
            <h6 className="text-white text-base text-white/50 whitespace-nowrap">
              In exchange for
            </h6>
            <div className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-2 text-white bg-[#3D2490]/20 border-[#3D2490]/80 text-[#C1C9E1]">
              <span className="whitespace-nowrap">{offerTitle}</span>
            </div>
          </div>
        </div>

        {/* Review Text Section */}
        <div className="flex-1 flex flex-col gap-2 md:text-right">
          <p className="text-white text-base">{reviewDescription}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-1.5 text-white text-sm">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="transition-transform transform hover:scale-110"
          >
            <Heart
              className={clsx(
                "w-5 h-5 transition-colors duration-300",
                isLiked ? "fill-[#906EFF] stroke-[#906EFF]" : "stroke-white"
              )}
            />
          </button>
          <span>{likes + (isLiked ? 1 : 0)}</span>
        </div>
        <div className="flex gap-4">
          <Button
            className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]"
            onClick={() => onTradeAgain?.(review)}
          >
            Trade again
          </Button>

          <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]">
            View details
          </Button>
        </div>
      </div>
    </div>
  );
};

const EditCredentialsPage = ({ credentialsToEdit, onCancel, onSave }) => {
  // Main Categories and Subcategories data
  const mainCategories = [
    "Creative & Design",
    "Technical & IT",
    "Business & Management",
    "Communication & Interpersonal",
    "Health & Wellness",
    "Education & Training",
    "Home & Lifestyle",
    "Handiwork & Maintenance",
    "Digital & Social Media",
    "Language & Translation",
    "Financial & Accounting",
    "Sports & Fitness",
    "Arts & Performance",
    "Culture & Diversity",
    "Research & Critical Thinking",
  ];

  const subcategories = {
    "Creative & Design": [
      "Graphic Design",
      "Photography",
      "Video Editing",
      "Illustration",
      "Animation",
    ],
    "Technical & IT": [
      "Web Development",
      "Software Development",
      "IT Support",
      "Network Administration",
      "Cybersecurity",
    ],
    "Business & Management": [
      "Project Management",
      "Business Consulting",
      "Human Resources",
      "Operations Management",
      "Marketing Strategy",
    ],
    "Communication & Interpersonal": [
      "Customer Service",
      "Public Relations",
      "Copywriting",
      "Translation",
      "Social Media Management",
    ],
    "Health & Wellness": [
      "Nutrition Coaching",
      "Personal Training",
      "Mental Health Counseling",
      "Yoga Instruction",
      "Physical Therapy",
    ],
    "Education & Training": [
      "Tutoring",
      "Language Instruction",
      "Corporate Training",
      "Curriculum Development",
      "Test Preparation",
    ],
    "Home & Lifestyle": [
      "Interior Decorating",
      "Cleaning Services",
      "Gardening",
      "Event Planning",
      "Personal Assistance",
    ],
    "Handiwork & Maintenance": [
      "Furniture Assembly",
      "Sewing & Alterations",
      "Handyman Services",
      "Painting & Decorating",
      "Crafting",
    ],
    "Digital & Social Media": [
      "Social Media Management",
      "Content Creation",
      "SEO",
      "Digital Advertising",
      "Email Marketing",
    ],
    "Language & Translation": [
      "Translation",
      "Interpretation",
      "Language Tutoring",
      "Transcription",
      "Localization",
    ],
    "Financial & Accounting": [
      "Bookkeeping",
      "Tax Preparation",
      "Financial Planning",
      "Payroll Services",
      "Auditing",
    ],
    "Sports & Fitness": [
      "Personal Training",
      "Group Fitness Instruction",
      "Sports Coaching",
      "Nutrition for Athletes",
      "Physical Therapy",
    ],
    "Arts & Performance": [
      "Music Lessons",
      "Dance Instruction",
      "Acting Coaching",
      "Visual Arts",
      "Creative Writing",
    ],
    "Culture & Diversity": [
      "Diversity Training",
      "Cultural Consulting",
      "Language & Cultural Exchange",
      "Community Outreach",
      "Inclusion Workshops",
    ],
    "Research & Critical Thinking": [
      "Market Research",
      "Data Analysis",
      "Academic Research",
      "Competitive Analysis",
      "Strategic Planning",
    ],
  };

  const defaultCredential = {
    title: "",
    org: "",
    issueDate: "",
    expiryDate: "",
    id: "",
    url: "",
    skills: [],
    skillCategory: "",
  };

  // Initialize state with the credentials data passed as a prop, adding a skillCategory field
  const [formData, setFormData] = useState(() =>
    credentialsToEdit.map((cred) => ({
      ...cred,
      skillCategory: "", // Initialize new skillCategory field
    }))
  );

  // Helper function to update a specific field of a specific credential
  const handleChange = (index, field, value) => {
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [field]: value };
    setFormData(newFormData);
  };

  // Handle changes for the main skill category dropdown
  const handleCategoryChange = (index, value) => {
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], skillCategory: value };
    setFormData(newFormData);
  };

  // Handle changes for the associated skills dropdown
  const handleSkillDropdownChange = (index, value) => {
    const newFormData = [...formData];
    // Check if the skill is not already in the array before adding
    if (value && !newFormData[index].skills.includes(value)) {
      newFormData[index].skills.push(value);
      setFormData(newFormData);
    }
  };

  // Function to remove a skill from the tags
  const handleRemoveSkill = (credentialIndex, skillToRemove) => {
    const newFormData = [...formData];
    const newSkills = newFormData[credentialIndex].skills.filter(
      (skill) => skill !== skillToRemove
    );
    newFormData[credentialIndex] = {
      ...newFormData[credentialIndex],
      skills: newSkills,
    };
    setFormData(newFormData);
  };

  // Function to add a new empty credential
  const addCredential = () => {
    setFormData([...formData, defaultCredential]);
  };

  // --- Trade Again modal state ---
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatReview, setRepeatReview] = useState(null);

  const openRepeatModal = (review) => {
    setRepeatReview(review);
    setShowRepeatModal(true);
  };
  const closeRepeatModal = () => {
    setShowRepeatModal(false);
    setRepeatReview(null);
  };
  const confirmRepeatTrade = () => {
    // placeholder; backend integration later
    alert(`Trade request sent to ${repeatReview?.requester || "user"}.`);
    closeRepeatModal();
  };

  return (
    <div className="flex flex-col gap-[25px]">
      <h4 className="text-[22px] font-semibold">
        Edit Credentials
        {formData.length > 1 && ` (${formData.length} items)`}
      </h4>

      <div className="flex flex-col gap-8">
        {formData.map((cred, index) => (
          <div
            key={index}
            className="flex flex-col gap-5 p-6 border border-white/20 rounded-[15px]"
          >
            {formData.length > 1 && (
              <h5 className="text-lg font-semibold text-white/70">
                Credential {index + 1}
              </h5>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Name, Issuing Org, Issue Date, Expiry Date */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cred.title}
                    onChange={(e) =>
                      handleChange(index, "title", e.target.value)
                    }
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                    placeholder="e.g., Adobe Certified Expert"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">
                    Issuing Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cred.org}
                    onChange={(e) => handleChange(index, "org", e.target.value)}
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                    placeholder="e.g., Adobe Systems"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month" // Changed from type="date" to type="month"
                    value={cred.issueDate}
                    onChange={(e) =>
                      handleChange(index, "issueDate", e.target.value)
                    }
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Expiry Date</label>
                  <input
                    type="month" // Changed from type="date" to type="month"
                    value={cred.expiryDate}
                    onChange={(e) =>
                      handleChange(index, "expiryDate", e.target.value)
                    }
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                  />
                </div>
              </div>

              {/* Right Column - Cred ID, Cred URL, Skill Category, Associated Skills */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Credential ID</label>
                  <input
                    type="text"
                    value={cred.id}
                    onChange={(e) => handleChange(index, "id", e.target.value)}
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                    placeholder="e.g., ACE-123456789"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">
                    Credential URL
                  </label>
                  <input
                    type="url"
                    value={cred.url}
                    onChange={(e) => handleChange(index, "url", e.target.value)}
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                    placeholder="e.g., https://www.adobe.com/cert..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">
                    Skill Category
                  </label>
                  <select
                    value={cred.skillCategory}
                    onChange={(e) =>
                      handleCategoryChange(index, e.target.value)
                    }
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {mainCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">
                    Associated Skills
                  </label>
                  <select
                    onChange={(e) =>
                      handleSkillDropdownChange(index, e.target.value)
                    }
                    className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                    disabled={!cred.skillCategory}
                    value=""
                  >
                    <option value="" disabled>
                      Select subcategory
                    </option>
                    {cred.skillCategory &&
                      subcategories[cred.skillCategory]?.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cred.skills.map((skill, skillIndex) => (
                      <div
                        key={skillIndex}
                        className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1 rounded-full cursor-default"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(index, skill)}
                          className="flex items-center justify-center w-4 h-4 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                          aria-label={`Remove ${skill}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCredential}
        className="text-[#0038FF] hover:underline text-sm font-semibold mt-4 text-left"
      >
        + Add credential
      </button>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          onClick={onCancel}
          className="bg-white/10 text-white hover:bg-white/20"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          className="bg-[#0038FF] hover:bg-[#1a4dff] text-white shadow-[0px_0px_15px_#284CCC]"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

  // Original Profile Page content
  return (
    <div
      className={`px-6 pb-20 pt-10 mx-auto max-w-[940px] text-white ${inter.className}`}
    >
      {/* SECTION 0 - PAGE TITLE */}
      <h4 className="text-[22px] font-semibold mb-10">My Profile</h4>

      {/* SECTION 1 - BASIC INFORMATION */}
      <div className="flex gap-[50px] relative">
        {/* Profile Picture */}
        <div className="w-[200px] h-[200px] relative flex-shrink-0">
          <Image
            src={toAbsolute(user?.profilePic) || "/assets/defaultavatar.png"}
            alt={`${user?.firstName || ""} ${user?.lastName || ""}`}
            width={200}
            height={200}
            className="rounded-full shadow-[0_0_50px_#906EFF99] object-cover"
            
          />
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col">
          {/* Top Row: Name + Verified Badge */}
          <div className="flex items-center gap-3 mb-[5px]">
            {basicInfoEditing ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={editableFirstName}
                  onChange={(e) => setEditableFirstName(e.target.value)}
                  className="bg-[#120A2A] border border-white/30 rounded-[15px] p-2 text-white text-[20px] font-semibold w-full max-w-[150px]"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={editableLastName}
                  onChange={(e) => setEditableLastName(e.target.value)}
                  className="bg-[#120A2A] border border-white/30 rounded-[15px] p-2 text-white text-[20px] font-semibold w-full max-w-[150px]"
                />
              </div>
            ) : (
              <h3 className="text-[26px] font-semibold">
                 {`${user.firstName} ${user.lastName}`.trim() || "—"}
              </h3>
            )}
            {user.verified && (
              <Icon
                icon="mdi:check-decagram"
                className="text-[#0038FF] w-6 h-6"
              />
            )}
          </div>

          {/* Username + Joined Date */}
          <div className="flex text-white/50 text-[16px] mb-[20px] gap-[25px]">
            <span>@{user.username || "—"}</span>
            <span>Joined {user.joined || "—"}</span>
          </div>

          {/* Buttons: Edit, Settings (only if own profile) */}
          {isOwnProfile ? (
            <div className="absolute top-0 right-0 flex gap-4">
              <button
                className="text-white hover:bg-[#1A0F3E] px-3 py-2 flex items-center gap-2 rounded-[10px] transition"
                onClick={() => setBasicInfoEditing(true)}
              >
                <Icon icon="mdi:pencil" className="w-5 h-5" />
                Edit
              </button>
              <Link href={`/home/profile/${params.userId}/settings`}>
                <button className="text-white hover:bg-[#1A0F3E] p-2 rounded-[10px] transition">
                  <Icon icon="mdi:cog" className="w-5 h-5" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="absolute top-0 right-0">
              <Link href="/home/messages">
                <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[16px] rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC] flex items-center gap-2">
                  <Icon icon="mdi:email-outline" className="w-4 h-4" />
                  Message
                </Button>
              </Link>
            </div>
          )}

          {/* Rating + Rank + Level */}
          <div className="flex items-center gap-6 mb-[20px]">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:star"
                className="text-[#906EFF] w-5 h-5 fill-current"
              />
              <span className="font-semibold text-[16px]">
                {user.rating.toFixed(1)}{" "}
                <span className="text-white/50">({user.reviews})</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Image
                src="/assets/lvlrank_icon.png"
                alt="Rank"
                width={20}
                height={20}
              />
                <span>{(user?.rank || "Rank").toString().charAt(0).toUpperCase() + (user?.rank || "Rank").toString().slice(1)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Image
                src="/assets/lvlbar.png"
                alt="Level bar"
                width={220}
                height={20}
              />
              <span className="text-[16px]">LVL {user.level}</span>
            </div>
          </div>

          {/* Bio */}
          <div className="w-full mb-4">
            {basicInfoEditing ? (
              <textarea
                value={editableBio}
                onChange={(e) => setEditableBio(e.target.value)}
                rows={4}
                className="bg-[#120A2A] border border-white/30 rounded-[15px] p-2 text-white w-full"
              />
            ) : (
              <p className="w-full leading-[1.6]">{user.bio}</p>
            )}
          </div>

          {/* Save / Cancel when editing */}
          {basicInfoEditing && (
            <div className="flex gap-3 mb-4">
              <Button
                onClick={() => {
                  setUser((prev) => ({
                    ...prev,
                    firstName: editableFirstName,
                    lastName: editableLastName,
                    name: `${editableFirstName} ${editableLastName}`,
                    bio: editableBio,
                  }));
                  setBasicInfoEditing(false);
                }}
                className="bg-[#0038FF] text-white rounded-[15px]"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setEditableFirstName(user.firstName || "");
                  setEditableLastName(user.lastName || "");
                  setEditableBio(user.bio);
                  setBasicInfoEditing(false);
                }}
                className="bg-white/10 text-white rounded-[15px]"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Get Verified Button area */}
          {isOwnProfile && (
            <div className="w-full flex justify-end">
              {verificationStatus === "unverified" && (
                <button
                  onClick={() => setShowVerificationPopup(true)}
                  className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow flex items-center gap-2"
                >
                  <Icon icon="material-symbols:verified" className="w-4 h-4" />
                  <span>Get Verified</span>
                </button>
              )}
              {verificationStatus === "pending" && (
                <button
                  disabled
                  className="bg-gray-600 text-white text-sm rounded-[15px] px-5 py-2 flex items-center gap-2"
                >
                  <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                  <span>Waiting for Verification</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==== YOUR SKILLS ==== */}
      <div className="mt-[50px] flex flex-col gap-[25px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <h5 className="text-lg font-semibold">Your Skills</h5>
            {isOwnProfile && (
              <button
                onClick={() => {
                  setSkillsEditing((s) => !s);
                  setShowAddSkillForm(false);
                }}
                aria-label="Edit skills"
              >
                <PencilIcon
                  className={
                    skillsEditing
                      ? "w-5 h-5 text-[#906EFF]"
                      : "w-5 h-5 text-white"
                  }
                />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-[10px]">
          {selectedSkillGroups.map((group, index) => (
            <div key={group.category} className="relative">
              <div
                onClick={() => toggleCategory(index)}
                className={clsx(
                  "inline-flex items-center h-[30px] px-[15px] gap-2",
                  "rounded-full border-2 transition-colors duration-300",
                  expanded[index]
                    ? "bg-white text-black"
                    : "text-white border-white"
                )}
              >
                <span className="text-[16px] leading-none">
                  {group.category}
                </span>

                {skillsEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSkillCategory(group.category);
                    }}
                    className="ml-2 w-5 h-5 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
                    aria-label={`Remove ${group.category}`}
                  >
                    &times;
                  </button>
                )}

                <Icon
                  icon={expanded[index] ? "mdi:chevron-up" : "mdi:chevron-down"}
                  className={clsx(
                    "transition-transform",
                    expanded[index] ? "text-black" : "text-white"
                  )}
                  width={16}
                />
              </div>

              {expanded[index] && (
                <div className="absolute left-0 mt-2 p-3 rounded-[15px] border border-white/20 bg-[#050015] z-10 flex flex-col gap-2 transition-all duration-300 w-[260px]">
                  {group.skills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-[12px] py-[8px] text-[13px] rounded-full border-[1.5px] border-white/50 text-white/50"
                    >
                      <span>{skill}</span>
                      {skillsEditing && (
                        <button
                          onClick={() =>
                            removeSpecificSkill(group.category, skill)
                          }
                          className="ml-2 w-6 h-6 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
                          aria-label={`Remove ${skill}`}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* + Add only visible in edit mode */}
          {skillsEditing && (
            <div className="flex items-center">
              <button
                onClick={() => setShowAddSkillForm((v) => !v)}
                className="inline-flex items-center h-[30px] px-[12px] text-[16px] gap-2 rounded-[15px] border-2 border-dashed border-white text-white"
                aria-label="Add skill"
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {showAddSkillForm && skillsEditing && (
          <div className="mt-3 flex flex-col gap-3 bg-[#120A2A] p-4 rounded-[15px]">
            <select
              value={addSkillCategory}
              onChange={(e) => {
                setAddSkillCategory(e.target.value);
                setSelectedSpecificSkills([]);
              }}
              className="bg-[#1E133F] text-white border-[1.5px] border-white/30 rounded-[15px] p-2 text-sm"
            >
              <option value="">Select category</option>
              {mainCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* checkbox list for specific skills (multi-select) */}
            {addSkillCategory && (
              <div className="flex flex-col gap-2 p-3 rounded-[15px] border border-white/10 bg-transparent">
                {(subcategories[addSkillCategory] || []).map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecificSkills.includes(skill)}
                      onChange={(e) => {
                        const existingGroup = selectedSkillGroups.find(
                          (g) => g.category === addSkillCategory
                        );
                        const existingCount = existingGroup
                          ? existingGroup.skills.length
                          : 0;
                        if (e.target.checked) {
                          // prevent exceeding 5 total specific skills for this category
                          if (
                            existingCount + selectedSpecificSkills.length + 1 >
                            5
                          ) {
                            alert("Max 5 specific skills per category.");
                            return;
                          }
                          setSelectedSpecificSkills((prev) => [...prev, skill]);
                        } else {
                          setSelectedSpecificSkills((prev) =>
                            prev.filter((s) => s !== skill)
                          );
                        }
                      }}
                    />
                    <span className="text-white">{skill}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleAddSkill}
                className="bg-[#0038FF] hover:bg-[#1a4dff] text-white rounded-[15px]"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddSkillForm(false);
                  setAddSkillCategory("");
                  setSelectedSpecificSkills([]);
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-[15px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==== YOUR INTERESTS ==== */}
      <div className="mt-[50px] flex flex-col gap-[25px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <h5 className="text-lg font-semibold">Your Interests</h5>
            {isOwnProfile && (
              <button
                onClick={() => {
                  setInterestsEditing((s) => !s);
                  setShowAddInterestForm(false);
                }}
                aria-label="Edit interests"
              >
                <PencilIcon
                  className={
                    interestsEditing
                      ? "w-5 h-5 text-[#906EFF]"
                      : "w-5 h-5 text-white"
                  }
                />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-[15px]">
          {userInterests.map((interest) => (
            <div
              key={interest}
              className="flex items-center gap-2 h-[30px] px-[15px] rounded-full border-2 border-white text-white"
            >
              <span>{interest}</span>
              {interestsEditing && (
                <button
                  onClick={() => removeInterest(interest)}
                  className="ml-1 w-5 h-5 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
                  aria-label={`Remove ${interest}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}

          {/* + Add only appears in edit mode */}
          {interestsEditing && (
            <div className="flex items-center">
              <button
                onClick={() => setShowAddInterestForm((v) => !v)}
                className="inline-flex items-center h-[30px] px-[12px] text-[16px] gap-2 rounded-[15px] border-2 border-dashed border-white text-white"
                aria-label="Add interest"
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {showAddInterestForm && interestsEditing && (
          <div className="mt-3 flex flex-col gap-2 bg-[#120A2A] p-4 rounded-[15px]">
            {/* fixed interests only — checkbox list */}
            {mainCategories.map((c) => (
              <label
                key={c}
                className="flex items-center gap-3 px-2 py-2 rounded-[10px] hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(c)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInterests((prev) => [...prev, c]);
                    } else {
                      setSelectedInterests((prev) =>
                        prev.filter((i) => i !== c)
                      );
                    }
                  }}
                />
                <span className="text-white">{c}</span>
              </label>
            ))}

            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleAddInterest}
                className="bg-[#0038FF] hover:bg-[#1a4dff] text-white rounded-[15px]"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddInterestForm(false);
                  setSelectedInterests([]);
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-[15px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 3 - Licenses & Certifications */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <h5 className="text-white text-lg font-semibold flex items-center gap-[15px]">
              Your Licenses & Certifications
              {/* Edit all credentials button */}
              {isOwnProfile && (
                <button onClick={handleEditAllCredentials}>
                  <PencilIcon className="w-5 h-5 text-white cursor-pointer" />
                </button>
              )}
            </h5>
          </div>

          {/* The scrollable container for the credentials */}
          <div
            className={clsx(
              "grid gap-[25px] grid-cols-2",
              !showAllCreds && "max-h-[420px] overflow-y-auto"
            )}
          >
            {credentials.map((cred, index) => (
              <div
                key={index}
                className="border border-white/20 rounded-[15px] p-[25px] flex flex-col justify-between relative"
              >
                {/* Pencil icon for editing a single credential */}
                {isOwnProfile && (
                  <button
                    onClick={() => handleEditSingleCredential(cred)}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 cursor-pointer" />
                  </button>
                )}
                {/* Group 1 */}
                <div>
                  <h6 className="text-[20px] font-semibold mb-[5px]">
                    {cred.title}
                  </h6>
                  <p className="text-[16px]">{cred.org}</p>
                </div>

                {/* Group 2 */}
                <div className="mt-[15px] text-[16px] text-white/50 leading-[1.6]">
                  Issued {cred.issueDate} • Expires {cred.expiryDate}
                  <br />
                  ID: {cred.id}
                </div>

                {/* Group 3 */}
                <div className="mt-[15px]">
                  <a
                    href={cred.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#0038FF] hover:underline transition-colors"
                  >
                    View credential
                    <Icon icon="mdi:arrow-top-right" className="w-4 h-4" />
                  </a>
                </div>

                {/* Group 4: Skills */}
                <div className="mt-[20px]">
                  <div className="text-white/50 text-[16px] mb-[10px]">
                    Associated Skills
                  </div>
                  <div className="flex flex-wrap gap-[10px]">
                    {cred.skills.map((skill, skillIndex) => (
                      <TradePill key={skillIndex} content={skill} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Show More / Show Less Button */}
          {credentials.length > 4 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowAllCreds(!showAllCreds)}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                {showAllCreds ? (
                  <>
                    Show Less <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 4 - REVIEWS */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h5 className="text-white text-lg font-semibold">
                What others say
              </h5>
              <span className="text-[16px] text-white/50 mt-[5px]">
                25 trades & reviews
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center text-white text-[16px] border border-white/20 rounded-[10px] h-[30px] px-3"
              >
                {sortOption}{" "}
                <ChevronDownIcon className="ml-2 h-4 w-4 text-white" />
              </button>
              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#120A2A] rounded-xl border border-white/20 shadow-lg py-1 z-10">
                  {["Latest", "Highest Rating", "Lowest Rating"].map(
                    (option) => (
                      <button
                        key={option}
                        onClick={() => handleSortChange(option)}
                        className={clsx(
                          "block w-full text-left px-4 py-2 text-sm transition-colors",
                          option === sortOption
                            ? "text-[#906EFF] bg-white/10"
                            : "text-white hover:bg-white/10"
                        )}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rating Analytics */}
          <div className="flex items-start gap-[50px]">
            {/* Overall Rating Group - now at the top left */}
            <div className="flex flex-col">
              <div className="flex items-end gap-[10px]">
                <span className="text-[40px] font-bold leading-none">
                  {safeFixed(user.rating, 1)}
                </span>
                <span className="text-[16px] text-white/50 pb-2">
                  ({Number(user.reviews) || 0})
                </span>
              </div>
              <div className="flex items-center mt-[20px]">
                {renderStars(user.rating)}
              </div>
            </div>

            {/* Rating Bars */}
            <div className="flex flex-col gap-[10px]">
              {Object.keys(reviewRatings)
                .reverse()
                .map((rating) => (
                  <div key={rating} className="flex items-center gap-[15px]">
                    <span className="text-[16px] w-[15px]">{rating}</span>
                    <div className="w-[270px] h-[15px] bg-white/20 rounded-full">
                      <div
                        style={{
                          width: `${
                            (reviewRatings[rating] / user.reviews) * 100
                          }%`,
                        }}
                        className="h-full bg-[#906EFF] rounded-full"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Reviews section using the new ReviewCard component */}
          <div className="mt-8 flex flex-col gap-6">
            {sortedReviews.map((review, index) => (
              <ReviewCard
                key={index}
                review={review}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* === Verification Popup (improved UI) === */}
      {showVerificationPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#120A2A] p-6 rounded-[15px] w-[420px] shadow-lg border border-white/20">
            <div className="flex items-start justify-between">
              <h3 className="text-white text-lg font-semibold">
                Upload your ID
              </h3>
              <button
                onClick={() => {
                  // close & clear selection
                  setShowVerificationPopup(false);
                  setIdFile(null);
                  if (idPreviewUrl) {
                    URL.revokeObjectURL(idPreviewUrl);
                    setIdPreviewUrl(null);
                  }
                }}
                className="p-1 rounded hover:bg-white/10"
                aria-label="Close verification popup"
              >
                <Icon icon="mdi:close" className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <p className="text-white/70 text-sm mt-2 mb-4">
              Please upload a clear image or PDF of your government-issued ID.
              Accepted: JPG, PNG, PDF.
            </p>

            {/* Upload control */}
            <div className="flex items-center gap-3 mb-5">
              <input
                id="id-upload"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  handleIdFileChange(f);
                }}
              />

              {/* Visible button (label) */}
              <label
                htmlFor="id-upload"
                className="cursor-pointer inline-flex items-center gap-2 rounded-[12px] px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm border border-white/20"
              >
                <Icon icon="mdi:upload" className="w-4 h-4" />
                Upload file
              </label>

              {/* Filename or preview */}
              <div className="flex-1 min-w-0">
                {idFile ? (
                  <div className="flex items-center gap-3">
                    {idPreviewUrl ? (
                      <img
                        src={idPreviewUrl}
                        alt="ID preview"
                        className="w-12 h-8 object-cover rounded-sm border border-white/10"
                      />
                    ) : (
                      <span className="inline-block w-12 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/70">
                        PDF
                      </span>
                    )}
                    <span className="text-white/80 text-sm truncate">
                      {idFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setIdFile(null);
                        if (idPreviewUrl) {
                          URL.revokeObjectURL(idPreviewUrl);
                          setIdPreviewUrl(null);
                        }
                        // clear the native input too
                        const el = document.getElementById("id-upload");
                        if (el) el.value = "";
                      }}
                      className="ml-2 text-white/60 hover:text-white/90"
                      aria-label="Remove selected file"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-white/60 text-sm">
                    No file selected
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  // cancel
                  setShowVerificationPopup(false);
                  setIdFile(null);
                  if (idPreviewUrl) {
                    URL.revokeObjectURL(idPreviewUrl);
                    setIdPreviewUrl(null);
                  }
                  const el = document.getElementById("id-upload");
                  if (el) el.value = "";
                }}
                className="bg-white/10 text-white rounded-[15px] px-4 py-2 hover:bg-white/20"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!idFile) {
                    alert("Please upload an ID first.");
                    return;
                  }
                  // Placeholder: send to backend here. For now mark pending.
                  setVerificationStatus("pending");
                  setShowVerificationPopup(false);

                  // Optionally clear preview
                  if (idPreviewUrl) {
                    URL.revokeObjectURL(idPreviewUrl);
                    setIdPreviewUrl(null);
                  }

                  // Clear the <input>
                  const el = document.getElementById("id-upload");
                  if (el) el.value = "";

                  // feedback to user
                  alert(
                    "Your verification will be processed. You will be notified once approved."
                  );
                }}
                disabled={!idFile}
                className={`rounded-[15px] px-4 py-2 shadow ${
                  idFile
                    ? "bg-[#0038FF] hover:bg-[#1a4dff] text-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
