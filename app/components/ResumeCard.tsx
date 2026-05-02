import {Link} from "react-router";
import ScoreCircle from "./ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({resume: {id, companyName, jobTitle, feedback, imagePath}, compact = false} : { resume: Resume; compact?: boolean }) => {
    
    const {fs} = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState(''); 


    useEffect(() => {
            const loadResume = async () => {
                const blob = await fs.read(imagePath);
                if(!blob) return;
                let url = URL.createObjectURL(blob);
                setResumeUrl(url);
    
            } 
            loadResume();
        }, [imagePath]);
    
    return (
        <Link to={`/resume/${id}`} className={`resume-card animate-in fade-in duration-1000 ${compact ? 'p-3' : ''}`}>
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore}/>
                </div>
            </div>
            {resumeUrl && (
                <div className={`gradient-border animate-in fade-in duration-1000 ${compact ? 'p-3' : 'p-4'}`}>
                    <div className="w-full h-full">
                        <img src={resumeUrl}
                            alt="resume"
                            className="w-full aspect-[1/1.414] max-h-[450px] max-sm:max-h-[300px] object-contain"
                        />
                    </div>

                </div>
            )}
        </Link>
    )
}
export default ResumeCard