export interface JobSkill {
    name: string;
    matched: boolean;
}

export interface JobCard {
    role: string;
    company: string;
    skills: JobSkill[];
    location: string;
    url: string;
    score: number;
}

interface JSearchJob {
    job_id?: string;
    job_title?: string;
    job_description?: string;
    employer_name?: string;
    job_city?: string;
    job_country?: string;
    job_location?: string;
    job_apply_link?: string;
    job_highlights?: { Qualifications?: string[] };
}

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "have", "in", "is", "it", "its", "of", "on", "or", "that", "the", "to",
    "was", "were", "will", "with", "you", "your", "we", "our", "this", "their",
    "they", "them", "i", "me", "my", "but", "not", "if", "so", "do", "does",
    "did", "been", "being", "would", "could", "should", "than", "then", "there",
    "here", "any", "all", "can", "may", "more", "most", "such", "into", "about",
    "over", "under", "out", "up", "down", "very", "also", "etc",
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function termFreq(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
    if (tokens.length > 0) {
        for (const [k, v] of tf) tf.set(k, v / tokens.length);
    }
    return tf;
}

function tfidfVector(
    tf: Map<string, number>,
    idf: Map<string, number>
): Map<string, number> {
    const vec = new Map<string, number>();
    for (const [term, freq] of tf) {
        const w = idf.get(term);
        if (w) vec.set(term, freq * w);
    }
    return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
    let dot = 0;
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    for (const [k, v] of small) {
        const w = large.get(k);
        if (w) dot += v * w;
    }
    let normA = 0;
    for (const v of a.values()) normA += v * v;
    let normB = 0;
    for (const v of b.values()) normB += v * v;
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function fetchJSearch(searchQuery: string, apiKey: string): Promise<JSearchJob[]> {
    const url = new URL("https://jsearch.p.rapidapi.com/search");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("page", "1");
    url.searchParams.set("num_pages", "1");
    url.searchParams.set("date_posted", "all");
    url.searchParams.set("remote_jobs_only", "false");

    const res = await fetch(url.toString(), {
        headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
    });

    if (!res.ok) {
        throw new Error(`JSearch error ${res.status}: ${await res.text()}`);
    }
    const body = await res.json();
    return Array.isArray(body?.data) ? (body.data as JSearchJob[]) : [];
}

// Skill is "matched" if at least one meaningful keyword (length ≥ 4 chars,
// non-stopword — so generic words like "team" or "year" don't trigger
// false positives) from the qualification text appears in the resume.
function matchSkill(skillText: string, resumeTokenSet: Set<string>): boolean {
    const tokens = tokenize(skillText).filter((t) => t.length >= 4);
    if (tokens.length === 0) return false;
    return tokens.some((t) => resumeTokenSet.has(t));
}

function rankJobs(resumeText: string, jobs: JSearchJob[]): JobCard[] {
    const resumeTokens = tokenize(resumeText);
    if (resumeTokens.length === 0 || jobs.length === 0) return [];

    const resumeTokenSet = new Set(resumeTokens);

    const docs = jobs
        .map((job) => ({
            tokens: tokenize(`${job.job_title || ""} ${job.job_description || ""}`),
            job,
        }))
        .filter((d) => d.tokens.length > 0);

    const allDocs = [resumeTokens, ...docs.map((d) => d.tokens)];
    const N = allDocs.length;

    const df = new Map<string, number>();
    for (const doc of allDocs) {
        const seen = new Set(doc);
        for (const term of seen) df.set(term, (df.get(term) || 0) + 1);
    }
    const idf = new Map<string, number>();
    for (const [term, count] of df) {
        idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
    }

    const resumeVec = tfidfVector(termFreq(resumeTokens), idf);

    const ranked: JobCard[] = docs.map(({ tokens, job }) => {
        const jobVec = tfidfVector(termFreq(tokens), idf);
        const score = cosine(resumeVec, jobVec);

        const quals = job.job_highlights?.Qualifications;
        const skills: JobSkill[] = Array.isArray(quals)
            ? quals.slice(0, 3).map((q) => ({
                  name: q,
                  matched: matchSkill(q, resumeTokenSet),
              }))
            : [];
        const locParts = [job.job_city, job.job_country].filter(Boolean) as string[];
        const location = locParts.length ? locParts.join(", ") : job.job_location || "Remote";

        return {
            role: job.job_title || "",
            company: job.employer_name || "",
            skills,
            location,
            url: job.job_apply_link || "",
            score: Number(score.toFixed(4)),
        };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, 6);
}

export async function recommendJobs(
    searchQuery: string,
    resumeText: string
): Promise<JobCard[]> {
    const trimmedQuery = searchQuery?.trim();
    const trimmedText = resumeText?.trim();
    if (!trimmedQuery || !trimmedText) return [];

    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY as string | undefined;
    if (!apiKey) {
        console.error("VITE_RAPIDAPI_KEY missing — set it in .env to enable job recommendations");
        return [];
    }

    try {
        const jobs = await fetchJSearch(trimmedQuery, apiKey);
        return rankJobs(trimmedText, jobs);
    } catch (err) {
        console.error("Job recommendation failed:", err);
        return [];
    }
}
