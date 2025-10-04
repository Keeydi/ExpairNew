"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Button } from "../../../../../components/ui/button";
import { ChevronRight, ChevronLeft, Search, MapPin } from "lucide-react";
import { Inter } from "next/font/google";
import MapWrapper from "../../../../../components/map/map-wrapper";

const inter = Inter({ subsets: ["latin"] });

// Default coordinates for Manila
const DEFAULT_COORDS = { latitude: 14.5995, longitude: 120.9842 };

// Helper function to validate coordinates
const isValidCoordinate = (coord) => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

const isValidMarker = (marker) => {
  return marker && 
         isValidCoordinate(marker.latitude) && 
         isValidCoordinate(marker.longitude) &&
         marker.latitude >= -90 && marker.latitude <= 90 &&
         marker.longitude >= -180 && marker.longitude <= 180;
};

export default function Step2({ step2Data, onDataSubmit, onNext, onPrev }) {
  const [viewport, setViewport] = useState({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    zoom: 14,
  });

  const [searchQuery, setSearchQuery] = useState(step2Data?.searchQuery || "");
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize marker with valid coordinates
  const [marker, setMarker] = useState(() => {
    if (step2Data?.marker && isValidMarker(step2Data.marker)) {
      return step2Data.marker;
    }
    return DEFAULT_COORDS;
  });

  // Auto locate user with proper error handling
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
            const newCoords = { latitude, longitude };
            
            setViewport(prev => ({ 
              ...prev, 
              latitude, 
              longitude, 
              zoom: 14 
            }));
            setMarker(newCoords);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    } else {
      setIsLoading(false);
    }
  }, []);

  // Form validation
  const isFormValid = () => {
    return searchQuery.trim() !== "" && isValidMarker(marker);
  };

  const handlePrev = () => {
    onPrev({
      searchQuery,
      marker: isValidMarker(marker) ? marker : DEFAULT_COORDS
    });
  };

  const handleContinue = () => {
    if (!isValidMarker(marker)) {
      setErrorMessage("Please select a valid location before continuing.");
      return;
    }
    
    setErrorMessage("");
    onDataSubmit({
      searchQuery,
      marker,
    });
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
      if (!token) return;

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?autocomplete=true&limit=5&access_token=${token}`;

      const res = await fetch(url);
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
      }
    } catch (err) {
      console.error("Suggestion fetch error:", err);
    }
  };

  // Select suggestion with validation
  const handleSelectSuggestion = (place) => {
    if (!place?.center || place.center.length !== 2) return;

    const [longitude, latitude] = place.center;
    
    if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) return;

    setSearchQuery(place.place_name);
    
    const newCoords = { latitude, longitude };
    setViewport({
      latitude,
      longitude,
      zoom: 14,
    });
    setMarker(newCoords);
    setSuggestions([]);
    setIsUserInteracted(true);
    setErrorMessage("");
  };

  // Manual search with validation
  const handleSearch = async () => {
    if (!searchQuery) {
      setErrorMessage("Please enter a location to search.");
      return;
    }

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setErrorMessage("Map service unavailable.");
        return;
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${token}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        
        if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
          setErrorMessage("Invalid location coordinates received.");
          return;
        }

        const newCoords = { latitude, longitude };
        setViewport(prev => ({
          ...prev,
          latitude,
          longitude,
          zoom: 14,
        }));
        setMarker(newCoords);
        setIsUserInteracted(true);
        setErrorMessage("");
      } else {
        setErrorMessage("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setErrorMessage("Search failed. Please try again.");
    }
  };

  // Handle viewport changes with debouncing to prevent infinite loops
  const handleViewportChange = useCallback((newViewport) => {
    // Only update if the viewport actually changed significantly
    const hasSignificantChange = 
      Math.abs(newViewport.latitude - viewport.latitude) > 0.0001 ||
      Math.abs(newViewport.longitude - viewport.longitude) > 0.0001 ||
      Math.abs(newViewport.zoom - viewport.zoom) > 0.1;
    
    if (hasSignificantChange) {
      setViewport(newViewport);
    }
  }, [viewport]);

  // Memoize the viewport to prevent unnecessary re-renders
  const memoizedViewport = useMemo(() => viewport, [viewport.latitude, viewport.longitude, viewport.zoom]);

  // Handle marker changes - this is called by your DynamicMap
  const handleMarkerChange = async (newMarker) => {
    console.log("handleMarkerChange called with:", newMarker);
    
    if (!isValidMarker(newMarker)) {
      console.warn("Invalid marker skipped:", newMarker);
      return;
    }

    setMarker(newMarker);
    setViewport(prev => ({
      ...prev,
      latitude: newMarker.latitude,
      longitude: newMarker.longitude,
    }));

    // Reverse geocoding
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newMarker.longitude},${newMarker.latitude}.json?access_token=${token}`;
      const res = await fetch(url);
      
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setSearchQuery(data.features[0].place_name);
        setIsUserInteracted(true);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  // Ensure we always have valid coordinates
  const safeMarker = isValidMarker(marker) ? marker : DEFAULT_COORDS;
  const safeViewport = {
    latitude: isValidCoordinate(viewport.latitude) ? viewport.latitude : DEFAULT_COORDS.latitude,
    longitude: isValidCoordinate(viewport.longitude) ? viewport.longitude : DEFAULT_COORDS.longitude,
    zoom: viewport.zoom || 14
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cover bg-center"
           style={{ backgroundImage: "url('/assets/bg_register.png')" }}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your location...</p>
        </div>
      </div>
    );
  }

  console.log("About to render MapWrapper with:", { safeViewport, safeMarker });

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
            Let's get your account started.
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

        {/* Map - Pass marker as coordinate object, not React component */}
        <div className="w-full max-w-[800px] h-[200px] sm:h-[288px] mx-auto rounded-[20px] sm:rounded-[30px] overflow-hidden">
          <MapWrapper
            viewport={memoizedViewport}
            onViewportChange={handleViewportChange}
            marker={safeMarker} // Pass the coordinate object directly
            onMarkerChange={handleMarkerChange}
          />
        </div>

        <p className="text-xs sm:text-sm text-white/60 mt-10 mb-2 max-w-[800px] mx-auto">
          <span className="text-[18px] font-bold text-white/60">
            Why do we ask for your location?
          </span>
          <br />
          We use your location to calibrate our matching algorithm—users who are
          closer to each other are matched more easily. Your exact location is{" "}
          <span className="font-bold text-white/60">never displayed</span> on
          your profile.
        </p>

        {/* Error Message */}
        <div className="h-[10px] mt-4">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </div>

        <p className="font-[500] text-[18px] sm:text-[20px] text-center mb-[20px] sm:mb-[25px] mt-[50px] sm:mt-[15px]">
          Is this location correct?
        </p>

        <div className="flex justify-center mb-[30px] sm:mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[180px] sm:w-[240px] h-[45px] sm:h-[50px] justify-center items-center px-[20px] sm:px-[38px] py-[10px] sm:py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[12px] sm:rounded-[15px]"
            onClick={handleContinue}
            disabled={!isFormValid()}
          >
            Continue
          </Button>
        </div>

        {/* Pagination */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 text-sm text-white opacity-60 z-50">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={handlePrev}
          />
          <span>2 of 6</span>
          <ChevronRight
            className={`w-5 h-5 ${
              isFormValid()
                ? "cursor-pointer text-gray-300 hover:text-white"
                : "text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => {
              if (isFormValid()) {
                handleContinue();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}