"use client";

import { createContext, useContext, useEffect, useState } from "react";

const KakaoMapContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export function MapProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

    useEffect(() => {
        if (typeof window === "undefined" || !appKey) return;

        // If already loaded
        if (window.kakao && window.kakao.maps) {
            setIsLoaded(true);
            return;
        }

        const scriptId = "kakao-map-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
            script.async = true;
            document.head.appendChild(script);
        }

        const onLoad = () => {
            window.kakao.maps.load(() => {
                setIsLoaded(true);
            });
        };

        script.addEventListener("load", onLoad);

        // If script was already loaded by browser
        if (window.kakao && window.kakao.maps) {
            onLoad();
        }

        return () => {
            if (script) {
                script.removeEventListener("load", onLoad);
            }
        };
    }, [appKey]);

    if (!appKey) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="max-w-md p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Kakao Maps API Key Missing</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Please set the <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs text-red-600">NEXT_PUBLIC_KAKAO_MAP_APP_KEY</code> environment variable in your <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> file.
                    </p>
                    <div className="text-left text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 font-mono text-gray-500">
                        NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_actual_javascript_key
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 text-gray-500 font-medium">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                Loading Kakao Maps...
            </div>
        );
    }

    return <>{children}</>;
}

export const useKakaoMap = () => useContext(KakaoMapContext);
