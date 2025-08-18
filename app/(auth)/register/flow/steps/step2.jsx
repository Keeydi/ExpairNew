"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "../../../../../components/ui/button";
import { ChevronRight, ChevronLeft, Search, MapPin } from "lucide-react";
import { Inter } from "next/font/google";
import MapWrapper from "../../../../../components/map/map-wrapper";

const inter = Inter({ subsets: ["latin"] });

export default function Step2({ onNext, onPrev }) {
  const [viewport, setViewport] = useState({
    latitude: 14.5995, // Default: Manila
    longitude: 120.9842,
    zoom: 14,
  });

  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto locate user
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewport((prev) => ({ ...prev, latitude, longitude, zoom: 14 }));
          setMarker({ latitude, longitude });
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (!marker) {
            setMarker({
              latitude: 14.5995,
              longitude: 120.9842,
            });
          }
        }
      );
    }
  }, []);

  const handleContinue = () => {
    if (!marker) {
      setErrorMessage("Please select or search for your location before continuing.");
      return;
    }
    setErrorMessage("");
    console.log("Selected location:", marker);
    onNext();
  };

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
    setSearchQuery(place.place_name);
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
    setSuggestions([]);
    setErrorMessage("");
  };

  // Manual search
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
        setErrorMessage("");
      } else {
        setErrorMessage("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleMarkerChange = async (newMarker) => {
  setMarker(newMarker);
  setViewport(prev => ({
    ...prev,
    latitude: newMarker.latitude,
    longitude: newMarker.longitude
  }));

  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newMarker.longitude},${newMarker.latitude}.json?access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      setSearchQuery(data.features[0].place_name);
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
  }
};


  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center px-4 sm:px-8 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-4xl text-center px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[90px]">
            Let’s get your account started.
          </h1>
        </div>

        <p className="text-white text-[16px] sm:text-[20px] font-[500] mb-[20px]">
          Enter your location below, or pinpoint your location automatically.
        </p>

        {/* Search Bar */}
        <div className="relative mx-auto mb-[20px] sm:mb-[30px] w-full max-w-[800px]">
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

        {/* Map */}
        <div className="w-full max-w-[800px] h-[200px] sm:h-[288px] mx-auto rounded-[20px] sm:rounded-[30px] overflow-hidden">
          <MapWrapper
            viewport={viewport}
            onViewportChange={setViewport}
            marker={marker}
            onMarkerChange={handleMarkerChange}
          />
        </div>

        {/* Error Message (fixed height) */}
        <div className="h-[10px] mt-4">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </div>        

        <p className="font-[500] text-[18px] sm:text-[20px] text-center mb-[20px] sm:mb-[25px] mt-[50px] sm:mt-[79px]">
          Is this location correct?
        </p>

        <div className="flex justify-center mb-[30px] sm:mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[180px] sm:w-[240px] h-[45px] sm:h-[50px] justify-center items-center px-[20px] sm:px-[38px] py-[10px] sm:py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[12px] sm:rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>2 of 6</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
