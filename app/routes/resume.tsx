import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowRight, Check, Download, Info, Share2 } from "lucide-react";

import { Shell } from "~/components/resumer/Shell";
import { ScoreRing } from "~/components/resumer/ScoreRing";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumer — The verdict" },
  { name: "description", content: "Detailed review of your résumé." },
];

type FeedbackTip = {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
};

type Verdict = "strong" | "mid" | "weak";
function verdictFor(score: number): Verdict {
  if (score >= 80) return "strong";
  if (score >= 60) return "mid";
  return "weak";
}

const formatTimestamp = (ts?: number) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

function shortRunId(id: string): string {
  if (!id) return "—";
  const head = id.slice(0, 3).toUpperCase();
  const tail = id.slice(-4).toUpperCase();
  return `#${head}-${tail}`;
}

type Finding = {
  type: "good" | "warn" | "crit";
  title: string;
  desc: string;
  tag: string;
};

function deriveFindings(feedback: Feedback): Finding[] {
  const findings: Finding[] = [];

  const sections: Array<[string, { score: number; tips: FeedbackTip[] }]> = [
    ["Tone & Style", feedback.toneAndStyle],
    ["Content", feedback.content],
    ["Structure", feedback.structure],
    ["Skills", feedback.skills],
  ];

  const goods: Array<[string, FeedbackTip]> = [];
  const improves: Array<[string, FeedbackTip, number]> = [];

  for (const [name, sec] of sections) {
    if (!sec) continue;
    for (const tip of sec.tips || []) {
      if (tip.type === "good") goods.push([name, tip]);
      else improves.push([name, tip, sec.score]);
    }
  }

  if (goods.length > 0) {
    const [section, tip] = goods[0];
    findings.push({
      type: "good",
      title: tip.tip,
      desc: tip.explanation || `Strength in ${section.toLowerCase()}.`,
      tag: "Already strong",
    });
  }

  improves.sort((a, b) => a[2] - b[2]);
  for (const [section, tip, score] of improves.slice(0, 4)) {
    const lift = Math.max(2, Math.round((100 - score) * 0.12));
    const isCritical = score < 65;
    findings.push({
      type: isCritical ? "crit" : "warn",
      title: tip.tip,
      desc: tip.explanation || `Opportunity in ${section.toLowerCase()}.`,
      tag: `+${lift} pts est.`,
    });
  }

  return findings;
}

function Glyph({ type }: { type: "good" | "warn" | "crit" }) {
  if (type === "good") return <Check size={14} strokeWidth={2.5} />;
  if (type === "warn") return <AlertCircle size={14} strokeWidth={1.75} />;
  return <Info size={14} strokeWidth={1.75} />;
}

export default function ReviewPage() {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [meta, setMeta] = useState<{
    company?: string;
    role?: string;
    createdAt?: number;
  }>({});

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated)
      navigate(`/auth?next=/resume/${id}`);
  }, [isLoading, auth.isAuthenticated, id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const stored = await kv.get(`resume:${id}`);
      if (!stored || cancelled) return;
      const data = JSON.parse(stored);

      setFeedback(data.feedback || null);
      setMeta({
        company: data.companyName,
        role: data.jobTitle,
        createdAt: data.createdAt,
      });

      try {
        const resumeBlob = await fs.read(data.resumePath);
        if (resumeBlob) {
          const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
          const url = URL.createObjectURL(pdfBlob);
          if (!cancelled) setResumeUrl(url);
        }
      } catch (err) {
        console.warn("resume PDF read failed", err);
      }

      try {
        const imageBlob = await fs.read(data.imagePath);
        if (imageBlob) {
          const url = URL.createObjectURL(imageBlob);
          if (!cancelled) setImageUrl(url);
        }
      } catch (err) {
        console.warn("resume image read failed", err);
      }
    }
    if (!isLoading && auth.isAuthenticated) load();
    return () => {
      cancelled = true;
    };
  }, [isLoading, auth.isAuthenticated, id]);

  const breakdown = useMemo(() => {
    if (!feedback) return [] as Array<[string, number, Verdict]>;
    return [
      ["Tone & Style", feedback.toneAndStyle?.score ?? 0, verdictFor(feedback.toneAndStyle?.score ?? 0)],
      ["Content",     feedback.content?.score ?? 0,     verdictFor(feedback.content?.score ?? 0)],
      ["Structure",   feedback.structure?.score ?? 0,   verdictFor(feedback.structure?.score ?? 0)],
      ["Skills",      feedback.skills?.score ?? 0,      verdictFor(feedback.skills?.score ?? 0)],
    ] as Array<[string, number, Verdict]>;
  }, [feedback]);

  const findings = useMemo(
    () => (feedback ? deriveFindings(feedback) : []),
    [feedback]
  );

  const overallScore = feedback?.overallScore ?? feedback?.ATS?.score ?? 0;
  const verdictLabel = verdictFor(overallScore);

  return (
    <Shell>
      <div className="review-page">
        <section className="review-main">
          <div className="review-headline">
            <h1>
              The verdict, <span className="muted">in detail.</span>
            </h1>
            <div className="review-meta">
              <div className="row">Run id <span>{shortRunId(id || "")}</span></div>
              <div className="row">Target <span>{meta.role || "Role"} · {meta.company || "Company"}</span></div>
              <div className="row">Indexed <span>{formatTimestamp(meta.createdAt)}</span></div>
            </div>
          </div>

          {feedback ? (
            <>
              <div className="score-hero">
                <ScoreRing value={overallScore} />
                <div className="score-context">
                  <h3>
                    {verdictLabel === "strong" ? (
                      <>You&apos;re strong — <span className="muted">here&apos;s where it stops short.</span></>
                    ) : verdictLabel === "mid" ? (
                      <>Solid — <span className="muted">three meaningful edits to make.</span></>
                    ) : (
                      <>There&apos;s real work to do — <span className="muted">but it&apos;s all fixable.</span></>
                    )}
                  </h3>
                  <p>
                    {verdictLabel === "strong"
                      ? "This resume will pass most major ATS systems. The edits below will likely move it from \"review pile\" to \"first call\". We've ranked them by lift."
                      : verdictLabel === "mid"
                      ? "You're in the conversation. The edits below close the gap on what recruiters and ATS systems are scanning for, ranked by lift."
                      : "Treat this run as a roadmap. Each finding tells you exactly what to change and what it's worth."}
                  </p>
                </div>
              </div>

              <span className="eyebrow" style={{ marginBottom: 18 }}>Sub-scores</span>
              <div className="breakdown-card">
                {breakdown.map(([name, pct, verdict]) => (
                  <div className="bd-row" key={name}>
                    <div className="name">{name}</div>
                    <div className="bar-wrap">
                      <div className="bar" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="pct">
                      {pct}<span className="small">/100</span>
                    </div>
                    <div className={`verdict ${verdict}`}>{verdict}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 56 }}>
                <span className="eyebrow" style={{ marginBottom: 18 }}>
                  Findings · ranked by lift
                </span>
                <div className="findings">
                  {findings.length === 0 ? (
                    <p style={{ color: "var(--ink-4)" }}>
                      No findings yet — your analysis is still in flight.
                    </p>
                  ) : (
                    findings.map((f, i) => (
                      <div className="finding" key={i}>
                        <div className={`glyph ${f.type}`}>
                          <Glyph type={f.type} />
                        </div>
                        <div className="body">
                          <h4>{f.title}</h4>
                          <p>{f.desc}</p>
                        </div>
                        <div className="tag">{f.tag}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
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
              Loading analysis…
            </div>
          )}
        </section>

        <aside className="review-side">
          <span className="eyebrow" style={{ marginBottom: 16 }}>
            Source document
          </span>

          {imageUrl ? (
            <a
              href={resumeUrl || imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="resume-preview-image"
              aria-label="Open résumé"
            >
              <img src={imageUrl} alt="Résumé preview" />
            </a>
          ) : (
            <div
              className="resume-preview"
              style={{
                display: "grid",
                placeItems: "center",
                color: "var(--ink-4)",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                minHeight: 380,
              }}
            >
              Loading source…
            </div>
          )}

          <div className="preview-actions">
            <a
              className="primary"
              href={resumeUrl}
              download
              aria-disabled={!resumeUrl}
              onClick={(e) => {
                if (!resumeUrl) e.preventDefault();
              }}
            >
              <Download size={11} strokeWidth={1.75} /> Export annotated
            </a>
            <button
              type="button"
              onClick={() => {
                if (navigator.share && resumeUrl) {
                  navigator
                    .share({ title: "My résumé", url: resumeUrl })
                    .catch(() => {});
                }
              }}
            >
              <Share2 size={11} strokeWidth={1.75} /> Share
            </button>
            <button type="button" onClick={() => navigate("/upload")}>
              Re-run
            </button>
          </div>

          <div className="editors-note">
            <span className="label">Editor&apos;s note</span>
            <p>
              {verdictLabel === "strong" ? (
                <>The technical foundation is here. The story <em>around</em> it isn&apos;t — yet. <span className="hi">Numbers turn duties into wins.</span></>
              ) : verdictLabel === "mid" ? (
                <>You&apos;ve got the right material. <span className="hi">Sharpen the language so it lands the way the work did.</span></>
              ) : (
                <>Treat this run as a draft. <span className="hi">Cut, quantify, re-aim — and the score will follow.</span></>
              )}
            </p>
          </div>

          <div style={{ marginTop: 20 }}>
            <Link
              to="/jobs"
              className="btn-primary lg"
              style={{ width: "100%", justifyContent: "center" }}
            >
              See matching jobs <ArrowRight size={15} strokeWidth={1.75} />
            </Link>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
