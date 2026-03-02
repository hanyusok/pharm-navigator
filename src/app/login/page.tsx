"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            setError("An error occurred during login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-500 p-3 rounded-2xl text-white shadow-md">
                        <MapPin size={32} />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-sm text-center text-gray-500 mb-8 font-medium">
                    Sign in to contribute FAX numbers
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 text-center border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-2xl font-bold tracking-wide transition-colors shadow-m items-center flex justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600 font-medium">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                        Register now
                    </Link>
                </p>
            </div>
        </div>
    );
}
