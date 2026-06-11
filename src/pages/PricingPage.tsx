import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { DiagfloLogo } from "@/components/logo/DiagfloLogo";
import { Sparkles, Zap, Building2, Crown, Lock, Sun, Moon, ArrowRight, CheckCircle } from "lucide-react";
import { useCanonical } from "@/hooks/use-canonical";

const PricingPage = () => {
    const [isDark, setIsDark] = useState(true);
    useCanonical("/pricing");

    useEffect(() => {
        document.title = "Pricing | Diagflo";
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(!isDark);
    };

    // Waitlist State
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [joinedWaitlist, setJoinedWaitlist] = useState(false);

    const handleJoinWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok && response.status !== 409) {
                throw new Error(`Waitlist request failed (${response.status})`);
            }

            setJoinedWaitlist(true);
            setEmail("");
        } catch (error) {
            console.error("Failed to join waitlist", error);
        } finally {
            setLoading(false);
        }
    };

    // Teaser tier previews (blurred)
    const tiers = [
        {
            id: 'maker',
            name: 'Maker',
            tagline: 'For indie creators',
            icon: Zap,
            color: 'green',
        },
        {
            id: 'pro',
            name: 'Pro',
            tagline: 'For power users',
            icon: Sparkles,
            color: 'orange',
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            tagline: 'For organizations',
            icon: Building2,
            color: 'purple',
        },
    ];

    return (
        <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-[#F5F5F7]' : 'bg-[#fafafa] text-[#111111]'}`}>

            {/* Navigation */}
            <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/60 border-black/5'}`}>
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <DiagfloLogo className="w-7 h-7" />
                        <span className="font-semibold text-[15px] bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Diagflo</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-black/40'}`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun className="w-[18px] h-[18px]" />
                            ) : (
                                <Moon className="w-[18px] h-[18px]" />
                            )}
                        </button>
                        <Link
                            to="/app"
                            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
                        >
                            Open App
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-20 min-h-[80vh] flex flex-col items-center justify-center">

                {/* Coming Soon Hero */}
                <div className="text-center mb-16 relative">
                    {/* Floating Crown Icon */}
                    <div className="relative inline-block mb-8">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto ${isDark ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30' : 'bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200'}`}>
                            <Crown className={`w-12 h-12 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                        </div>
                        {/* Animated Pulse Ring */}
                        <div className="absolute inset-0 rounded-3xl border-2 border-orange-500/30 animate-ping opacity-30" />
                    </div>

                    {/* Coming Soon Badge */}
                    <div className="flex justify-center mb-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'}`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <span className={`text-sm font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                Coming Soon
                            </span>
                        </div>
                    </div>

                    <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                        Premium Plans
                        <br />
                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                            are cooking
                        </span>
                    </h1>
                    <p className={`text-lg sm:text-xl max-w-2xl mx-auto mb-4 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        We're crafting the perfect pricing plans to supercharge your diagramming experience.
                    </p>
                    <p className={`text-base max-w-xl mx-auto ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        Until then, enjoy all features with your own API key — completely free.
                    </p>
                </div>

                {/* Blurred Tier Cards Teaser */}
                <div className="w-full max-w-4xl mb-16">
                    <div className="relative">
                        {/* Blur overlay */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-lg ${isDark ? 'bg-black/60 border border-white/10' : 'bg-white/60 border border-black/10'}`}>
                                <Lock className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    Pricing details coming soon
                                </span>
                            </div>
                        </div>

                        {/* Blurred cards grid */}
                        <div className="grid md:grid-cols-3 gap-4 blur-sm opacity-40 pointer-events-none select-none">
                            {tiers.map((tier) => {
                                const TierIcon = tier.icon;
                                const colorClasses = {
                                    green: isDark ? 'from-green-500/20 to-green-500/5 border-green-500/30' : 'from-green-50 to-white border-green-200',
                                    orange: isDark ? 'from-orange-500/20 to-orange-500/5 border-orange-500/30' : 'from-orange-50 to-white border-orange-200',
                                    purple: isDark ? 'from-purple-500/20 to-purple-500/5 border-purple-500/30' : 'from-purple-50 to-white border-purple-200',
                                };

                                return (
                                    <div
                                        key={tier.id}
                                        className={`rounded-2xl p-6 bg-gradient-to-b border ${colorClasses[tier.color as keyof typeof colorClasses]}`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.color === 'green' ? 'bg-green-500 text-white' :
                                                tier.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' :
                                                    'bg-purple-500 text-white'
                                                }`}>
                                                <TierIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{tier.name}</h3>
                                                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>{tier.tagline}</p>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <div className={`h-6 w-20 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className={`h-3 w-full rounded ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
                                            <div className={`h-3 w-5/6 rounded ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
                                            <div className={`h-3 w-4/6 rounded ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className={`text-center p-8 rounded-2xl w-full max-w-2xl ${isDark ? 'bg-white/[0.02] border border-white/5' : 'bg-black/[0.02] border border-black/5'}`}>
                    <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                        Start creating for free today
                    </h3>
                    <p className={`text-sm mb-6 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        Use your own API key and unlock unlimited diagrams. No credit card required.
                    </p>
                    <Link
                        to="/app"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 transition-all shadow-lg shadow-orange-500/25"
                    >
                        Open Diagflo
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Waitlist Section */}
                <div className="mt-12 text-center w-full max-w-sm mx-auto">
                    {!joinedWaitlist ? (
                        <>
                            <p className={`text-sm mb-4 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                Want to be notified when Premium launches?
                            </p>
                            <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm outline-none transition-all border ${isDark
                                        ? 'bg-white/5 border-white/10 text-white focus:border-orange-500/50'
                                        : 'bg-black/5 border-black/10 text-black focus:border-orange-500/50'
                                        }`}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${loading
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:scale-105 active:scale-95'
                                        } ${isDark
                                            ? 'bg-white text-black hover:bg-gray-200'
                                            : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {loading ? 'Joining...' : 'Notify Me'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600'}`}>
                            <p className="text-sm font-medium flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                You're on the list!
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className={`py-8 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DiagfloLogo className="w-6 h-6" />
                        <span className="text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Diagflo</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                        © 2026 Diagflo. All rights reserved.
                    </p>
                    <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                        <Link to="/privacy" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Privacy</Link>
                        <Link to="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Terms</Link>
                    </div>
                </div>
            </footer>

            {/* Inline Styles */}
            <style>{`
        .font-sans {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
        </div>
    );
};

export default PricingPage;
