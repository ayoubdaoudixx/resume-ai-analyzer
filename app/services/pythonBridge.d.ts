export type JobMatcherResult = {
    job_title?: string;
    job_id?: string;
    company?: string;
    location?: string;
    url?: string;
    skills?: string[];
    match_score?: number;
};

export function runJobMatcher(input: {
    searchQuery: string;
    resumeText: string;
}): Promise<JobMatcherResult[]>;
