import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from "react-dropzone";
import { ArrowRight, Check, Upload as UploadIcon, X } from "lucide-react";

import { Shell } from "~/components/resumer/Shell";
import { usePuterStore } from "~/lib/puter";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID, formatSize } from "~/lib/utils";
import { recommendJobs } from "~/lib/jobMatcher";
import { prepareInstructions } from "../../constants";

export const meta = () => [
  { title: "Resumer — Submit" },
  {
    name: "description",
    content: "Upload your résumé and target role for ATS-grade feedback.",
  },
];

const SIGNALS: Array<[label: string, sub: string, on: boolean]> = [
  ["Keyword density", "Match against role-specific terms", true],
  ["Section structure", "ATS-readable headers", true],
  ["Impact verbs", "Strong, varied action language", true],
  ["Quantification", "Numbers, %, scale of work", false],
  ["Tense + voice", "Consistent, active throughout", true],
  ["Length + density", "Right size for your tier", false],
];

const DEFAULT_JD = `Programming: Python, JavaScript, TypeScript, REST API, Flask, Node.js
ML/DL: Scikit-Learn, TensorFlow, Pandas, NumPy, OpenCV, PyTorch, Keras
GenAI · NLP: LangChain, LlamaIndex, Hugging Face, BERT, LLM, RAG, FAISS, Qdrant
MLOps: AWS, Azure, MLFlow, Kubeflow, Docker, Kubernetes, Git, CI/CD
Data: SQL, NoSQL, PostgreSQL, MongoDB, Spark, Hadoop, ETL, Apache Airflow`;

const FEEDBACK_TIMEOUT_MS = 180_000; // 3 min

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms
    );
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

function parseFeedbackJson(raw: string): any {
  // Strip markdown code fences if present, then extract first {...} block.
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse model output as JSON.");
  }
}

export default function UploadPage() {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate("/auth?next=/upload");
  }, [isLoading, auth.isAuthenticated]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isProcessing) {
      startedRef.current = null;
      setElapsed(0);
      return;
    }
    startedRef.current = Date.now();
    const id = window.setInterval(() => {
      if (startedRef.current)
        setElapsed(Math.floor((Date.now() - startedRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isProcessing]);

  const onDrop = useCallback((accepted: File[]) => {
    setFile(accepted[0] || null);
    setErrorText("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 20 * 1024 * 1024,
    noClick: false,
  });

  const handleAnalyze = async (params: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    const { companyName, jobTitle, jobDescription, file } = params;
    setIsProcessing(true);
    setErrorText("");
    setStatusText("Uploading résumé…");

    const uploadFile = await fs.upload([file]);
    if (!uploadFile) {
      setErrorText("Failed to upload file.");
      setIsProcessing(false);
      return;
    }

    setStatusText("Converting to image…");
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file) {
      setErrorText("Failed to convert PDF to image.");
      setIsProcessing(false);
      return;
    }

    setStatusText("Uploading image…");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) {
      setErrorText("Failed to upload image.");
      setIsProcessing(false);
      return;
    }

    setStatusText("Preparing data…");
    const uuid = generateUUID();
    const data: any = {
      id: uuid,
      resumePath: uploadFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
      recommendedJobs: [],
      createdAt: Date.now(),
    };

    setStatusText("Analyzing résumé content…");
    let feedback;
    try {
      // Send the converted PNG (not the PDF) — Claude reads images natively
      // and Puter's server-side PDF handling is the slow/flaky path.
      feedback = await withTimeout(
        ai.feedback(
          uploadedImage.path,
          prepareInstructions({ jobTitle, jobDescription })
        ),
        FEEDBACK_TIMEOUT_MS,
        "Resume analysis"
      );
    } catch (err: any) {
      console.error("ai.feedback failed:", err);
      setErrorText(
        err?.message?.includes("timed out")
          ? "Analysis took too long. The model is overloaded — try again in a minute."
          : `Analysis failed: ${err?.message || "unknown error"}`
      );
      setIsProcessing(false);
      return;
    }
    if (!feedback) {
      setErrorText("The model returned no response. Try again.");
      setIsProcessing(false);
      return;
    }

    const rawContent = (feedback as any).message?.content;
    const feedbackText =
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent) && rawContent[0]?.text
        ? rawContent[0].text
        : "";

    if (!feedbackText) {
      console.error("Empty feedback content:", feedback);
      setErrorText("The model returned an empty response. Try again.");
      setIsProcessing(false);
      return;
    }

    try {
      data.feedback = parseFeedbackJson(feedbackText);
    } catch (err: any) {
      console.error("Failed to parse feedback JSON:", err, feedbackText);
      setErrorText(
        "Couldn't parse the model's response. Open the console for details, then re-run."
      );
      setIsProcessing(false);
      return;
    }

    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analysis complete. Redirecting…");
    navigate(`/resume/${uuid}`);

    // Background job recommendations
    (async () => {
      let role = jobTitle?.trim() || "";
      let skills: string[] = [];
      let resumeText = `${role} ${jobDescription || ""}`.trim();

      try {
        const extractionPrompt =
          `Extract the candidate's professional title and skills from this resume. ` +
          `Return ONLY valid JSON: {"title": "string", "skills": ["skill1", "skill2"]}`;
        const extractionResponse = await ai.chat(extractionPrompt, uploadFile.path);
        const content = (extractionResponse as any)?.message?.content;
        const extractionText =
          typeof content === "string"
            ? content
            : Array.isArray(content) && content[0]?.text
            ? content[0].text
            : "";
        if (extractionText) {
          const match = extractionText.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.title) role = parsed.title;
            if (Array.isArray(parsed.skills)) {
              skills = parsed.skills
                .flatMap((s: any) =>
                  typeof s === "string" ? [s] : Array.isArray(s?.items) ? s.items : []
                )
                .filter(Boolean);
            }
          }
        }
      } catch (err) {
        console.warn("AI extraction failed, falling back to form fields:", err);
      }

      try {
        if (imageFile.file) {
          const ocrText = (await ai.img2txt(imageFile.file)) || "";
          if (ocrText) resumeText = ocrText;
        }
      } catch (err) {
        console.warn("Resume OCR failed:", err);
      }

      const searchQuery = [role, ...skills].filter(Boolean).join(" ").trim() || role;
      if (!searchQuery) return;
      if (!resumeText) resumeText = searchQuery;

      try {
        const recommendedJobs = await recommendJobs(searchQuery, resumeText);
        data.recommendedJobs = recommendedJobs;
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
      } catch (err) {
        console.error("recommendJobs threw:", err);
      }
    })();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;
    if (!file) {
      setErrorText("Drop a résumé file before running analysis.");
      return;
    }
    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <Shell>
      <form onSubmit={handleSubmit} className="upload-page">
        <div className="upload-main">
          <span className="eyebrow">No. 002 / Submission</span>
          <h1 className="upload-h1">
            Smart feedback,<br />
            for the job <span className="muted">you actually want.</span>
          </h1>
          <p className="upload-lead">
            Tell us where you&apos;re applying. We&apos;ll read the listing the
            way the recruiter does — then read your résumé the way the ATS
            does — and meet you in the middle.
          </p>

          <div className="form-group">
            <label htmlFor="company-name">Company</label>
            <input
              id="company-name"
              name="company-name"
              className="form-input"
              placeholder="Anthropic"
              defaultValue="Anthropic"
              autoComplete="organization"
            />
          </div>

          <div className="form-group">
            <label htmlFor="job-title">Role / Title</label>
            <input
              id="job-title"
              name="job-title"
              className="form-input"
              placeholder="ML Engineer"
              defaultValue="ML Engineer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="job-description">Job description</label>
            <textarea
              id="job-description"
              name="job-description"
              className="form-input"
              defaultValue={DEFAULT_JD}
            />
          </div>

          <div className="form-group">
            <label>Resume file</label>
            <div
              {...getRootProps({
                className: `dropzone-lg ${isDragActive ? "is-active" : ""}`,
                onClick: undefined,
              })}
            >
              <input {...getInputProps()} />
              <div className="file-icon">PDF</div>
              <div className="copy">
                <div className="ttl">
                  {file ? file.name : "Drop your resume here"}
                </div>
                <div className="sub">
                  {file
                    ? `${formatSize(file.size)} · click to replace`
                    : "Or click to browse — PDF, DOCX, max 20 MB"}
                </div>
              </div>
              {file ? (
                <button
                  type="button"
                  className="browse"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  aria-label="Remove file"
                >
                  <X size={13} strokeWidth={1.75} /> Remove
                </button>
              ) : (
                <span className="browse">
                  <UploadIcon size={13} strokeWidth={1.75} /> Browse
                </span>
              )}
            </div>
          </div>

          {errorText && <div role="alert" className="error-banner">{errorText}</div>}

          {isProcessing && (
            <div className="status-banner">
              <span>{statusText || "Working…"}</span>
              <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>
                {elapsed}s
              </span>
            </div>
          )}

          <div className="submit-row">
            <button className="btn-primary lg" type="submit" disabled={isProcessing}>
              {isProcessing ? "Running…" : "Run analysis"}
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => navigate("/")}
            >
              ← Back
            </button>
          </div>
        </div>

        <aside className="upload-side">
          <span className="eyebrow" style={{ marginBottom: 18 }}>
            What we look for
          </span>

          <div className="side-card">
            <h4>14 review signals</h4>
            <p className="sub">Each one graded 0–100 against your target role.</p>
            <div className="checklist">
              {SIGNALS.map(([t, s, on], i) => (
                <div className="item" key={i}>
                  <div className={`check ${on ? "" : "empty"}`}>
                    {on && <Check size={11} strokeWidth={2.5} />}
                  </div>
                  <div className="txt">
                    {t}
                    <small>{s}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="side-stat-grid">
            <div className="cell">
              <div className="num">98<small>%</small></div>
              <div className="lbl">Parser accuracy</div>
            </div>
            <div className="cell">
              <div className="num">8<small>s</small></div>
              <div className="lbl">Median runtime</div>
            </div>
            <div className="cell">
              <div className="num">38</div>
              <div className="lbl">Industry models</div>
            </div>
            <div className="cell">
              <div className="num">+27<small>%</small></div>
              <div className="lbl">Callback lift</div>
            </div>
          </div>

          <p className="side-foot">
            Your file is processed in-memory and never used to train models.
            Encrypted in transit (TLS 1.3) and at rest (AES-256). SOC 2 Type II.
          </p>
        </aside>
      </form>
    </Shell>
  );
}
