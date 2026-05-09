import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowUpRight, Filter as FilterIcon } from "lucide-react";

import { Shell } from "~/components/resumer/Shell";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumer — Jobs" },
  { name: "description", content: "Roles, read against your résumé." },
];

type ChipTuple = [name: string, matched: boolean];
type JobRow = {
  company: string;
  role: string;
  location: string;
  match: number;
  type: string;
  salary: string;
  url: string;
  chips: ChipTuple[];
  featured?: boolean;
  logo?: string;
  postedAt?: string;
};

const SAMPLE_JOBS: JobRow[] = [
  { company: "Stripe",    role: "Staff ML Engineer, Risk",  location: "Remote · US",     match: 94, type: "Full-time", salary: "$280–340K", url: "#", featured: true,
    chips: [["Python", true], ["PyTorch", true], ["Risk Models", true], ["LLM", false]] },
  { company: "Anthropic", role: "ML Research Engineer",     location: "SF · CA",         match: 89, type: "Full-time", salary: "$240–310K", url: "#",
    chips: [["LLM", true], ["RLHF", true], ["Distributed", true]] },
  { company: "Linear",    role: "Senior Product Engineer",  location: "Remote · Global", match: 81, type: "Full-time", salary: "$200–260K", url: "#",
    chips: [["TypeScript", true], ["React", true], ["Postgres", false]] },
  { company: "Vercel",    role: "Frontend Platform Lead",   location: "Remote · US",     match: 78, type: "Full-time", salary: "$220–290K", url: "#",
    chips: [["Next.js", true], ["TypeScript", true], ["Edge", false]] },
  { company: "Notion",    role: "AI Infra Engineer",        location: "NYC · NY",        match: 74, type: "Full-time", salary: "$210–280K", url: "#",
    chips: [["Python", true], ["Kubernetes", true], ["LangChain", true]] },
  { company: "Figma",     role: "Senior ML Engineer",       location: "SF · CA",         match: 71, type: "Full-time", salary: "$230–300K", url: "#",
    chips: [["Python", true], ["PyTorch", true], ["Vision", false]] },
  { company: "Ramp",      role: "Applied AI Engineer",      location: "NYC / Remote",    match: 66, type: "Full-time", salary: "$200–270K", url: "#",
    chips: [["LLM", true], ["RAG", true], ["Python", true]] },
  { company: "Replit",    role: "Engineer, AI Agents",      location: "SF · CA",         match: 62, type: "Full-time", salary: "$220–290K", url: "#",
    chips: [["Agents", false], ["TS", true], ["LLM", true]] },
];

const FILTERS_BASE: Array<[key: string, label: string]> = [
  ["all", "All"],
  ["remote", "Remote"],
  ["80", "80%+ match"],
  ["sr", "Senior+"],
  ["us", "US only"],
  ["new", "New this week"],
];

function applyFilter(jobs: JobRow[], filter: string): JobRow[] {
  switch (filter) {
    case "remote":
      return jobs.filter((j) => /remote/i.test(j.location));
    case "80":
      return jobs.filter((j) => j.match >= 80);
    case "sr":
      return jobs.filter((j) => /(senior|staff|lead|principal)/i.test(j.role));
    case "us":
      return jobs.filter((j) => /(US|NY|SF|CA|Remote · US)/.test(j.location));
    case "new": {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return jobs.filter((j) => {
        const t = j.postedAt ? Date.parse(j.postedAt) : NaN;
        return Number.isFinite(t) && t >= cutoff;
      });
    }
    default:
      return jobs;
  }
}

function avgMatch(jobs: JobRow[]): number {
  if (jobs.length === 0) return 0;
  return Math.round(jobs.reduce((a, b) => a + b.match, 0) / jobs.length);
}

function relativePosted(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) {
    const m = Math.max(1, Math.round(diff / minute));
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const h = Math.round(diff / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(diff / day);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { auth, kv } = usePuterStore();
  const [allJobs, setAllJobs] = useState<JobRow[]>(SAMPLE_JOBS);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/jobs");
  }, [auth.isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const records = (await kv.list("resume:*", true)) as KVItem[] | null;
        if (!records || cancelled) return;
        const parsed = records
          .map((r) => {
            try {
              return JSON.parse(r.value);
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Array<Resume & { recommendedJobs?: any[] }>;

        const allReco = parsed.flatMap((p) => p.recommendedJobs || []).filter(Boolean);
        if (allReco.length === 0) return;

        const mapped: JobRow[] = allReco.map((j: any) => {
          const matchPct = Math.max(0, Math.min(100, Math.round(Number(j.score ?? 0) * 100)));
          // New shape: { name, matched }. Legacy (old kv records): plain string —
          // treat as matched=true since we can't recompute without the resume text.
          const chips: ChipTuple[] = (Array.isArray(j.skills) ? j.skills.slice(0, 5) : []).map(
            (s: any): ChipTuple =>
              typeof s === "string"
                ? [s, true]
                : [String(s?.name || ""), Boolean(s?.matched)]
          );
          return {
            company: j.company || "Untitled",
            role: j.role || "Role",
            location: j.location || "—",
            match: matchPct,
            type: j.employmentType || "Full-time",
            salary: j.salary || "—",
            url: j.url || "#",
            chips,
            featured: false,
            logo: j.employerLogo || "",
            postedAt: j.postedAt || "",
          } as JobRow;
        });

        // Dedupe by job_apply_link (unique per posting); fall back to
        // company+role when url is missing. When the same posting was
        // recommended for multiple resumes, keep the highest match score.
        const dedupKey = (j: JobRow) =>
          j.url && j.url !== "#"
            ? j.url
            : `${j.company.toLowerCase()}|${j.role.toLowerCase()}`;
        const byKey = new Map<string, JobRow>();
        for (const job of mapped) {
          const key = dedupKey(job);
          const existing = byKey.get(key);
          if (!existing || job.match > existing.match) byKey.set(key, job);
        }

        const sorted = Array.from(byKey.values())
          .sort((a, b) => b.match - a.match)
          .map((j, i) => ({ ...j, featured: i === 0 }));

        if (!cancelled && sorted.length > 0) setAllJobs(sorted);
      } catch (err) {
        console.warn("jobs: failed to load", err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [kv]);

  const filteredJobs = useMemo(() => applyFilter(allJobs, filter), [allJobs, filter]);
  const avg = avgMatch(allJobs);
  const top = allJobs[0]?.match ?? 0;

  const filters: Array<[string, string]> = FILTERS_BASE.map(([k, l]) =>
    k === "all" ? [k, `All ${allJobs.length}`] : [k, l]
  );

  return (
    <Shell>
      <div className="jobs-page">
        <section className="jobs-hero">
          <div className="left">
            <span className="eyebrow">No. 004 / Match</span>
            <h1 className="jobs-h1">
              Roles, read{" "}
              <span className="muted">against your resume.</span>
            </h1>
            <p className="jobs-lead">
              {allJobs.length} roles, ranked by alignment with the document we
              just analyzed. Hover any row to see which keywords you already
              match — and which to add before you apply.
            </p>
            <div className="filters">
              {filters.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className={`filter ${filter === k ? "active" : ""}`}
                  onClick={() => setFilter(filter === k && k !== "all" ? "all" : k)}
                >
                  {filter === k && k !== "all" && <span className="x">×</span>}
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="right">
            <span className="eyebrow">Match summary</span>
            <div className="match-summary">
              <div className="num">
                {avg}
                <small>%</small>
              </div>
              <div className="desc">
                <h3>Average alignment, top {allJobs.length}</h3>
                <p>
                  Up from 64% in your previous run — the keyword edits we
                  recommended are paying off across the board.
                </p>
              </div>
            </div>
            <div className="summary-mini">
              <div className="cell">
                <div className="num">{top}%</div>
                <div className="lbl">Top match</div>
              </div>
              <div className="cell">
                <div className="num">3</div>
                <div className="lbl">New today</div>
              </div>
              <div className="cell">
                <div className="num">12</div>
                <div className="lbl">Saved</div>
              </div>
            </div>
          </div>
        </section>

        <div className="jobs-table-wrap">
          <div className="jobs-toolbar">
            <span className="eyebrow">
              {filteredJobs.length} roles · sorted by match · updated 09:14
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="filter">Sort: Match ↓</button>
              <button type="button" className="filter">
                <FilterIcon size={11} strokeWidth={1.75} /> More
              </button>
            </div>
          </div>

          <table className="jobs-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Keywords</th>
                <th>Compensation</th>
                <th className="right">Match</th>
                <th className="right">Apply</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((j, i) => {
                const matchClass = j.match >= 80 ? "" : j.match >= 65 ? "mid" : "weak";
                return (
                  <tr
                    key={`${j.company}-${j.role}-${i}`}
                    className={j.featured ? "featured" : ""}
                  >
                    <td>
                      <div className="role-cell">
                        <img
                          className={`employer-logo${j.logo ? "" : " fallback"}`}
                          src={j.logo || (j.featured ? "/resumer-white.png" : "/resumer-black.png")}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            const fb = j.featured ? "/resumer-white.png" : "/resumer-black.png";
                            if (img.src.endsWith(fb)) return;
                            img.src = fb;
                            img.classList.add("fallback");
                          }}
                        />
                        <div className="role-text">
                          <span className="role-name">{j.role}</span>
                          <span className="role-meta">
                            {j.company} · {j.location}
                            {relativePosted(j.postedAt) ? ` · ${relativePosted(j.postedAt)}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="skill-chips">
                        {j.chips.map(([c, m], k) => (
                          <span key={`${c}-${k}`} className={`chip ${m ? "match" : ""}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="salary">{j.salary}</div>
                      <div className="role-meta" style={{ marginTop: 4 }}>
                        {j.type}
                      </div>
                    </td>
                    <td className="right">
                      <span className={`match-pill ${matchClass}`}>
                        <span className="dot" />
                        {j.match}%
                      </span>
                    </td>
                    <td className="right">
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apply-arrow"
                        aria-label={`Apply to ${j.role} at ${j.company}`}
                      >
                        <ArrowUpRight size={14} strokeWidth={1.75} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="jobs-foot">
            <span>
              Showing {filteredJobs.length} of {allJobs.length} indexed roles
            </span>
            <Link to="/">← Back to review</Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
