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
    salary: string;
    employmentType: string;
    employerLogo: string;
    postedAt: string;
}

interface JSearchJob {
    job_id?: string;
    job_title?: string;
    job_description?: string;
    employer_name?: string;
    employer_logo?: string;
    job_city?: string;
    job_country?: string;
    job_location?: string;
    job_apply_link?: string;
    job_employment_type?: string;
    job_is_remote?: boolean;
    job_min_salary?: number;
    job_max_salary?: number;
    job_salary_currency?: string;
    job_salary_period?: string;
    job_posted_at_datetime_utc?: string;
    job_required_skills?: string[];
    job_highlights?: { Qualifications?: string[] };
    apply_options?: Array<{ publisher?: string; apply_link?: string; is_direct?: boolean }>;
    job_google_link?: string;
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

// Canonical short-name skills. Each entry is [display, ...aliases]: any alias
// found in the job text surfaces the display label as a chip. Lowercased
// matching against tokenized text, so multi-word aliases use a single token
// (e.g. "nodejs"). Phrases like "node.js" tokenize to "node" + "js" so we
// list both forms.
const SKILL_VOCAB: Array<[string, ...string[]]> = [
    ["Python", "python"],
    ["JavaScript", "javascript", "js"],
    ["TypeScript", "typescript", "ts"],
    ["React", "react", "reactjs"],
    ["Next.js", "nextjs", "next"],
    ["Vue", "vue", "vuejs"],
    ["Angular", "angular"],
    ["Node.js", "nodejs", "node"],
    ["Express", "express", "expressjs"],
    ["Django", "django"],
    ["Flask", "flask"],
    ["FastAPI", "fastapi"],
    ["Java", "java"],
    ["Kotlin", "kotlin"],
    ["Swift", "swift"],
    ["Go", "golang"],
    ["Rust", "rust"],
    ["C++", "cpp"],
    ["C#", "csharp"],
    ["Ruby", "ruby"],
    ["Rails", "rails"],
    ["PHP", "php"],
    ["Laravel", "laravel"],
    ["SQL", "sql"],
    ["PostgreSQL", "postgres", "postgresql"],
    ["MySQL", "mysql"],
    ["MongoDB", "mongodb", "mongo"],
    ["Redis", "redis"],
    ["GraphQL", "graphql"],
    ["REST", "rest", "restful"],
    ["AWS", "aws"],
    ["GCP", "gcp"],
    ["Azure", "azure"],
    ["Docker", "docker"],
    ["Kubernetes", "kubernetes", "k8s"],
    ["Terraform", "terraform"],
    ["CI/CD", "cicd"],
    ["Git", "git"],
    ["Linux", "linux"],
    ["HTML", "html"],
    ["CSS", "css"],
    ["Tailwind", "tailwind", "tailwindcss"],
    ["Sass", "sass", "scss"],
    ["PyTorch", "pytorch"],
    ["TensorFlow", "tensorflow"],
    ["Pandas", "pandas"],
    ["NumPy", "numpy"],
    ["Scikit-learn", "sklearn", "scikit"],
    ["LLM", "llm", "llms"],
    ["RAG", "rag"],
    ["NLP", "nlp"],
    ["Machine Learning", "ml"],
    ["Deep Learning", "dl"],
    ["Computer Vision", "vision"],
    ["LangChain", "langchain"],
    ["Spark", "spark"],
    ["Kafka", "kafka"],
    ["Airflow", "airflow"],
    ["Hadoop", "hadoop"],
    ["Snowflake", "snowflake"],
    ["dbt", "dbt"],
    ["Figma", "figma"],
    ["Agile", "agile"],
    ["Scrum", "scrum"],
    ["Jira", "jira"],
];

// Used when a posting includes the structured `job_required_skills` array —
// we trust that as the chip source and just decide matched/unmatched.
function skillsFromRequired(
    required: string[],
    resumeTokenSet: Set<string>
): JobSkill[] {
    const seen = new Set<string>();
    const out: JobSkill[] = [];
    for (const raw of required) {
        const name = String(raw || "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const tokens = tokenize(name);
        const matched = tokens.length > 0 && tokens.some((t) => resumeTokenSet.has(t));
        out.push({ name, matched });
    }
    out.sort((a, b) => Number(b.matched) - Number(a.matched));
    return out.slice(0, 5);
}

function extractSkills(
    jobText: string,
    resumeTokenSet: Set<string>
): JobSkill[] {
    const jobTokenSet = new Set(tokenize(jobText));
    const skills: JobSkill[] = [];
    const seen = new Set<string>();
    for (const [label, ...aliases] of SKILL_VOCAB) {
        if (seen.has(label)) continue;
        const inJob = aliases.some((a) => jobTokenSet.has(a));
        if (!inJob) continue;
        const matched = aliases.some((a) => resumeTokenSet.has(a));
        skills.push({ name: label, matched });
        seen.add(label);
    }
    // Prefer matched skills first so the user sees their wins, then fill with
    // unmatched. Cap at 5 chips — the table column is narrow.
    skills.sort((a, b) => Number(b.matched) - Number(a.matched));
    return skills.slice(0, 5);
}

function formatSalary(job: JSearchJob): string {
    const min = Number(job.job_min_salary) || 0;
    const max = Number(job.job_max_salary) || 0;
    if (!min && !max) return "—";
    const currency = (job.job_salary_currency || "USD").toUpperCase();
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
    const round = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`);
    const period = (job.job_salary_period || "").toUpperCase();
    const suffix = period === "HOUR" ? "/hr" : period === "MONTH" ? "/mo" : "";
    const prefix = symbol || `${currency} `;
    if (min && max && min !== max) return `${prefix}${round(min)}–${round(max)}${suffix}`;
    return `${prefix}${round(max || min)}${suffix}`;
}

function pickApplyUrl(job: JSearchJob): string {
    if (job.job_apply_link && /^https?:\/\//i.test(job.job_apply_link)) {
        return job.job_apply_link;
    }
    const options = Array.isArray(job.apply_options) ? job.apply_options : [];
    const direct = options.find((o) => o?.is_direct && o?.apply_link);
    if (direct?.apply_link && /^https?:\/\//i.test(direct.apply_link)) {
        return direct.apply_link;
    }
    const any = options.find((o) => o?.apply_link && /^https?:\/\//i.test(o.apply_link!));
    if (any?.apply_link) return any.apply_link;
    if (job.job_google_link && /^https?:\/\//i.test(job.job_google_link)) {
        return job.job_google_link;
    }
    return "";
}

function formatEmploymentType(raw?: string): string {
    switch ((raw || "").toUpperCase()) {
        case "FULLTIME": return "Full-time";
        case "PARTTIME": return "Part-time";
        case "CONTRACTOR": return "Contract";
        case "INTERN": return "Internship";
        default: return raw || "Full-time";
    }
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
        // Prefer the structured `job_required_skills` array when present —
        // it's already a clean list. Fall back to vocabulary scan over the
        // full posting text otherwise.
        const skills =
            Array.isArray(job.job_required_skills) && job.job_required_skills.length > 0
                ? skillsFromRequired(job.job_required_skills, resumeTokenSet)
                : extractSkills(
                      [
                          job.job_title || "",
                          job.job_description || "",
                          Array.isArray(quals) ? quals.join(" ") : "",
                      ].join(" "),
                      resumeTokenSet
                  );

        const locParts = [job.job_city, job.job_country].filter(Boolean) as string[];
        const baseLocation = locParts.length ? locParts.join(", ") : job.job_location || "Remote";
        const location = job.job_is_remote ? `Remote · ${baseLocation}` : baseLocation;

        return {
            role: job.job_title || "",
            company: job.employer_name || "",
            skills,
            location,
            url: pickApplyUrl(job),
            score: Number(score.toFixed(4)),
            salary: formatSalary(job),
            employmentType: formatEmploymentType(job.job_employment_type),
            employerLogo: job.employer_logo || "",
            postedAt: job.job_posted_at_datetime_utc || "",
        };
    });

    // Drop postings without a usable apply URL — recommending a job we can't
    // link to just sends the user to a dead "#" anchor.
    const applicable = ranked.filter((c) => /^https?:\/\//i.test(c.url));
    applicable.sort((a, b) => b.score - a.score);
    return applicable.slice(0, 6);
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
