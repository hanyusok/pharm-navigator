"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MapPin } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const containerStyle = {
    width: "100%",
    height: "100vh",
};

const defaultCenter = {
    lat: 37.5665,
    lng: 126.9780, // Seoul center
};

type Pharmacy = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    address: string;
    phone: string;
    typeDesc?: string | null;
    openDate?: string | null;
    faxs?: any[];
};

export default function Map() {
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const customOverlayRef = useRef<any>(null);

    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
    const { data: session } = useSession();

    // Fetch pharmacies within map bounds
    const fetchPharmacies = async (bounds: any) => {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        try {
            const res = await fetch(
                `/api/pharmacies?swLat=${sw.getLat()}&swLng=${sw.getLng()}&neLat=${ne.getLat()}&neLng=${ne.getLng()}`
            );
            if (res.ok) {
                const data = await res.json();
                setPharmacies(data);
            }
        } catch (e) {
            console.error("Failed to fetch pharmacies:", e);
        }
    };

    // Initialize Kakao Map
    useEffect(() => {
        if (typeof window === "undefined" || !window.kakao || !window.kakao.maps) return;

        const container = document.getElementById("kakao-map");
        if (!container) return;

        const options = {
            center: new window.kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
            level: 5, // Zoom level 5 works nicely for city view
        };

        const map = new window.kakao.maps.Map(container, options);
        mapInstanceRef.current = map;

        // Listen for map idle events to fetch pharmacies in the view area
        const handleIdle = () => {
            const currentBounds = map.getBounds();
            if (currentBounds) {
                fetchPharmacies(currentBounds);
            }
        };

        window.kakao.maps.event.addListener(map, "idle", handleIdle);

        // Fetch initial data
        handleIdle();

        return () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.event.removeListener(map, "idle", handleIdle);
            }
        };
    }, []);

    // Update map markers when pharmacies state changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear previous markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Draw new markers
        const newMarkers = pharmacies.map((pharmacy) => {
            if (!pharmacy.lat || !pharmacy.lng) return null;

            const markerPosition = new window.kakao.maps.LatLng(pharmacy.lat, pharmacy.lng);

            // Sleek blue pin marker
            const imageSrc = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>');
            const imageSize = new window.kakao.maps.Size(32, 32);
            const imageOption = { offset: new window.kakao.maps.Point(16, 32) };

            const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

            const marker = new window.kakao.maps.Marker({
                position: markerPosition,
                image: markerImage,
                title: pharmacy.name,
            });

            marker.setMap(map);

            // Add click listener
            window.kakao.maps.event.addListener(marker, "click", () => {
                setSelectedPharmacy(pharmacy);
            });

            return marker;
        }).filter(Boolean);

        markersRef.current = newMarkers;
    }, [pharmacies]);

    // Handle CustomOverlay popup when a pharmacy is selected
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear previous overlays
        if (customOverlayRef.current) {
            customOverlayRef.current.setMap(null);
            customOverlayRef.current = null;
        }

        if (!selectedPharmacy) return;

        const position = new window.kakao.maps.LatLng(selectedPharmacy.lat, selectedPharmacy.lng);

        // Build premium modern DOM container
        const contentEl = document.createElement("div");
        contentEl.className = "relative bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 min-w-[200px] pointer-events-auto transition-all duration-200 hover:shadow-2xl";

        contentEl.innerHTML = `
            <div class="pr-5">
                <h3 class="font-bold text-gray-800 text-sm mb-0.5 truncate">${selectedPharmacy.name}</h3>
                <p class="text-[11px] text-gray-500 mb-2 truncate">${selectedPharmacy.address}</p>
                <button class="view-detail-btn flex items-center text-[11px] text-blue-600 font-bold hover:text-blue-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    상세 정보 보기
                </button>
            </div>
            <button class="close-overlay-btn absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        // Click handler for closing overlay
        const closeBtn = contentEl.querySelector(".close-overlay-btn");
        closeBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedPharmacy(null);
        });

        // Click handler for detailed sidebar view
        const viewDetailBtn = contentEl.querySelector(".view-detail-btn");
        viewDetailBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedPharmacy({ ...selectedPharmacy });
        });

        // Create CustomOverlay
        const overlay = new window.kakao.maps.CustomOverlay({
            content: contentEl,
            position: position,
            yAnchor: 1.3,
            clickable: true
        });

        overlay.setMap(map);
        customOverlayRef.current = overlay;
    }, [selectedPharmacy]);

    return (
        <div className="relative w-full h-full">
            {/* Top Navigation */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center space-y-3 sm:space-y-0 pointer-events-none">
                <div className="w-full sm:w-auto bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/40 flex items-center space-x-3 pointer-events-auto">
                    <div className="bg-blue-500 p-2 rounded-xl text-white">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            약국 찾기
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">처방전 FAX 번호 공유</p>
                    </div>
                </div>

                <div className="pointer-events-auto flex items-center w-full sm:w-auto justify-end">
                    {session ? (
                        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/40 flex items-center space-x-4">
                            <span className="text-sm font-semibold text-gray-700">
                                Hi, {session.user?.name || "User"}
                            </span>
                            <button
                                onClick={() => signOut()}
                                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-lg border border-white/40 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors pointer-events-auto"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {/* Kakao Map Container */}
            <div id="kakao-map" style={containerStyle} />

            {/* Detail Sidebar */}
            <Sidebar
                pharmacy={selectedPharmacy}
                onClose={() => setSelectedPharmacy(null)}
            />
        </div>
    );
}
