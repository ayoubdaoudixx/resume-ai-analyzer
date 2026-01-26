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
        // This is an IIFE (Immediately Invoked Function Expression) that runs without 'awaiting'
        // so the 'navigate' above isn't delayed by the job search.
        (async () => {
            try {
                const extractionPrompt = `Extract the candidate's professional title and a list of skills from this resume. 
                Return ONLY a valid JSON object with this structure: {"title": "string", "skills": [{"items": ["skill1", "skill2"]}]}`;

                const extractionResponse = await ai.chat(extractionPrompt, uploadFile.path);

                if (extractionResponse && extractionResponse.message) {
                    const extractionText = typeof extractionResponse.message.content === 'string'
                        ? extractionResponse.message.content
                        : extractionResponse.message.content[0].text;

                    const cleanJson = extractionText.replace(/```json|```/g, "").trim();
                    const parsedExtractedData = JSON.parse(cleanJson);
                    const role = parsedExtractedData.title || jobTitle;
                    const skills = parsedExtractedData.skills?.flatMap((s: any) => s.items) || [];
                    const searchQuery = [role, ...skills].filter(Boolean).join(" ").trim();

                    let resumeText = "";
                    const resumeImageUrl = imageFile.imageUrl;
                    if (resumeImageUrl) {
                        try {
                            resumeText = (await ai.img2txt(resumeImageUrl)) || "";
                        } catch (err) {
                            console.error("Resume text extraction failed", err);
                        }
                    }

                    if (!resumeText) {
                        resumeText = `${role} ${skills.join(" ")} ${jobDescription || ""}`.trim();
                    }

                    const jobResponse = await fetch("/api/jobs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            searchQuery,
                            resumeText,
                        }),
                    });

                    if (jobResponse.ok) {
                        const recommendedJobs = await jobResponse.json();
                        // Update the KV with the newly found jobs
                        data.recommendedJobs = recommendedJobs;
                        await kv.set(`resume:${uuid}`, JSON.stringify(data));
                        console.log("Background jobs updated successfully");
                    }
                }
            } catch (error) {
                console.error("Background job fetching failed", error);
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