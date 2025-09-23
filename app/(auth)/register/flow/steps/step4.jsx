"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Category data with icons and selection state
const categories = [
  { id: 1, name: "Creative & Design", icon: "palette" },
  { id: 2, name: "Technical & IT", icon: "laptop" },
  { id: 3, name: "Business & Management", icon: "user-business" },
  { id: 4, name: "Communication & Interpersonal", icon: "communication" },
  { id: 5, name: "Health & Wellness", icon: "health" },
  { id: 6, name: "Education & Training", icon: "education" },
  { id: 7, name: "Home & Lifestyle", icon: "home" },
  { id: 8, name: "Handiwork & Maintenance", icon: "wrench" },
  { id: 9, name: "Digital & Social Media", icon: "people" },
  { id: 10, name: "Languages & Translation", icon: "language" },
  { id: 11, name: "Financial & Accounting", icon: "money" },
  { id: 12, name: "Sports & Fitness", icon: "running" },
  { id: 13, name: "Arts & Performance", icon: "arts" },
  { id: 14, name: "Culture & Diversity", icon: "world" },
  { id: 15, name: "Research & Critical Thinking", icon: "book" },
];

export default function Step4({ step4Data, onDataSubmit, onNext, onPrev }) {
  const [selectedCategories, setSelectedCategories] = useState(
    step4Data.selectedCategories || []
  );

  const [errorMessage, setErrorMessage] = useState("");

  // 🔗 Map real DB ids by category name (e.g., { "Technical & IT": 3, ... })
  const [serverIdByName, setServerIdByName] = useState({});

  // Fetch real categories to get the correct genskills_id mapping
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dj/skills/general/"); // Remove unnecessary empty object
        const data = await res.json(); // [{ genSkills_id, genCateg }]

        // Build a name->id dictionary
        const map = {};
        (Array.isArray(data) ? data : []).forEach((row) => {
          map[row.genCateg] = row.genSkills_id;
        });
        setServerIdByName(map); // Update state with the map of categories to IDs
      } catch (e) {
        console.error("Failed to load general skills:", e); // Log any errors encountered
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (step4Data) {
      setSelectedCategories(step4Data.selectedCategories);
    }
  }, [step4Data]);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];

      // Clear error if there's now at least one selection
      if (updated.length > 0) {
        setErrorMessage("");
      }

      return updated;
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      setErrorMessage("Please select at least one category.");
      return;
    }
    setErrorMessage("");

    // Save selected categories to the parent
    onDataSubmit({
      selectedCategories, // Pass selected categories to the parent
    });

    onNext(); // Proceed to next step (Step 5)
  };

  const handlePrev = () => {
    onPrev({ selectedCategories });
  };

  // ⬇️ Your existing icon renderer (unchanged)
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "laptop":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 18C21.1 18 22 17.1 22 16V6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V16C2 17.1 2.9 18 4 18H0V20H24V18H20ZM4 6H20V16H4V6Z"
              fill="currentColor"
            />
          </svg>
        );
      case "palette":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M10 20C8.63333 20 7.34167 19.7373 6.125 19.212C4.90833 18.6867 3.846 17.97 2.938 17.062C2.03 16.154 1.31333 15.0917 0.788 13.875C0.262667 12.6583 0 11.3667 0 10C0 8.61667 0.271 7.31667 0.813 6.1C1.355 4.88333 2.08833 3.825 3.013 2.925C3.93767 2.025 5.01667 1.31267 6.25 0.788C7.48333 0.263333 8.8 0.000666667 10.2 0C11.5333 0 12.7917 0.229333 13.975 0.688C15.1583 1.14667 16.196 1.78 17.088 2.588C17.98 3.396 18.6883 4.35433 19.213 5.463C19.7377 6.57167 20 7.76733 20 9.05C20 10.9667 19.4167 12.4377 18.25 13.463C17.0833 14.4883 15.6667 15.0007 14 15H12.15C12 15 11.896 15.0417 11.838 15.125C11.78 15.2083 11.7507 15.3 11.75 15.4C11.75 15.6 11.875 15.8877 12.125 16.263C12.375 16.6383 12.5 17.0673 12.5 17.55C12.5 18.3833 12.271 19 11.813 19.4C11.355 19.8 10.7507 20 10 20ZM4.5 11C4.93333 11 5.29167 10.8583 5.575 10.575C5.85833 10.2917 6 9.93333 6 9.5C6 9.06667 5.85833 8.70833 5.575 8.425C5.29167 8.14167 4.93333 8 4.5 8C4.06667 8 3.70833 8.14167 3.425 8.425C3.14167 8.70833 3 9.06667 3 9.5C3 9.93333 3.14167 10.2917 3.425 10.575C3.70833 10.8583 4.06667 11 4.5 11ZM7.5 7C7.93333 7 8.29167 6.85833 8.575 6.575C8.85833 6.29167 9 5.93333 9 5.5C9 5.06667 8.85833 4.70833 8.575 4.425C8.29167 4.14167 7.93333 4 7.5 4C7.06667 4 6.70833 4.14167 6.425 4.425C6.14167 4.70833 6 5.06667 6 5.5C6 5.93333 6.14167 6.29167 6.425 6.575C6.70833 6.85833 7.06667 7 7.5 7ZM12.5 7C12.9333 7 13.2917 6.85833 13.575 6.575C13.8583 6.29167 14 5.93333 14 5.5C14 5.06667 13.8583 4.70833 13.575 4.425C13.2917 4.14167 12.9333 4 12.5 4C12.0667 4 11.7083 4.14167 11.425 4.425C11.1417 4.70833 11 5.06667 11 5.5C11 5.93333 11.1417 6.29167 11.425 6.575C11.7083 6.85833 12.0667 7 12.5 7ZM15.5 11C15.9333 11 16.2917 10.8583 16.575 10.575C16.8583 10.2917 17 9.93333 17 9.5C17 9.06667 16.8583 8.70833 16.575 8.425C16.2917 8.14167 15.9333 8 15.5 8C15.0667 8 14.7083 8.14167 14.425 8.425C14.1417 8.70833 14 9.06667 14 9.5C14 9.93333 14.1417 10.2917 14.425 10.575C14.7083 10.8583 15.0667 11 15.5 11Z"
              fill="currentColor"
            />
          </svg>
        );
      case "user-business":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2C10.5413 2 9.14236 2.57946 8.11091 3.61091C7.07946 4.64236 6.5 6.04131 6.5 7.5C6.5 8.95869 7.07946 10.3576 8.11091 11.3891C9.14236 12.4205 10.5413 13 12 13C13.4587 13 14.8576 12.4205 15.8891 11.3891C16.9205 10.3576 17.5 8.95869 17.5 7.5C17.5 6.04131 16.9205 4.64236 15.8891 3.61091C14.8576 2.57946 13.4587 2 12 2ZM8 14C6.67392 14 5.40215 14.5268 4.46447 15.4645C3.52678 16.4021 3 17.6739 3 19V22H21V19C21 17.6739 20.4732 16.4021 19.5355 15.4645C18.5979 14.5268 17.3261 14 16 14H14.618L12 19.236L9.382 14H8Z"
              fill="currentColor"
            />
          </svg>
        );
      case "communication":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
          >
            <mask
              id="mask0_1143_181"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="22"
              height="20"
            >
              <path
                d="M15.5 17H10V13H17V9H21V17H18.5L17 18.5L15.5 17Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 1H17V13H7.5L5.5 15L3.5 13H1V1Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 7H9M12 7H12.5M5 7H5.5"
                fill="currentColor"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </mask>
            <g mask="url(#mask0_1143_181)">
              <path d="M-1 -2H23V22H-1V-2Z" fill="currentColor" />
            </g>
          </svg>
        );
      case "health":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.962 18.469C6.019 16.214 2 12.489 2 8.96698C2 3.08298 7.5 0.885975 12 5.42998C16.5 0.885975 22 3.08298 22 8.96698C22 12.489 17.98 16.214 15.038 18.469C13.706 19.489 13.04 20 12 20C10.96 20 10.294 19.49 8.962 18.469ZM16.5 6.24998C16.6989 6.24998 16.8897 6.32899 17.0303 6.46965C17.171 6.6103 17.25 6.80106 17.25 6.99998V8.24998H18.5C18.6989 8.24998 18.8897 8.32899 19.0303 8.46965C19.171 8.6103 19.25 8.80106 19.25 8.99998C19.25 9.19889 19.171 9.38965 19.0303 9.53031C18.8897 9.67096 18.6989 9.74998 18.5 9.74998H17.25V11C17.25 11.1989 17.171 11.3897 17.0303 11.5303C16.8897 11.671 16.6989 11.75 16.5 11.75C16.3011 11.75 16.1103 11.671 15.9697 11.5303C15.829 11.3897 15.75 11.1989 15.75 11V9.74998H14.5C14.3011 9.74998 14.1103 9.67096 13.9697 9.53031C13.829 9.38965 13.75 9.19889 13.75 8.99998C13.75 8.80106 13.829 8.6103 13.9697 8.46965C14.1103 8.32899 14.3011 8.24998 14.5 8.24998H15.75V6.99998C15.75 6.80106 15.829 6.6103 15.9697 6.46965C16.1103 6.32899 16.3011 6.24998 16.5 6.24998Z"
              fill="currentColor"
            />
          </svg>
        );
      case "education":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M23.835 8.50001L12 0.807007L0.165039 8.50001L12 16.192L20 10.992V16H22V9.69301L23.835 8.50001Z"
              fill="currentColor"
            />
            <path
              d="M5 17.5V13.835L12 18.385L19 13.835V17.5C19 18.97 17.986 20.115 16.747 20.838C15.483 21.576 13.802 22 12 22C10.198 22 8.518 21.576 7.253 20.838C6.014 20.115 5 18.97 5 17.5Z"
              fill="currentColor"
            />
          </svg>
        );
      case "home":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M4 21V9L12 3L20 9V21H14V14H10V21H4Z" fill="currentColor" />
          </svg>
        );
      case "wrench":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21.5116 6.11198L17.6216 10.001L14.0866 6.46498L17.9756 2.57598C16.789 2.08816 15.4846 1.96235 14.2267 2.21439C12.9687 2.46643 11.8134 3.08505 10.9063 3.99235C9.99926 4.89965 9.38091 6.05506 9.12917 7.31308C8.87743 8.5711 9.00354 9.87549 9.49164 11.062L3.21564 17.337C3.02817 17.5245 2.92285 17.7788 2.92285 18.044C2.92285 18.3091 3.02817 18.5634 3.21564 18.751L5.33764 20.873C5.52517 21.0604 5.77947 21.1658 6.04464 21.1658C6.3098 21.1658 6.56411 21.0604 6.75164 20.873L13.0266 14.597C14.2132 15.0856 15.5179 15.2121 16.7762 14.9604C18.0345 14.7088 19.1902 14.0903 20.0976 13.183C21.005 12.2756 21.6235 11.1199 21.8751 9.86154C22.1267 8.60321 22.0002 7.29855 21.5116 6.11198Z"
              fill="currentColor"
            />
          </svg>
        );
      case "people":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M8 12C9.06087 12 10.0783 11.5786 10.8284 10.8284C11.5786 10.0783 12 9.06087 12 8C12 6.93913 11.5786 5.92172 10.8284 5.17157C10.0783 4.42143 9.06087 4 8 4C6.93913 4 5.92172 4.42143 5.17157 5.17157C4.42143 5.92172 4 6.93913 4 8C4 9.06087 4.42143 10.0783 5.17157 10.8284C5.92172 11.5786 6.93913 12 8 12ZM17 12C17.7956 12 18.5587 11.6839 19.1213 11.1213C19.6839 10.5587 20 9.79565 20 9C20 8.20435 19.6839 7.44129 19.1213 6.87868C18.5587 6.31607 17.7956 6 17 6C16.2044 6 15.4413 6.31607 14.8787 6.87868C14.3161 7.44129 14 8.20435 14 9C14 9.79565 14.3161 10.5587 14.8787 11.1213C15.4413 11.6839 16.2044 12 17 12ZM4.5 14C3.12 14 2 15.12 2 16.5C2 16.5 2 21 8 21C12.756 21 13.742 18.172 13.946 17C14 16.694 14 16.5 14 16.5C14 15.12 12.88 14 11.5 14H4.5ZM15.992 17.2C15.988 17.28 15.98 17.3747 15.968 17.484C15.8576 18.3086 15.5712 19.0999 15.128 19.804C15.658 19.926 16.276 20 16.998 20C21.998 20 21.998 16.5 21.998 16.5C21.998 15.12 20.878 14 19.498 14H15.24C15.72 14.716 15.998 15.574 15.998 16.5V17L15.992 17.2Z"
              fill="currentColor"
            />
          </svg>
        );
      case "language":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12.87 15.07L10.33 12.56L10.36 12.53C12.0547 10.6475 13.3205 8.41951 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z"
              fill="currentColor"
            />
          </svg>
        );
      case "money":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 12.5C11.0717 12.5 10.1815 12.8687 9.52513 13.5251C8.86875 14.1815 8.5 15.0717 8.5 16C8.5 16.9283 8.86875 17.8185 9.52513 18.4749C10.1815 19.1313 11.0717 19.5 12 19.5C12.9283 19.5 13.8185 19.1313 14.4749 18.4749C15.1313 17.8185 15.5 16.9283 15.5 16C15.5 15.0717 15.1313 14.1815 14.4749 13.5251C13.8185 12.8687 12.9283 12.5 12 12.5ZM10.5 16C10.5 15.6022 10.658 15.2206 10.9393 14.9393C11.2206 14.658 11.6022 14.5 12 14.5C12.3978 14.5 12.7794 14.658 13.0607 14.9393C13.342 15.2206 13.5 15.6022 13.5 16C13.5 16.3978 13.342 16.7794 13.0607 17.0607C12.7794 17.342 12.3978 17.5 12 17.5C11.6022 17.5 11.2206 17.342 10.9393 17.0607C10.658 16.7794 10.5 16.3978 10.5 16Z"
              fill="currentColor"
            />
            <path
              d="M17.526 5.116L14.347 0.658997L2.658 9.997L2.01 9.99V10H1.5V22H22.5V10H21.538L19.624 4.401L17.526 5.116ZM19.425 10H9.397L16.866 7.454L18.388 6.967L19.425 10ZM15.55 5.79L7.84 8.418L13.946 3.54L15.55 5.79ZM3.5 18.169V13.829C3.92218 13.68 4.30565 13.4384 4.62231 13.1219C4.93896 12.8054 5.18077 12.4221 5.33 12H18.67C18.8191 12.4223 19.0609 12.8058 19.3775 13.1225C19.6942 13.4391 20.0777 13.6809 20.5 13.83V18.17C20.0777 18.3191 19.6942 18.5609 19.3775 18.8775C19.0609 19.1942 18.8191 19.5777 18.67 20H5.332C5.18218 19.5777 4.93996 19.1941 4.62302 18.8774C4.30607 18.5606 3.9224 18.3186 3.5 18.169Z"
              fill="currentColor"
            />
          </svg>
        );
      case "running":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={21}
            height={24}
            viewBox="0 0 21 24"
            fill="none"
          >
            <path
              d="M15 2.25C15 1.65326 14.7629 1.08097 14.341 0.65901C13.919 0.237053 13.3467 0 12.75 0C12.1533 0 11.581 0.237053 11.159 0.65901C10.7371 1.08097 10.5 1.65326 10.5 2.25C10.5 2.84674 10.7371 3.41903 11.159 3.84099C11.581 4.26295 12.1533 4.5 12.75 4.5C13.3467 4.5 13.919 4.26295 14.341 3.84099C14.7629 3.41903 15 2.84674 15 2.25ZM5.89219 8.22656C6.35625 7.7625 6.98906 7.5 7.65 7.5C7.73906 7.5 7.82812 7.50469 7.9125 7.51406L6.45 11.9062C6.01406 13.2188 6.52969 14.6625 7.70625 15.3984L11.7469 17.925L10.5562 22.0875C10.3266 22.8844 10.7906 23.7141 11.5875 23.9437C12.3844 24.1734 13.2141 23.7094 13.4437 22.9125L14.7891 18.2062C15.0656 17.2406 14.6672 16.2094 13.8187 15.6797L11.1562 14.0156L12.6047 10.1531L12.8438 10.7297C13.5469 12.4078 15.1828 13.5 17.0016 13.5H18C18.8297 13.5 19.5 12.8297 19.5 12C19.5 11.1703 18.8297 10.5 18 10.5H17.0016C16.3969 10.5 15.8484 10.1344 15.6188 9.57656L15.3234 8.87344C14.6391 7.22813 13.2562 5.97187 11.55 5.44687L9.26719 4.74375C8.74687 4.58437 8.20312 4.5 7.65469 4.5C6.20156 4.5 4.80469 5.07656 3.77812 6.10781L2.69063 7.19062C2.10469 7.77656 2.10469 8.72812 2.69063 9.31406C3.27656 9.9 4.22812 9.9 4.81406 9.31406L5.89688 8.23125L5.89219 8.22656ZM4.275 16.5H1.5C0.670312 16.5 0 17.1703 0 18C0 18.8297 0.670312 19.5 1.5 19.5H4.7625C5.65312 19.5 6.45937 18.975 6.82031 18.1641L7.35938 16.95L6.91406 16.6688C6.11519 16.1716 5.49351 15.4351 5.1375 14.5641L4.275 16.5Z"
              fill="currentColor"
            />
          </svg>
        );
      case "arts":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M7.33301 0.613001C9.14101 0.613001 14.667 -1.75369 14.667 3.05831C14.6668 7.10844 12.2215 15.28 7.33301 15.28C2.44471 15.2796 0.000147141 7.10902 0 3.05831C0 -1.72807 5.49935 0.612724 7.33301 0.613001ZM7.33301 12.2243C9.77767 12.2243 12.8333 6.72499 11 7.94699C8.55553 9.78011 6.72201 9.78004 3.66699 7.94699C1.83374 6.72504 4.8884 12.2238 7.33301 12.2243ZM4.09961 3.12765C3.1865 3.18445 2.32242 3.77012 1.89844 4.61788C1.85188 4.71103 1.82933 4.81464 1.83398 4.91867C1.83865 5.02267 1.87012 5.12401 1.9248 5.21261C1.97943 5.30101 2.0558 5.37379 2.14648 5.42452C2.23738 5.47532 2.34021 5.50251 2.44434 5.50265C2.55772 5.50252 2.66909 5.47132 2.76562 5.41183C2.86213 5.35235 2.94013 5.26692 2.99121 5.16574C3.22384 4.69915 3.6892 4.37845 4.17578 4.34835C4.69901 4.31503 5.19592 4.62043 5.60254 5.23019C5.69486 5.35921 5.83417 5.44776 5.99023 5.47628C6.14621 5.50471 6.30755 5.47148 6.43945 5.38351C6.57127 5.29549 6.66363 5.15951 6.69727 5.0046C6.73091 4.84956 6.70277 4.68727 6.61914 4.55245C5.7385 3.23131 4.65891 3.09632 4.09961 3.12765ZM10.5674 3.12765C10.0021 3.09499 8.92782 3.22972 8.04785 4.55148C8.00336 4.6182 7.97262 4.69351 7.95703 4.77218C7.94146 4.85081 7.94136 4.93186 7.95703 5.01046C7.97276 5.08914 8.00419 5.16449 8.04883 5.23117C8.09344 5.29771 8.15112 5.35468 8.21777 5.39913C8.2844 5.44352 8.35897 5.47437 8.4375 5.48995C8.51613 5.50552 8.59718 5.50563 8.67578 5.48995C8.75445 5.47423 8.82982 5.44375 8.89648 5.39913C8.96307 5.35456 9.01996 5.29683 9.06445 5.23019C9.47175 4.62024 9.97392 4.31943 10.4912 4.34738C10.9779 4.37804 11.4424 4.69876 11.6758 5.16476C11.7267 5.26609 11.8049 5.35119 11.9014 5.41085C11.9979 5.47052 12.1092 5.50239 12.2227 5.50265C12.3269 5.50286 12.4294 5.47615 12.5205 5.4255C12.6117 5.37477 12.6883 5.30138 12.7432 5.21261C12.7979 5.1239 12.8294 5.02282 12.834 4.91867C12.8385 4.81442 12.8165 4.7101 12.7695 4.61691C12.3455 3.76905 11.4806 3.18434 10.5674 3.12765Z"
              fill="currentColor"
            />
            <path
              d="M16.667 9.33379C18.4758 9.33365 24 6.96561 24 11.7781C23.9999 15.8275 21.5555 23.9996 16.667 23.9998C11.7784 23.9998 9.33306 15.8275 9.33301 11.7781C9.33301 6.9908 14.8337 9.33379 16.667 9.33379ZM16.667 17.1561C14.2223 17.1561 11.8337 21.3224 13.667 20.1004C16.0001 18.6666 17.3338 18.6665 19.667 20.1004C21.5001 21.3221 19.1115 17.1564 16.667 17.1561ZM13.4873 11.9988C12.3895 12.0668 11.2539 12.7939 10.7871 13.7264C10.7406 13.8195 10.718 13.9232 10.7227 14.0272C10.7273 14.1312 10.7588 14.2325 10.8135 14.3211C10.8682 14.4097 10.9451 14.4832 11.0361 14.534C11.1269 14.5846 11.2291 14.6111 11.333 14.6111C11.4463 14.6108 11.5579 14.5789 11.6543 14.5193C11.7504 14.4599 11.828 14.3751 11.8789 14.2742C12.1202 13.7916 12.8161 13.2646 13.5635 13.2186C14.1259 13.186 14.5876 13.43 14.9355 13.951C15.0292 14.0767 15.1678 14.1625 15.3223 14.1893C15.4768 14.216 15.6361 14.1816 15.7666 14.0945C15.897 14.0074 15.9888 13.8735 16.0234 13.7205C16.058 13.5676 16.0333 13.407 15.9531 13.2723C15.3645 12.3883 14.4799 11.9328 13.4873 11.9988ZM19.8467 11.9979C18.8393 11.9325 17.9702 12.3883 17.3809 13.2723C17.3342 13.3389 17.3013 13.4144 17.2842 13.4939C17.2671 13.5734 17.2663 13.6553 17.2812 13.7352C17.2963 13.8152 17.3272 13.8919 17.3721 13.9598C17.4169 14.0274 17.4745 14.0856 17.542 14.1307C17.6096 14.1758 17.6858 14.207 17.7656 14.2225C17.8456 14.2379 17.9282 14.2373 18.0078 14.2205C18.0874 14.2037 18.1626 14.1711 18.2295 14.1248C18.2963 14.0785 18.3538 14.0196 18.3975 13.951C18.7448 13.429 19.2093 13.1863 19.7705 13.2176C20.5176 13.2642 21.2129 13.7904 21.4531 14.2723C21.504 14.3738 21.5822 14.4595 21.6787 14.5193C21.7754 14.5791 21.8873 14.6109 22.001 14.6111C22.1051 14.6112 22.2078 14.5846 22.2988 14.534C22.3898 14.4833 22.4667 14.4106 22.5215 14.3221C22.5763 14.2334 22.6067 14.1313 22.6113 14.0272C22.6158 13.9231 22.5936 13.8194 22.5469 13.7264C22.0807 12.7939 20.9452 12.0665 19.8467 11.9979Z"
              fill="currentColor"
            />
          </svg>
        );
      case "world":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM4 12C4 11.101 4.156 10.238 4.431 9.431L6 11L8 13V15L10 17L11 18V19.931C7.061 19.436 4 16.072 4 12ZM18.33 16.873C17.677 16.347 16.687 16 16 16V15C16 14.4696 15.7893 13.9609 15.4142 13.5858C15.0391 13.2107 14.5304 13 14 13H10V10C10.5304 10 11.0391 9.78929 11.4142 9.41421C11.7893 9.03914 12 8.53043 12 8V7H13C13.5304 7 14.0391 6.78929 14.4142 6.41421C14.7893 6.03914 15 5.53043 15 5V4.589C17.928 5.778 20 8.65 20 12C19.9996 13.7647 19.4121 15.479 18.33 16.873Z"
              fill="currentColor"
            />
          </svg>
        );
      case "book":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6.012 18H21V4C21 3.46957 20.7893 2.96086 20.4142 2.58579C20.0391 2.21071 19.5304 2 19 2H6C4.794 2 3 2.799 3 5V19C3 21.201 4.794 22 6 22H21V20H6.012C5.55 19.988 5 19.805 5 19C5 18.195 5.55 18.012 6.012 18ZM8 6H17V8H8V6Z"
              fill="currentColor"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={249.3}
            height={76}
            className="mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[100px]">
            Set up your skills.
          </h1>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center w-full max-w-[907px] mx-auto gap-[30px]">
          <h2 className="text-[20px] font-[500] self-start text-white">
            Select the categories you're interested in.
          </h2>

          {/* Categories grid */}
          <div className="grid grid-cols-4 gap-[20px] w-full max-w-[907px]">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);

              return (
                <div
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex items-center p-5 gap-3 rounded-[20px] cursor-pointer transition-all duration-300 h-[80px] w-full ${
                    isSelected
                      ? "bg-[#120A2A] shadow-[0px_5px_40px_rgba(40,76,204,0.2)]"
                      : "bg-[rgba(88,36,144,0.15)] border-[3px] border-[#7E59F8] shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_5px_15px_#906EFF]"
                  }`}
                  style={{
                    background: isSelected
                      ? "radial-gradient(100% 275% at 100% 0%, #500582 0%, #120A2A 69.23%)"
                      : "radial-gradient(100% 275% at 100% 0%, rgba(88, 36, 144, 0.15) 0%, rgba(18, 10, 42, 0.15) 69.23%)",
                  }}
                >
                  {/* Icon */}
                  <span
                    className={`flex-shrink-0 ${
                      isSelected ? "text-white" : "text-white/40"
                    }`}
                  >
                    {getCategoryIcon(category.icon)}
                  </span>

                  {/* Text content */}
                  <div className="flex-1 flex items-center justify-between">
                    <span
                      className={`text-[16px] text-left leading-tight ${
                        isSelected ? "text-white" : "text-white/40"
                      }`}
                    >
                      {category.name}
                    </span>

                    {/* Checkmark */}
                    <div className="w-[17px] h-[14px] flex items-center justify-center flex-shrink-0">
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="17"
                          height="14"
                          viewBox="0 0 17 14"
                          fill="none"
                        >
                          <path
                            d="M5.7 13.0125L0 7.31249L1.425 5.88749L5.7 10.1625L14.875 0.987488L16.3 2.41249L5.7 13.0125Z"
                            fill="white"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message (fixed height) */}
        <div className="h-[10px] mt-8">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-[119px] mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[20px] font-[500] transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        {/* Pagination - Centered at bottom */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 text-sm text-white opacity-60 z-50">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={handlePrev}
          />
          <span>4 of 6</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
