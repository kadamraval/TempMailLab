"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const markers = [
  { markerOffset: -15, name: "United States", coordinates: [-100, 40] },
  { markerOffset: 25, name: "India", coordinates: [78.9629, 20.5937] },
  { markerOffset: -15, name: "Brazil", coordinates: [-51.9253, -14.235] },
  { markerOffset: 25, name: "Germany", coordinates: [10.4515, 51.1657] },
  { markerOffset: -15, name: "Australia", coordinates: [133.7751, -25.2744] },
];

export function AudienceGeo() {
  return (
    <div className="w-full h-full min-h-[300px] -mx-4">
        <ComposableMap
            projectionConfig={{
            scale: 120,
            }}
            width={800}
            height={400}
            style={{ width: "100%", height: "auto" }}
        >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="hsl(var(--muted))"
                stroke="hsl(var(--background))"
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {markers.map(({ name, coordinates, markerOffset }) => (
          <Marker key={name} coordinates={coordinates}>
            <circle r={8} fill="hsl(var(--primary))" stroke="#fff" strokeWidth={2} />
          </Marker>
        ))}
      </ComposableMap>
    </div>
  )
}
