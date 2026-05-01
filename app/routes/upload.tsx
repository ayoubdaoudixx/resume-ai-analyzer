import { useState, type FormEvent } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { recommendJobs } from "~/lib/jobMatcher";
import { prepareInstructions } from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        setIsProcessing(true);
        setStatusText('Your resume is being uploaded ...');
        const uploadFile = await fs.upload([file]);

        if (!uploadFile) return setStatusText('ERROR: Failed to upload file!!');

        setStatusText('Converting to image ...');
        const imageFile = await convertPdfToImage(file);
        if (!imageFile.file) return setStatusText('ERROR: Failed to convert pdf to image !!');

        setStatusText('Uploading the Image ...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if (!uploadedImage) return setStatusText('ERROR: Failed to upload Image !!');


        setStatusText('Preparing Data ...');

        const uuid = generateUUID();
        const data: any = {
            id: uuid,
            resumePath: uploadFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
            recommendedJobs: []
        }

        setStatusText('Analyzing Resume Content...');

        const feedback = await ai.feedback(
            uploadFile.path,
            prepareInstructions({ jobTitle, jobDescription })
        )
        
        if (!feedback) return setStatusText('ERROR: Failed to analyze resume !!');

        const feedbackText = typeof feedback.message.content == 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText);

        // --- STEP 1: SAVE INITIAL DATA AND REDIRECT ---
        // We save the main feedback and send the user to the results page immediately.
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis Complete! Redirecting...');
        navigate(`/resume/${uuid}`);

        // --- STEP 2: BACKGROUND PROCESSING FOR JOBS ---
        // Runs without 'await' so the navigate() above isn't delayed.
        (async () => {
            // Guaranteed baseline from user-provided form fields.
            let role = jobTitle?.trim() || "";
            let skills: string[] = [];
            let resumeText = `${role} ${jobDescription || ""}`.trim();

            // Try to enrich with AI-extracted title/skills. Any failure here is non-fatal —
            // the baseline above is enough to call JSearch.
            try {
                const extractionPrompt =
                    `Extract the candidate's professional title and skills from this resume. ` +
                    `Return ONLY valid JSON: {"title": "string", "skills": ["skill1", "skill2"]}`;
                const extractionResponse = await ai.chat(extractionPrompt, uploadFile.path);
                const content = extractionResponse?.message?.content;
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

            // Try to OCR the resume image for richer matching text. Non-fatal on failure.
            try {
                if (imageFile.file) {
                    const ocrText = (await ai.img2txt(imageFile.file)) || "";
                    if (ocrText) resumeText = ocrText;
                }
            } catch (err) {
                console.warn("Resume OCR failed, falling back to form fields:", err);
            }

            const searchQuery = [role, ...skills].filter(Boolean).join(" ").trim() || role;
            if (!searchQuery) {
                console.error("No searchable info — please fill the Job Title field on upload");
                return;
            }
            if (!resumeText) {
                resumeText = searchQuery;
            }

            console.log("Fetching jobs for:", searchQuery);
            try {
                const recommendedJobs = await recommendJobs(searchQuery, resumeText);
                data.recommendedJobs = recommendedJobs;
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
                console.log(`Background jobs updated: ${recommendedJobs.length} matches`);
            } catch (err) {
                console.error("recommendJobs threw:", err);
            }
        })();
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest("form");
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        const jobDescription = formData.get("job-description") as string;

        if (!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-4">
                    <h1> Smart Feedback For Your Dream Job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-[400px]" />
                        </>
                    ) : (
                        <h2 className="text-center">Drop Your Resume for an ATS score and powerful tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Type The Company Name" id="company-name" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Type The Job Title" id="job-title" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Paste The Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload;