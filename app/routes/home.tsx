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

export default function Home() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);

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
                <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-6">
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
                                    <span className="font-semibold text-gray-800">
                                        Upload your resume
                                    </span>
                                    <span>PDF format (max 20MB).</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-dark-200 text-sm">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#606beb]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                                </svg>
                                Instant ATS scoring
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#606beb]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                                </svg>
                                AI-powered feedback
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#606beb]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                                </svg>
                                Curated job matches
                            </span>
                        </div>
                    </div>

                    <div className="relative flex items-stretch justify-center self-stretch min-h-[520px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-light-blue-100 to-light-blue-200 blur-3xl opacity-60 rounded-full" />
                        <img
                            src="/images/home-ui.png"
                            alt="Resumer application preview"
                            className="relative w-full h-full max-w-none object-contain drop-shadow-[0_25px_45px_rgba(96,107,235,0.25)]"
                        />
                    </div>
                </div>

                <div className="w-full max-w-[1850px] flex flex-col items-center gap-6 mt-20 pt-12 border-t border-gray-200">
                    <div className="flex flex-col items-center gap-2 text-center">
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

                    {!loadingResumes && resumes.length > 0 && (
                        <ResumeCarousel resumes={resumes} />
                    )}

                    {!loadingResumes && resumes.length === 0 && (
                        <Link
                            to="/upload"
                            className="primary-button w-fit text-xl font-semibold mt-2"
                        >
                            Upload your first resume
                        </Link>
                    )}
                </div>
            </section>
        </main>
    );
}
