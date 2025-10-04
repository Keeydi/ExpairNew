"use client";

import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from "lucide-react";
import { useCallback, useMemo } from 'react';

export default function DynamicMap({ viewport, onViewportChange, marker, onMarkerChange }) {

  const handleMapClick = useCallback((event) => {
    if (onMarkerChange) {
      onMarkerChange({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
      });
    }
  }, [onMarkerChange]);

  const handleMove = useCallback((evt) => {
    if (onViewportChange) {
      onViewportChange(evt.viewState);
    }
  }, [onViewportChange]);

  const handleGeolocate = useCallback((e) => {
    if (onMarkerChange) {
      onMarkerChange({
        longitude: e.coords.longitude,
        latitude: e.coords.latitude
      });
    }
  }, [onMarkerChange]);

  // Memoize the viewState to prevent unnecessary re-renders
  const memoizedViewState = useMemo(() => viewport, [viewport.latitude, viewport.longitude, viewport.zoom]);

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      viewState={memoizedViewState}
      onMove={handleMove}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
      onClick={handleMapClick}
    >
      {marker && (
        <Marker
          latitude={marker.latitude}
          longitude={marker.longitude}
          offsetLeft={-20}
          offsetTop={-40}
        >
          <MapPin size={40} className="text-[#000000]" fill="#000000" />
        </Marker>
      )}
      <NavigationControl position="top-left" />
      <GeolocateControl 
        position="top-left" 
        onGeolocate={handleGeolocate}
      />
    </Map>
  );
}
