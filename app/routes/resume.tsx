import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router"
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import Details from "~/components/Details";
import ATS from "~/components/ATS";
import { Briefcase, MapPin, ExternalLink } from "lucide-react";

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
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading]);

    useEffect(() => {
        let timeoutId: any;

        const loadresume = async () => {
            const resume = await kv.get(`resume:${id}`);
            if(!resume) return;
            const data = JSON.parse(resume);

            // Update feedback and jobs
            setFeedback(data.feedback);
            setJobs(data.recommendedJobs || []);

            // Live update: Poll every 3 seconds if jobs aren't loaded yet
            if (!data.recommendedJobs || data.recommendedJobs.length === 0) {
                timeoutId = setTimeout(loadresume, 3000);
            }

            // Load resume blob
            if (!resumeUrl) {
                const resumeBlob = await fs.read(data.resumePath);
                if(resumeBlob) {
                    const pdfBlob = new Blob([resumeBlob], {type: 'application/pdf'});
                    const url = URL.createObjectURL(pdfBlob);
                    setResumeUrl(url);
                }
            }

            // Load image blob
            if (!imageUrl) {
                const imageBlob = await fs.read(data.imagePath);
                if(imageBlob) {
                    const url = URL.createObjectURL(imageBlob);
                    setImageUrl(url);
                }
            }

            console.log({resumeUrl, imageUrl, feedback: data.feedback, jobs: data.recommendedJobs});
        }

        if (!isLoading && auth.isAuthenticated) {
            loadresume();
        }

        // Cleanup timeout on unmount
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

                            {/* Recommended Jobs Section */}
                            <div className="mt-12 border-t pt-8">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6">Jobs Recommended For You</h3>
                                
                                {jobs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {jobs.map((job, index) => (
                                            <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{job.role}</h4>
                                                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg">
                                                        {Math.round(job.score * 100)}% Match
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                                                    <Briefcase size={14} /> {job.company}
                                                </p>
                                                <p className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                                                    <MapPin size={14} /> {job.location}
                                                </p>
                                                <a 
                                                    href={job.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors gap-2"
                                                >
                                                    Apply Now <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center p-8 bg-blue-50 rounded-2xl border border-dashed border-blue-200">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                        <p className="text-blue-600 font-medium">Searching for best-fitting roles based on your skills...</p>
                                        <p className="text-blue-400 text-xs mt-1">This takes about 20-30 seconds</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full"/>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Resume