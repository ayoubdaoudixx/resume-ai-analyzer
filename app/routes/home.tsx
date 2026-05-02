import Navbar from '../components/Navbar';
import type { Route } from "./+types/home";
import ResumeCarousel from "~/components/ResumeCarousel";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumer" },
        { name: "description", content: "Your AI-powered resume coach" },
    ];
}

const steps = [
    {
        number: "01",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <rect x="8" y="4" width="28" height="36" rx="3" fill="url(#pdf-grad)" />
                <path d="M28 4v10h8" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.6"/>
                <rect x="14" y="20" width="16" height="2" rx="1" fill="white" opacity="0.8"/>
                <rect x="14" y="25" width="12" height="2" rx="1" fill="white" opacity="0.6"/>
                <rect x="14" y="30" width="14" height="2" rx="1" fill="white" opacity="0.6"/>
                <circle cx="36" cy="36" r="9" fill="url(#upload-grad)" />
                <path d="M36 33v6M33 35l3-3 3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                    <linearGradient id="pdf-grad" x1="8" y1="4" x2="36" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#818cf8"/>
                        <stop offset="1" stopColor="#606beb"/>
                    </linearGradient>
                    <linearGradient id="upload-grad" x1="27" y1="27" x2="45" y2="45" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#34d399"/>
                        <stop offset="1" stopColor="#059669"/>
                    </linearGradient>
                </defs>
            </svg>
        ),
        title: "Upload Your Resume",
        description: "Drop your PDF resume into Resumer. We accept any standard resume format up to 20MB — no reformatting needed.",
    },
    {
        number: "02",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <circle cx="24" cy="24" r="18" fill="url(#scan-bg)" opacity="0.15"/>
                <circle cx="24" cy="24" r="13" stroke="url(#scan-stroke)" strokeWidth="2" fill="none"/>
                <path d="M17 24h14M24 17v14" stroke="url(#scan-stroke)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="24" cy="24" r="3" fill="url(#scan-stroke)"/>
                <path d="M10 10l5 5M38 10l-5 5M10 38l5-5M38 38l-5-5" stroke="url(#scan-stroke)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                <defs>
                    <linearGradient id="scan-bg" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#606beb"/>
                        <stop offset="1" stopColor="#818cf8"/>
                    </linearGradient>
                    <linearGradient id="scan-stroke" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#606beb"/>
                        <stop offset="1" stopColor="#818cf8"/>
                    </linearGradient>
                </defs>
            </svg>
        ),
        title: "AI Deep Analysis",
        description: "Resumer AI engine parses your resume against ATS algorithms, evaluating structure, keywords, formatting, and content quality in seconds.",
    },
    {
        number: "03",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <rect x="6" y="30" width="6" height="12" rx="2" fill="url(#bar-grad-1)"/>
                <rect x="15" y="20" width="6" height="22" rx="2" fill="url(#bar-grad-2)"/>
                <rect x="24" y="24" width="6" height="18" rx="2" fill="url(#bar-grad-3)"/>
                <rect x="33" y="12" width="6" height="30" rx="2" fill="url(#bar-grad-4)"/>
                <path d="M6 28l9-8 9 4 12-14" stroke="#606beb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="6" cy="28" r="2" fill="#606beb"/>
                <circle cx="15" cy="20" r="2" fill="#606beb"/>
                <circle cx="24" cy="24" r="2" fill="#606beb"/>
                <circle cx="36" cy="14" r="2" fill="#606beb"/>
                <defs>
                    <linearGradient id="bar-grad-1" x1="6" y1="30" x2="12" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#c7d2fe"/><stop offset="1" stopColor="#818cf8"/></linearGradient>
                    <linearGradient id="bar-grad-2" x1="15" y1="20" x2="21" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#a5b4fc"/><stop offset="1" stopColor="#606beb"/></linearGradient>
                    <linearGradient id="bar-grad-3" x1="24" y1="24" x2="30" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#4957eb"/></linearGradient>
                    <linearGradient id="bar-grad-4" x1="33" y1="12" x2="39" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#606beb"/><stop offset="1" stopColor="#3730a3"/></linearGradient>
                </defs>
            </svg>
        ),
        title: "Instant ATS Score & Feedback",
        description: "Receive your Resumer compatibility score along with detailed, actionable feedback — exactly what hiring systems and recruiters look for.",
    },
    {
        number: "04",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <circle cx="24" cy="16" r="10" fill="url(#improve-grad)" opacity="0.15"/>
                <circle cx="24" cy="16" r="10" stroke="url(#improve-grad)" strokeWidth="2" fill="none"/>
                <path d="M20 16l3 3 5-5" stroke="url(#improve-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 32h24" stroke="url(#improve-grad)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15 37h18" stroke="url(#improve-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                <path d="M8 28c0-3 2-5 4-6" stroke="url(#improve-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                <path d="M40 28c0-3-2-5-4-6" stroke="url(#improve-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                <defs>
                    <linearGradient id="improve-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f59e0b"/>
                        <stop offset="1" stopColor="#d97706"/>
                    </linearGradient>
                </defs>
            </svg>
        ),
        title: "Areas of Improvement",
        description: "Pinpoint exactly where your resume falls short from missing keywords to weak impact statements with clear, prioritized suggestions.",
    },
    {
        number: "05",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <rect x="6" y="10" width="36" height="28" rx="4" fill="url(#job-bg)" opacity="0.12"/>
                <rect x="6" y="10" width="36" height="28" rx="4" stroke="url(#job-stroke)" strokeWidth="2" fill="none"/>
                <circle cx="18" cy="24" r="5" fill="url(#job-stroke)" opacity="0.2"/>
                <circle cx="18" cy="24" r="5" stroke="url(#job-stroke)" strokeWidth="1.5" fill="none"/>
                <path d="M15 24l2 2 4-4" stroke="url(#job-stroke)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="27" y="19" width="10" height="2" rx="1" fill="url(#job-stroke)" opacity="0.8"/>
                <rect x="27" y="23" width="8" height="2" rx="1" fill="url(#job-stroke)" opacity="0.6"/>
                <rect x="27" y="27" width="9" height="2" rx="1" fill="url(#job-stroke)" opacity="0.4"/>
                <path d="M18 6v4M30 6v4" stroke="url(#job-stroke)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                <defs>
                    <linearGradient id="job-bg" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#10b981"/>
                        <stop offset="1" stopColor="#059669"/>
                    </linearGradient>
                    <linearGradient id="job-stroke" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#10b981"/>
                        <stop offset="1" stopColor="#059669"/>
                    </linearGradient>
                </defs>
            </svg>
        ),
        title: "Best-Fit Job Matches",
        description: "Get job recommendations matched to your unique skill set, experience, and career profile — so you apply smarter, not harder.",
    },
];

export default function Home() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [showResumes, setShowResumes] = useState(true);

    useEffect(() => {
        if (!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated]);

    useEffect(() => {
        const loadResumes = async () => {
            setLoadingResumes(true);
            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            const parsedResumes = resumes?.map((resume) => (
                JSON.parse(resume.value) as Resume
            ));
            setResumes(parsedResumes || []);
            setLoadingResumes(false);
        };
        loadResumes();
    }, []);

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                {/* ── Hero ── */}
                <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-6">
                    {/* Left column */}
                    <div className="flex flex-col gap-8 max-lg:items-center max-lg:text-center">
                        <h1 className="!text-7xl max-md:!text-6xl">Resumer</h1>
                        <p className="text-xl text-dark-200 max-w-xl leading-relaxed">
                            Your AI-powered resume coach. Get an instant ATS score,
                            personalized feedback, and curated job matches tailored
                            to your profile — all in seconds.
                        </p>

                        <div className="gradient-border w-full max-w-xl">
                            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-white rounded-2xl">
                                <Link
                                    to="/upload"
                                    className="primary-gradient hover:[background:var(--tw-gradient-stops),linear-gradient(to_bottom,#717dff,#4957eb)] text-white font-semibold rounded-full px-8 py-4 whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(96,107,235,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(96,107,235,0.8)] transition-all duration-300"
                                >
                                    Get Your Score
                                </Link>
                                <div className="flex flex-col text-sm text-dark-200">
                                    <span className="font-semibold text-gray-800">Upload your resume</span>
                                    <span>PDF format (max 20MB).</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-dark-200 text-sm">
                            {["Instant ATS scoring", "AI-powered feedback", "Curated job matches"].map((label) => (
                                <span key={label} className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#606beb]" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                                    </svg>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right column — bigger image, aligned with text height */}
                    <div className="relative flex items-center justify-center self-stretch min-h-[580px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-light-blue-100 to-light-blue-200 blur-3xl opacity-60 rounded-full" />
                        <img
                            src="/images/home-ui.png"
                            alt="Resumer application preview"
                            className="relative w-full h-full max-w-none object-contain drop-shadow-[0_25px_45px_rgba(96,107,235,0.25)]"
                            style={{ minHeight: "520px", maxHeight: "680px" }}
                        />
                    </div>
                </div>

                {/* ── Resume History ── */}
                <div className="w-full max-w-[1850px] flex flex-col items-center gap-6 mt-20 pt-12 border-t border-gray-200">
                    {/* Header row */}
                    <div className="w-full flex flex-col items-center gap-2 text-center">
                        <h2 className="!text-4xl max-sm:!text-2xl text-dark-200 font-bold">
                            {!loadingResumes && resumes?.length === 0
                                ? "No resumes yet"
                                : "Your analyzed resumes"}
                        </h2>
                        <p className="text-dark-200 max-w-2xl">
                            {!loadingResumes && resumes?.length === 0
                                ? "Upload your first resume to start getting AI-powered feedback and job recommendations."
                                : "Review your previous submissions and revisit AI feedback any time."}
                        </p>
                    </div>

                    {loadingResumes && (
                        <div className="flex flex-col items-center justify-center">
                            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
                        </div>
                    )}

                    {!loadingResumes && resumes.length > 0 && showResumes && (
                        <div className="w-full">
                            <ResumeCarousel resumes={resumes} />
                        </div>
                    )}

                    {!loadingResumes && resumes.length === 0 && (
                        <Link
                            to="/upload"
                            className="primary-button w-fit text-xl font-semibold mt-2"
                        >
                            Upload your first resume
                        </Link>
                    )}

                    {/* Show less / show more toggle */}
                    {!loadingResumes && resumes.length > 0 && (
                        <button
                            onClick={() => setShowResumes((v) => !v)}
                            className="flex items-center gap-2 text-sm font-semibold text-[#606beb] hover:text-[#4957eb] border border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50 rounded-full px-6 py-2.5 transition-all duration-200 shadow-sm mt-2"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${showResumes ? "rotate-180" : "rotate-0"}`}
                                viewBox="0 0 20 20" fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                            </svg>
                            {showResumes ? "Show less" : "Show resumes"}
                        </button>
                    )}
                </div>

                {/* ── How It Works ── */}
                <div className="w-full max-w-[1400px] flex flex-col items-center gap-10 mt-24 pt-14 border-t border-gray-200 pb-20">
                    {/* Section header */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <span className="inline-flex items-center gap-2 text-[#606beb] text-sm font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6 3 3 0 000-6z"/>
                            </svg>
                            How It Works
                        </span>
                        <h2 className="!text-4xl max-sm:!text-2xl font-bold text-gray-900">
                            From upload to opportunity
                        </h2>
                        <p className="text-dark-200 max-w-xl text-base leading-relaxed">
                            Five simple steps that turn your resume into your strongest career asset.
                        </p>
                    </div>

                    {/* Steps grid */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                        {steps.map((step, index) => (
                            <div
                                key={step.number}
                                className="group relative flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(96,107,235,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(96,107,235,0.2)] hover:-translate-y-1 transition-all duration-300 text-center"
                            >
                                {/* Connector line (hidden on last card and small screens) */}
                                {index < steps.length - 1 && (
                                    <span className="hidden xl:block absolute top-[52px] -right-[10px] w-5 border-t-2 border-dashed border-indigo-200 z-10" />
                                )}

                                {/* Step number badge — centered */}
                                <span className="text-[11px] font-bold tracking-widest text-[#606beb] bg-indigo-50 border border-indigo-100 rounded-full px-3 py-0.5 leading-5 group-hover:bg-indigo-100 transition-colors duration-200">
                                    {step.number}
                                </span>

                                {/* Icon — centered */}
                                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] group-hover:shadow-[0_4px_16px_-4px_rgba(96,107,235,0.25)] transition-all duration-300">
                                    {step.icon}
                                </div>

                                {/* Text */}
                                <div className="flex flex-col gap-2 w-full">
                                    <h3 className="font-bold text-gray-900 text-base leading-snug text-center">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-dark-200 leading-relaxed text-justify">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        to="/upload"
                        className="primary-gradient text-white font-semibold rounded-full px-10 py-4 mt-2 shadow-[0_8px_24px_-8px_rgba(96,107,235,0.55)] hover:shadow-[0_12px_28px_-8px_rgba(96,107,235,0.75)] hover:scale-[1.03] transition-all duration-300 inline-block"
                    >
                        Start for free →
                    </Link>
                </div>
            </section>
        </main>
    );
}