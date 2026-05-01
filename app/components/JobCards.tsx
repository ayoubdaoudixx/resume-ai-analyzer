import { ArrowRight, Building2, MapPin } from "lucide-react";

interface Job {
    role: string;
    company: string;
    skills: string[];
    location: string;
    url: string;
    score: number;
}

const MatchCircle = ({ score, gradId }: { score: number; gradId: string }) => {
    const size = 60;
    const stroke = 6;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const progress = Math.max(0, Math.min(1, score / 100));
    const dashOffset = c * (1 - progress);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradId} x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF97AD" />
                        <stop offset="100%" stopColor="#5171FF" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="#ffffff"
                    strokeWidth={stroke}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={`url(#${gradId})`}
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={c}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold text-gray-900">{score}%</span>
            </div>
        </div>
    );
};

export const JobCards = ({ jobs }: { jobs: Job[] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, i) => {
                const matchPct = Math.round(job.score * 100);
                return (
                    <article
                        key={`${job.url}-${i}`}
                        className="flex flex-col bg-white rounded-3xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_18px_40px_-18px_rgba(96,107,235,0.4)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        <div className="relative flex flex-col gap-5 p-7 bg-[#dde6f7] flex-1">
                            <div className="absolute top-5 right-5">
                                <MatchCircle score={matchPct} gradId={`grad-${i}`} />
                            </div>

                            <div className="flex flex-col gap-3 pr-20">
                                <h3 className="text-[1.6rem] leading-tight font-bold text-gray-900 line-clamp-2 min-h-[4rem]">
                                    {job.role || "Untitled role"}
                                </h3>
                                <div className="flex flex-col gap-1.5 text-sm text-dark-200">
                                    <span className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 shrink-0" />
                                        <span className="font-medium text-gray-800 line-clamp-1">
                                            {job.company || "Unknown company"}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="line-clamp-1">{job.location}</span>
                                    </span>
                                </div>
                            </div>

                            {job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {job.skills.map((s, idx) => (
                                        <span
                                            key={`${s}-${idx}`}
                                            title={s}
                                            className="px-4 py-1.5 text-xs font-medium text-dark-200 bg-[#c1d3f8] rounded-full line-clamp-1 max-w-[14rem]"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-4 px-6 py-5 group/btn hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-lg font-semibold text-gray-900">
                                Apply Now
                            </span>
                            <span className="flex items-center justify-center w-11 h-11 rounded-xl primary-gradient shadow-[0_6px_18px_-6px_rgba(96,107,235,0.55)] group-hover/btn:shadow-[0_10px_22px_-6px_rgba(96,107,235,0.7)] transition-all duration-300 group-hover/btn:translate-x-0.5">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </span>
                        </a>
                    </article>
                );
            })}
        </div>
    );
};
