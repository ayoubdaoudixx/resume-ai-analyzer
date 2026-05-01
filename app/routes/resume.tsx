import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router"
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import Details from "~/components/Details";
import ATS from "~/components/ATS";
import { JobCards } from "~/components/JobCards";

export const meta = () => ([
    { title: 'Resumer | Review'},
    { name: 'description', content: 'Detailed Review Of Your Resume'},
])

interface Job {
    role: string;
    company: string;
    skills: string[];
    location: string;
    url: string;
    score: number;
}

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [resumeUrl, setResumeUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [feedback, setFeedback] = useState<any | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading]);

    useEffect(() => {
        let timeoutId: any;
        let attempts = 0;
        const MAX_ATTEMPTS = 20;

        const loadresume = async () => {
            const resume = await kv.get(`resume:${id}`);
            if(!resume) return;
            const data = JSON.parse(resume);

            setFeedback(data.feedback);
            const recommended = data.recommendedJobs || [];
            setJobs(recommended);

            if (recommended.length === 0 && attempts < MAX_ATTEMPTS) {
                attempts += 1;
                timeoutId = setTimeout(loadresume, 3000);
            } else {
                setJobsLoading(false);
            }

            if (!resumeUrl) {
                const resumeBlob = await fs.read(data.resumePath);
                if(resumeBlob) {
                    const pdfBlob = new Blob([resumeBlob], {type: 'application/pdf'});
                    const url = URL.createObjectURL(pdfBlob);
                    setResumeUrl(url);
                }
            }

            if (!imageUrl) {
                const imageBlob = await fs.read(data.imagePath);
                if(imageBlob) {
                    const url = URL.createObjectURL(imageBlob);
                    setImageUrl(url);
                }
            }
        }

        if (!isLoading && auth.isAuthenticated) {
            loadresume();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isLoading, auth.isAuthenticated, id]);

    return (
        <main className="!pt-0 bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <nav className="resume-nav">
                <Link to="/" className="primary-button w-fit text-xl font-semibold">
                    Back To Home Page
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img src={imageUrl} className="w-full h-full object-contain rounded-2xl" title="resume" />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in-1000">
                            <Summary feedback={feedback}/>
                            <ATS score={feedback.ATS?.score || 0} suggestions={feedback.ATS?.tips || []}/>
                            <Details feedback={feedback}/>
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full"/>
                    )}
                </section>
            </div>

            <section className="w-full px-6 lg:px-16 py-16 bg-white/40 backdrop-blur-sm border-t border-gray-200">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                    Recommended Jobs Based on Your Profile
                </h1>
                <p className="text-gray-600 mb-10 text-lg">
                    Hand-picked roles ranked by how closely they match your resume.
                </p>

                {jobs.length > 0 ? (
                    <JobCards jobs={jobs} />
                ) : jobsLoading ? (
                    <div className="flex flex-col items-center justify-center p-16 bg-blue-50 rounded-2xl border border-dashed border-blue-200">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-blue-700 font-semibold text-lg">Searching for best-fitting roles based on your skills...</p>
                        <p className="text-blue-500 text-sm mt-1">This usually takes 20-30 seconds</p>
                    </div>
                ) : (
                    <div className="p-10 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <p className="text-gray-600 text-lg">No matching jobs were found right now. Try uploading another resume or check back shortly.</p>
                    </div>
                )}
            </section>
        </main>
    )
}

export default Resume
