"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Printer, Send, Clock, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

type FaxRecord = {
    id: string;
    faxNumber: string;
    createdAt: string;
    user: {
        name: string;
    };
};

type Pharmacy = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    address: string;
    phone: string;
    typeDesc: string;
    openDate: string;
    faxs?: FaxRecord[];
};

type SidebarProps = {
    pharmacy: Pharmacy | null;
    onClose: () => void;
};

export function Sidebar({ pharmacy: initialPharmacy, onClose }: SidebarProps) {
    const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
    const [loading, setLoading] = useState(false);
    const [faxInput, setFaxInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        if (initialPharmacy) {
            setPharmacy(initialPharmacy);
            fetchPharmacyDetails(initialPharmacy.id);
        } else {
            setPharmacy(null);
        }
    }, [initialPharmacy]);

    const fetchPharmacyDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pharmacies/${id}`);
            if (res.ok) {
                const data = await res.json();
                setPharmacy(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const submitFax = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pharmacy || !faxInput || !session) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/pharmacies/${pharmacy.id}/fax`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ faxNumber: faxInput }),
            });

            if (res.ok) {
                setFaxInput("");
                fetchPharmacyDetails(pharmacy.id); // Refresh data
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {pharmacy && (
                <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute top-0 right-0 h-full w-full md:w-[400px] bg-white/90 backdrop-blur-xl shadow-2xl border-l border-white/50 z-20 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3">
                                    {pharmacy.typeDesc || "Pharmacy"}
                                </span>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                    {pharmacy.name}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {/* Details Section */}
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 text-gray-700">
                                <MapPin className="text-blue-500 mt-1 shrink-0" size={20} />
                                <p className="text-sm leading-relaxed">{pharmacy.address}</p>
                            </div>

                            {pharmacy.phone && (
                                <div className="flex items-center space-x-3 text-gray-700">
                                    <Phone className="text-blue-500 shrink-0" size={20} />
                                    <p className="text-sm font-medium">{pharmacy.phone}</p>
                                </div>
                            )}

                            {pharmacy.openDate && (
                                <div className="flex items-center space-x-3 text-gray-700">
                                    <Clock className="text-blue-500 shrink-0" size={20} />
                                    <p className="text-sm">Opened: {pharmacy.openDate}</p>
                                </div>
                            )}
                        </div>

                        <hr className="border-gray-100" />

                        {/* FAX Section */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <Printer className="text-indigo-500" size={20} />
                                <h3 className="text-lg font-bold text-gray-900">FAX Numbers</h3>
                            </div>

                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pharmacy.faxs && pharmacy.faxs.length > 0 ? (
                                        pharmacy.faxs.map((fax) => (
                                            <div
                                                key={fax.id}
                                                className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center group hover:bg-white transition-colors hover:shadow-sm"
                                            >
                                                <span className="font-mono text-base font-bold text-gray-800">
                                                    {fax.faxNumber}
                                                </span>
                                                <div className="text-right">
                                                    <span className="block text-xs text-gray-400">
                                                        by {fax.user.name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                            <AlertCircle className="mx-auto text-gray-400 mb-2" size={24} />
                                            <p className="text-sm text-gray-500">No FAX numbers shared yet.</p>
                                            <p className="text-xs text-gray-400 mt-1">Be the first to help the community!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submission Form */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/80">
                        {session ? (
                            <form onSubmit={submitFax} className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter FAX number (e.g. 02-123-4567)"
                                    value={faxInput}
                                    onChange={(e) => setFaxInput(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    Please <a href="/login" className="font-bold underline">sign in</a> to share a FAX number.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
