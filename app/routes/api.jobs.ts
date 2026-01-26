import { runJobMatcher } from "../services/pythonBridge";

type JobMatcherResult = {
    job_title?: string;
    job_id?: string;
    company?: string;
    location?: string;
    url?: string;
    skills?: string[];
    match_score?: number;
};

type JobCard = {
    role: string;
    company: string;
    skills: string[];
    location: string;
    url: string;
    score: number;
};

export async function action({ request }: { request: Request }) {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    let payload: { searchQuery?: string; resumeText?: string } | null = null;
    try {
        payload = await request.json();
    } catch {
        payload = null;
    }

    if (!payload?.searchQuery || !payload.resumeText) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    const rawJobs = await runJobMatcher({
        searchQuery: payload.searchQuery,
        resumeText: payload.resumeText,
    });

    const jobs = Array.isArray(rawJobs)
        ? rawJobs.map((job: JobMatcherResult): JobCard => ({
              role: job.job_title || "",
              company: job.company || "",
              skills: Array.isArray(job.skills) ? job.skills : [],
              location: job.location || "Remote",
              url: job.url || "",
              score: typeof job.match_score === "number" ? job.match_score : 0,
          }))
        : [];

    return new Response(JSON.stringify(jobs), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
