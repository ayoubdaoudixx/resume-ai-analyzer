import { useState, type FormEvent } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const JOB_SERVICE = (import.meta as any).env?.VITE_JOB_SERVICE_URL || "http://localhost:8000";
    const JOB_FETCH_TIMEOUT = 60000; // 60s (Apify runs take ~30-40s)
    const JOBS_LIMIT = 30; // Show up to 30 best-fitting offers

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        setIsProcessing(true);
        setStatusText('Your resume is being uploaded ...');

        // Sanitize filename to avoid path issues with AI delegates (remove spaces and special chars)
        const safeUuid = generateUUID().split('-')[0];
        const safeResumeFile = new File([file], `resume-${safeUuid}.pdf`, { type: file.type });

        const uploadResult = await fs.upload([safeResumeFile]);
        const uploadFile = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

        if (!uploadFile) {
            setIsProcessing(false);
            return setStatusText('ERROR: Failed to upload file!!');
        }

        setStatusText('Converting to image ...');
        const imageFile = await convertPdfToImage(file);
        if (!imageFile.file) {
            setIsProcessing(false);
            return setStatusText('ERROR: Failed to convert pdf to image !!');
        }

        setStatusText('Uploading the Image ...');
        const safeImageFile = new File([imageFile.file], `resume-${safeUuid}.png`, { type: 'image/png' });
        const uploadImageResult = await fs.upload([safeImageFile]);
        const uploadedImage = Array.isArray(uploadImageResult) ? uploadImageResult[0] : uploadImageResult;

        if (!uploadedImage) {
            setIsProcessing(false);
            return setStatusText('ERROR: Failed to upload Image !!');
        }


        setStatusText('Preparing Data ...');

        const uuid = generateUUID();
        const data: any = {
            id: uuid,
            resumePath: uploadFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
            recommendedJobs: [],
            jobFetchStatus: null
        }

        setStatusText('Analyzing Resume Content...');

        try {
            console.log("Analyzing with Image Path:", uploadedImage.path);
            const feedback = await ai.feedback(
                uploadedImage.path,
                prepareInstructions({ jobTitle, jobDescription })
            )

            if (!feedback) {
                setIsProcessing(false);
                return setStatusText('ERROR: Failed to analyze resume (No response) !!');
            }

            const feedbackText = typeof feedback.message.content == 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            // Clean JSON response (remove markdown backticks if present)
            const cleanFeedback = feedbackText.replace(/```json|```/g, "").trim();

            try {
                data.feedback = JSON.parse(cleanFeedback);
            } catch (pErr) {
                console.error("JSON Parse Error:", pErr, "Raw Content:", feedbackText);
                setIsProcessing(false);
                return setStatusText('ERROR: AI returned invalid JSON. Please try again.');
            }

            // --- STEP 1: SAVE INITIAL DATA AND REDIRECT ---
            // Save the main feedback and send the user to the results page immediately.
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis Complete! Redirecting...');
            navigate(`/resume/${uuid}`);
        } catch (err) {
            console.error("Analysis failed:", err);
            setIsProcessing(false);
            setStatusText(`ERROR: Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
            return;
        }

        // --- STEP 2: BACKGROUND PROCESSING FOR JOBS ---
        // Run job search in background without blocking the redirect.
        (async () => {
            try {
                // Mark the resume as processing for jobs so the resume page shows spinner
                data.jobFetchStatus = 'processing';
                await kv.set(`resume:${uuid}`, JSON.stringify(data));

                const extractionPrompt = `Please look at this resume and extract:
                1. The candidate's most relevant professional job title.
                2. A list of 5-10 key technical skills.
                
                Return ONLY a valid JSON object where the title is the job title and the skills are the list of skills.`;

                console.log("Extracting skills using image path:", uploadedImage.path);
                const extractionResponse = await ai.chat(extractionPrompt, uploadedImage.path);

                if (extractionResponse && extractionResponse.message) {
                    const extractionText = typeof extractionResponse.message.content === 'string'
                        ? extractionResponse.message.content
                        : extractionResponse.message.content[0].text;

                    console.log("Extracted raw text from AI:", extractionText);

                    const cleanJson = extractionText.replace(/```json|```/g, "").trim();
                    let parsedExtractedData;
                    try {
                        parsedExtractedData = JSON.parse(cleanJson);
                        console.log("Parsed extraction data:", parsedExtractedData);
                    } catch (err) {
                        console.error("Failed to parse extraction JSON:", err);
                        parsedExtractedData = { title: jobTitle, skills: [] };
                    }

                    // Store extracted info in the data object for record keeping
                    data.extractedInfo = parsedExtractedData;
                    await kv.set(`resume:${uuid}`, JSON.stringify(data));

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), JOB_FETCH_TIMEOUT);

                    const payload = {
                        role: parsedExtractedData.title || jobTitle,
                        skills: parsedExtractedData.skills?.flatMap((s: any) => s.items) || [],
                        seniority: "Mid-level",
                        limit: JOBS_LIMIT
                    };

                    console.log("Sending job fetch request with payload:", payload);

                    try {
                        const jobResponse = await fetch(`${JOB_SERVICE}/get-jobs`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (jobResponse.ok) {
                            const recommendedJobs = await jobResponse.json();
                            console.log(`Job service returned ${recommendedJobs.length} jobs`);
                            // Ensure we only store up to JOBS_LIMIT results
                            data.recommendedJobs = Array.isArray(recommendedJobs) ? recommendedJobs.slice(0, JOBS_LIMIT) : [];
                            data.jobFetchStatus = 'done';
                            await kv.set(`resume:${uuid}`, JSON.stringify(data));
                            console.log("Background jobs updated successfully");
                        } else {
                            console.error("Job service returned non-ok:", jobResponse.status);
                            data.recommendedJobs = [];
                            data.jobFetchStatus = 'failed';
                            await kv.set(`resume:${uuid}`, JSON.stringify(data));
                        }
                    } catch (err) {
                        clearTimeout(timeoutId);
                        console.error("Background job fetching failed (network/timeout)", err);
                        data.recommendedJobs = [];
                        data.jobFetchStatus = 'failed';
                        await kv.set(`resume:${uuid}`, JSON.stringify(data));
                    }
                } else {
                    console.error("No extraction response from AI");
                    data.recommendedJobs = [];
                    data.jobFetchStatus = 'failed';
                    await kv.set(`resume:${uuid}`, JSON.stringify(data));
                }
            } catch (error) {
                console.error("Background job fetching failed", error);
                data.recommendedJobs = [];
                data.jobFetchStatus = 'failed';
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
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