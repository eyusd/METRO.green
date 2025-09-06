"use client";

import Map, {
  Source,
  Layer,
  type SymbolLayerSpecification,
  type MapRef,
} from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";
import { ComponentProps, useMemo, useRef, useCallback, useState } from "react";
import { useGameStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapStationsProps extends ComponentProps<"div"> {
  stations: FeatureCollection;
}

const stationLayer: SymbolLayerSpecification = {
  id: "stations-icons",
  minzoom: 7,
  type: "symbol",
  paint: {
    "text-halo-color": "hsl(0, 0%, 100%)",
    "text-halo-width": 1,
    "text-halo-blur": 1,
  },
  layout: {
    "text-optional": true,
    "text-size": ["interpolate", ["linear"], ["zoom"], 8, 6, 22, 20],
    "icon-image": [
      "image",
      "circle",
      {
        params: {
          background: ["concat", "#", ["to-string", ["get", "colourweb_hexa"]]],
        },
      },
    ],
    "text-padding": 10,
    "text-offset": [0, -0.5],
    "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 0.3, 22, 1],
    "text-anchor": "bottom",
    "text-field": ["to-string", ["get", "nom_gares"]],
    "icon-ignore-placement": true,
    "icon-allow-overlap": true,
  },
  source: "stations",
};

export function MapStations({ stations, ...props }: MapStationsProps) {
  const visitedStations = useGameStore(useShallow(state => state.visitedStations));
  const mapRef = useRef<MapRef>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  // Filter stations to only show visited ones
  const filteredStations: FeatureCollection = useMemo(() => {
    if (!visitedStations.length) {
      // If no stations visited, return empty collection
      return {
        type: "FeatureCollection",
        features: []
      };
    }

    return {
      type: "FeatureCollection",
      features: stations.features.filter((feature) => {
        const stationName = feature.properties?.nom_gares;
        return stationName && visitedStations.includes(stationName);
      })
    };
  }, [stations, visitedStations]);

  // Handle map load event - most reliable way to ensure style is ready
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && map.isStyleLoaded()) {
      setIsStyleLoaded(true);
    }
  }, []);

  // Backup method using styledata event, but with isStyleLoaded check
  const handleStyleData = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && map.isStyleLoaded()) {
      setIsStyleLoaded(true);
    }
  }, []);

  // Additional safety check on idle event
  const handleIdle = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && map.isStyleLoaded() && !isStyleLoaded) {
      setIsStyleLoaded(true);
    }
  }, [isStyleLoaded]);

  return (
    <div {...props}>
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        style={{ width: "100%", height: "100%" }}
        initialViewState={{
          longitude: 2.341,
          latitude: 48.859,
          zoom: 9.5,
        }}
        mapStyle="mapbox://styles/eyusd/cmeyd0yiq004701se65w229xp"
        onLoad={handleMapLoad}
        onStyleData={handleStyleData}
        onIdle={handleIdle}
        onError={(e) => console.error("Map error:", e)}
      >
        {/* Only render Source and Layer when style is confirmed to be loaded */}
        {isStyleLoaded && (
          <Source id="stations" type="geojson" data={filteredStations}>
            <Layer {...stationLayer} />
          </Source>
        )}
      </Map>
    </div>
  );
}
