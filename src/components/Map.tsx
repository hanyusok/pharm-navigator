"use client";

import { useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Sidebar } from "./Sidebar";
import { MapPin, Navigation } from "lucide-react";
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
};

export default function Map() {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
    const { data: session } = useSession();

    const fetchPharmacies = async (bounds: google.maps.LatLngBounds) => {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        try {
            const res = await fetch(
                `/api/pharmacies?swLat=${sw.lat()}&swLng=${sw.lng()}&neLat=${ne.lat()}&neLng=${ne.lng()}`
            );
            if (res.ok) {
                const data = await res.json();
                setPharmacies(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onIdle = () => {
        if (mapRef.current) {
            const bounds = mapRef.current.getBounds();
            if (bounds) {
                fetchPharmacies(bounds);
            }
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Top Navigation */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center z-10 pointers-events-none">
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/40 flex items-center space-x-3 pointers-events-auto">
                    <div className="bg-blue-500 p-2 rounded-xl text-white">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Pharmacy Navigator
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Community Driven</p>
                    </div>
                </div>

                <div className="pointers-events-auto flex items-center space-x-4">
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
                            className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-lg border border-white/40 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors pointers-events-auto"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {/* Google Map */}
            <div className="w-full h-full">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={13}
                    onLoad={onLoad}
                    onIdle={onIdle}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        styles: [
                            {
                                featureType: "poi.business",
                                stylers: [{ visibility: "off" }],
                            },
                            {
                                featureType: "transit",
                                elementType: "labels.icon",
                                stylers: [{ visibility: "off" }],
                            },
                        ],
                    }}
                >
                    {pharmacies.map((pharmacy) => (
                        <Marker
                            key={pharmacy.id}
                            position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
                            onClick={() => setSelectedPharmacy(pharmacy)}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'),
                                scaledSize: new google.maps.Size(32, 32),
                                anchor: new google.maps.Point(16, 32),
                            }}
                        />
                    ))}

                    {selectedPharmacy && (
                        <InfoWindow
                            position={{ lat: selectedPharmacy.lat, lng: selectedPharmacy.lng }}
                            onCloseClick={() => setSelectedPharmacy(null)}
                            options={{ pixelOffset: new google.maps.Size(0, -32) }}
                        >
                            <div className="p-1 max-w-[200px]">
                                <h3 className="font-bold text-gray-800 text-sm mb-1">{selectedPharmacy.name}</h3>
                                <p className="text-xs text-gray-500 mb-2 truncate">{selectedPharmacy.address}</p>
                                <div className="flex items-center text-xs text-blue-600 font-medium">
                                    <Navigation size={12} className="mr-1" />
                                    Select to view details
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </div>

            {/* Detail Sidebar */}
            <Sidebar
                pharmacy={selectedPharmacy}
                onClose={() => setSelectedPharmacy(null)}
            />
        </div>
    );
}
