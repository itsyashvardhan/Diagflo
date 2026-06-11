import { useEffect, useState } from "react";
import { Sparkles, Terminal, ArrowRight, Database, Globe, Key, User } from "lucide-react";

export function HeroAnimation() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((v) => (v + 1) % 4);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full aspect-square md:aspect-video lg:aspect-square max-w-2xl mx-auto flex items-center justify-center">
            {/* Background glowing orbs */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 dark:bg-orange-500/10 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite_reverse]" />
            </div>

            <div className="relative w-full max-w-lg z-10 transition-transform duration-1000">
                <div className="shadow-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center space-x-2 px-4 py-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                        <div className="flex space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="ml-4 flex-1 flex justify-center">
                            <div className="text-[10px] font-medium tracking-wider text-black/50 dark:text-white/50 flex items-center gap-1.5 uppercase">
                                <Sparkles className="w-3 h-3" />
                                Diagflo AI
                            </div>
                        </div>
                    </div>

                    <div className="p-5 space-y-6">

                        {/* Input Box state */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Terminal className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="w-full bg-white dark:bg-[#0b0f15] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-black/80 dark:text-white/80 shadow-inner flex items-center">
                                <span className="typing-effect overflow-hidden whitespace-nowrap border-r-2 border-orange-500 pr-1 animate-[typing_2s_steps(40,end)_forwards]">
                                    {step === 0 ? "Mapping user auth flow..." : "Design a microservices auth flow"}
                                </span>
                            </div>
                        </div>

                        {/* Generated Code & Diagram Box */}
                        <div className={`transition-all duration-700 ${step > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="grid grid-cols-1 gap-4">

                                {/* Visual Diagram Representation */}
                                <div className="relative h-48 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 overflow-hidden p-4 flex flex-col items-center justify-center">

                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>

                                    <div className={`relative w-full h-full flex flex-col items-center justify-between transition-opacity duration-1000 ${step > 1 ? 'opacity-100' : 'opacity-0'}`}>

                                        {/* Level 1 */}
                                        <div className="flex gap-4">
                                            <div className="px-3 py-1.5 rounded bg-white dark:bg-[#131923] border border-orange-500/30 text-xs flex items-center gap-1.5 shadow-sm transform transition-all duration-500 hover:scale-105">
                                                <User className="w-3 h-3 text-orange-500" /> Client
                                            </div>
                                        </div>

                                        {/* Arrow down */}
                                        <div className="w-px h-8 bg-gradient-to-b from-orange-500/50 to-transparent relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_2s_infinite]">
                                            </div>
                                        </div>

                                        {/* Level 2 */}
                                        <div className="flex gap-8">
                                            <div className="px-3 py-1.5 rounded bg-white dark:bg-[#131923] border border-blue-500/30 text-xs flex items-center gap-1.5 shadow-sm transform transition-all duration-500 delay-100">
                                                <Globe className="w-3 h-3 text-blue-500" /> API Gateway
                                            </div>
                                        </div>

                                        {/* Branching arrows */}
                                        <div className="w-px h-5 bg-black/20 dark:bg-white/20 relative z-0" />
                                        <div className="flex w-[124px] justify-between mt-[-1px]">
                                            <div className="w-1/2 h-5 border-t border-l border-black/20 dark:border-white/20 rounded-tl-lg relative z-0">
                                                {step > 2 && <div className="absolute left-[-1px] top-0 w-[1px] h-full animate-[slideDown_1.5s_ease-out_forwards]" />}
                                            </div>
                                            <div className="w-1/2 h-5 border-t border-r border-black/20 dark:border-white/20 rounded-tr-lg relative z-0">
                                                {step > 2 && <div className="absolute right-[-1px] top-0 w-[1px] h-full animate-[slideDown_1.5s_ease-out_forwards_0.5s]" />}
                                            </div>
                                        </div>

                                        {/* Level 3 */}
                                        <div className="flex gap-6">
                                            <div className="px-3 py-1.5 rounded bg-white dark:bg-[#131923] border border-emerald-500/30 text-xs flex items-center gap-1.5 shadow-sm transform transition-all duration-500 delay-200">
                                                <Key className="w-3 h-3 text-emerald-500" /> Auth Service
                                            </div>
                                            <div className="px-3 py-1.5 rounded bg-white dark:bg-[#131923] border border-purple-500/30 text-xs flex items-center gap-1.5 shadow-sm transform transition-all duration-500 delay-300">
                                                <Database className="w-3 h-3 text-purple-500" /> Main DB
                                            </div>
                                         </div>

                                    </div>
                                </div>

                                {/* Progress indiciation */}
                                {step === 1 && (
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full animate-[progress_3s_ease-in-out]" />
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>

                {/* Floating decorative elements */}
                <div className={`absolute -right-4 top-1/2 transform -translate-y-1/2 transition-all duration-700 delay-500 ${step > 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                    <div className="bg-white dark:bg-[#131923] border border-black/10 dark:border-white/10 shadow-xl rounded-lg p-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-black/60 dark:text-white/60">Syntax Valid</span>
                    </div>
                </div>

            </div>

            <style>{`
        @keyframes slideDown {
          0% { height: 0; opacity: 1; }
          100% { height: 100%; opacity: 0; }
        }
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}</style>
        </div>
    );
}
