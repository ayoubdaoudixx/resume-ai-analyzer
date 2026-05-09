import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import type { Route } from "./+types/home";
import { Shell } from "~/components/resumer/Shell";
import { SectionHead } from "~/components/resumer/SectionHead";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumer - Make It Read" },
    {
      name: "description",
      content:
        "Resume intelligence — score against the ATS, get plain-English fixes, and find roles that match.",
    },
  ];
}

const STEPS: Array<[string, string, string, string]> = [
  ["01", "Drop", "Upload your resume as PDF or DOCX. Any standard format up to 20 MB.", "00.1s"],
  ["02", "Parse", "We read structure, keywords, formatting, and prose with the same eye an ATS does.", "01.2s"],
  ["03", "Score", "A single ATS compatibility score, plus four sub-scores graded 0–100.", "02.5s"],
  ["04", "Edit", "We pinpoint missing keywords, weak verbs, soft impact statements.", "03.8s"],
  ["05", "Match", "Curated job recommendations ranked by alignment with your profile.", "06.4s"],
];

const THUMB_LINES = ["h", "l", "m", "s", "l", "m", "l", "s", "m", "l", "h", "l"];

type RealResume = Resume & { createdAt?: number };

function relativeTime(timestamp?: number): string {
  if (!timestamp) return "Recently";
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} mo. ago`;
}

function HeroCard() {
  const navigate = useNavigate();
  return (
    <div className="hero-card">
      <div className="hero-card-bar">
        <div className="dots">
          <span /><span /><span />
        </div>
        <span className="pulse">Engine online</span>
      </div>
      <div className="hero-card-body">
        <div
          className="hero-card-row dropzone"
          onClick={() => navigate("/upload")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/upload");
          }}
        >
          <div className="file-icon">PDF</div>
          <div>
            <div className="ttl">Drop your resume here</div>
            <div className="sub">PDF or DOCX · up to 20 MB</div>
          </div>
        </div>
        <div className="hero-card-fields">
          <div className="hc-field">
            <label>Target role</label>
            <input defaultValue="ML Engineer" />
          </div>
          <div className="hc-field">
            <label>Company</label>
            <input defaultValue="Anthropic" />
          </div>
        </div>
      </div>
      <div className="hero-card-foot">
        <span className="meta">
          Median runtime · <strong>8 seconds</strong>
        </span>
        <button className="btn-primary" onClick={() => navigate("/upload")} type="button">
          Run analysis <ArrowRight size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-grid">
        <div>
          <span className="hero-pill">
            <span className="badge">New</span>
            Now scoring against 38 industry models
          </span>
          <h1 className="hero-title">
            Your resume,<br />
            <span className="muted">read closely.</span>
          </h1>
          <p className="hero-lead">
            A patient second pair of eyes for the document that opens every
            door. We score it the way an ATS does, then tell you — in plain
            English — exactly what to fix.
          </p>
          <div className="hero-actions">
            <button className="btn-primary lg" type="button" onClick={() => navigate("/upload")}>
              Analyze your resume
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
            <button className="btn-ghost" type="button" onClick={() => navigate("/upload")}>
              See sample report →
            </button>
          </div>
          <div className="hero-trust">
            <span><strong>184k+</strong> resumes scored</span>
            <span className="sep" />
            <span><strong>+27%</strong> avg. callback lift</span>
            <span className="sep" />
            <span><strong>8s</strong> median runtime</span>
          </div>
        </div>
        <HeroCard />
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="section alt">
      <div className="section-inner">
        <SectionHead
          numeral="II"
          eyebrow="— No. 002 / Method"
          title={
            <>
              From upload to offer letter,{" "}
              <span className="muted">in five reads.</span>
            </>
          }
          sub="Five deliberate steps that turn your resume into your strongest career asset. No chat-bot rambling. Just signal."
        />
        <div className="steps">
          {STEPS.map(([n, t, d, time]) => (
            <div className="step" key={n}>
              <div className="num-row">
                <span className="num">{n}</span>
                <span className="check">
                  <Check size={11} strokeWidth={2.5} />
                </span>
              </div>
              <h3>{t}</h3>
              <p>{d}</p>
              <div className="step-tag">
                <span className="dot" />~{time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResumeCard({ resume }: { resume: RealResume }) {
  const { fs } = usePuterStore();
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let createdUrl = "";

    async function load() {
      if (!resume.imagePath) return;
      try {
        const blob = await fs.read(resume.imagePath);
        if (!blob || cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setImageUrl(createdUrl);
      } catch (err) {
        console.warn("ResumeCard: failed to read image", resume.imagePath, err);
      }
    }
    load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fs, resume.imagePath]);

  const score = Math.round(
    resume.feedback?.overallScore ?? resume.feedback?.ATS?.score ?? 0
  );
  const accent = score > 75 ? "hi" : score < 60 ? "lo" : "";
  const status = score >= 90 ? "TOP MATCH" : undefined;
  const when = relativeTime(resume.createdAt);

  return (
    <Link to={`/resume/${resume.id}`} className="resume-card">
      <div className="resume-card-head">
        <div>
          <div className="co">{resume.companyName || "Untitled"}</div>
          <div className="role">{resume.jobTitle || "Role"}</div>
        </div>
        <div className={`resume-score ${accent}`}>{score}</div>
      </div>
      <div className="resume-card-body">
        <div className={`resume-thumb ${imageUrl ? "has-img" : ""}`}>
          {status && <span className="stamp">{status}</span>}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${resume.companyName || "Resume"} preview`}
              className="resume-thumb-img"
              loading="lazy"
            />
          ) : (
            <>
              <div className="ln h" />
              <div className="ln s" />
              <div className="col2">
                <div className="ln" />
                <div className="ln" />
              </div>
              <div style={{ height: 4 }} />
              <div className="ln h" style={{ width: "30%" }} />
              {THUMB_LINES.map((l, i) => (
                <div key={i} className={`ln ${l}`} />
              ))}
            </>
          )}
        </div>
      </div>
      <div className="resume-card-foot">
        <span>{when}</span>
        <span className="arrow">
          Review <ArrowRight size={11} strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

function Resumes({
  resumes,
  loading,
}: {
  resumes: RealResume[];
  loading: boolean;
}) {
  const [tab, setTab] = useState<"recent" | "high" | "all">("recent");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 4;

  const sorted = useMemo(() => {
    if (tab === "high") {
      return [...resumes].sort((a, b) => {
        const sa = a.feedback?.overallScore ?? 0;
        const sb = b.feedback?.overallScore ?? 0;
        return sb - sa;
      });
    }
    // Recent / All — already sorted by createdAt desc
    return resumes;
  }, [resumes, tab]);

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Clamp page if dataset shrinks
  const safePage = Math.min(page, pages - 1);

  // Group into pages of PAGE_SIZE for the slide-track
  const pageGroups = useMemo(() => {
    const out: RealResume[][] = [];
    for (let i = 0; i < sorted.length; i += PAGE_SIZE) {
      out.push(sorted.slice(i, i + PAGE_SIZE));
    }
    return out.length === 0 ? [[]] : out;
  }, [sorted]);

  return (
    <section className="section">
      <div className="section-inner">
        <SectionHead
          numeral="III"
          eyebrow="— No. 003 / Archive"
          title={
            total === 0 && !loading ? (
              <>No resumes <span className="muted">yet.</span></>
            ) : (
              <>Your analyzed <span className="muted">resumes.</span></>
            )
          }
          sub={
            total === 0 && !loading
              ? "Upload your first resume to start tracking ATS scores and feedback across roles."
              : "Every submission is preserved. Re-open feedback, compare scores across roles, or duplicate a winning version."
          }
        />

        {loading ? (
          <div
            style={{
              padding: "60px 0",
              color: "var(--ink-4)",
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            Loading archive…
          </div>
        ) : total === 0 ? (
          <div style={{ padding: "20px 0 0" }}>
            <Link to="/upload" className="btn-primary lg">
              Upload your first resume
              <ArrowRight size={15} strokeWidth={1.75} />
            </Link>
          </div>
        ) : (
          <>
            <div className="resumes-toolbar">
              <div className="toolbar-tabs">
                {([
                  ["recent", "Recent"],
                  ["high", "Highest"],
                  ["all", `All ${total}`],
                ] as const).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    className={tab === k ? "active" : ""}
                    onClick={() => {
                      setTab(k);
                      setPage(0);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="carousel-controls">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  aria-label="Previous"
                >
                  <ArrowLeft size={14} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setPage((p) => Math.min(pages - 1, p + 1))
                  }
                  disabled={safePage >= pages - 1}
                  aria-label="Next"
                >
                  <ArrowRight size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="resumes-track-wrap">
              <div
                className="resumes-track"
                style={{ transform: `translateX(-${safePage * 100}%)` }}
              >
                {pageGroups.map((group, gi) => (
                  <div className="resumes-page" key={gi}>
                    {group.map((r) => (
                      <ResumeCard key={r.id} resume={r} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { auth, kv, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<RealResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated, isLoading]);

  useEffect(() => {
    let cancelled = false;
    async function loadResumes() {
      setLoadingResumes(true);
      try {
        const records = (await kv.list("resume:*", true)) as KVItem[] | null;
        if (cancelled) return;
        const parsed: RealResume[] = (records || [])
          .map((r) => {
            try {
              return JSON.parse(r.value) as RealResume;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as RealResume[];

        // Historical order — newest first
        parsed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        if (!cancelled) setResumes(parsed);
      } catch (err) {
        console.warn("home: failed to load resumes", err);
      } finally {
        if (!cancelled) setLoadingResumes(false);
      }
    }

    if (!isLoading && auth.isAuthenticated) {
      loadResumes();
    } else if (!isLoading && !auth.isAuthenticated) {
      setLoadingResumes(false);
    }

    return () => {
      cancelled = true;
    };
  }, [kv, auth.isAuthenticated, isLoading]);

  return (
    <Shell>
      <Hero />
      <Steps />
      <Resumes resumes={resumes} loading={loadingResumes} />
    </Shell>
  );
}
