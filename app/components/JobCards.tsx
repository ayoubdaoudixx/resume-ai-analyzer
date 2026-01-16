import { Briefcase, MapPin, ExternalLink } from "lucide-react";

interface Job {
    role: string;
    company: string;
    skills: string[];
    location: string;
    url: string;
    score: number;
}

export const JobCards = ({ jobs }: { jobs: Job[] }) => {
    return (
        <div className="mt-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-800">Matching Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job, i) => (
                    <div key={i} className="p-5 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-blue-600 truncate">{job.role}</h4>
                            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                                {Math.round(job.score * 100)}% Match
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Briefcase className="w-3 h-3 mr-1" /> {job.company}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> {job.location}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                            {job.skills.map(s => (
                                <span key={s} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{s}</span>
                            ))}
                        </div>
                        <a 
                            href={job.url} 
                            target="_blank" 
                            className="mt-4 w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Apply Now <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};