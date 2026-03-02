"use client";

import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

export function MapProvider({ children }: { children: React.ReactNode }) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });

    if (loadError) return <div className="flex h-screen w-full items-center justify-center text-red-500">Error loading maps</div>;
    if (!isLoaded) return <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">Loading Maps...</div>;

    return <>{children}</>;
}
