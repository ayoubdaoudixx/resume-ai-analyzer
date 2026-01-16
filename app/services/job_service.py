from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import requests

app = FastAPI()

# Enable CORS so your React app can talk to this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer('all-MiniLM-L6-v2')

class JobRequest(BaseModel):
    role: str
    skills: list
    seniority: str = "Mid-level"

RAPID_API_KEY = "8d83016504msh3ec39e13cb1b9f9p18e9d1jsn183acbba42fc"

@app.post("/get-jobs")
async def get_jobs(req: JobRequest):
    # 1. Search via JSearch
    url = "https://jsearch.p.rapidapi.com/search"
    query = f"{req.role} {req.seniority} in USA" # You can add location here
    
    headers = {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params={"query": query, "num_pages": "1"})
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Job search failed")

    raw_jobs = response.json().get('data', [])
    
    # 2. Embedding & Similarity
    # Create a string representation of what the user wants
    user_profile_str = f"{req.role} {' '.join(req.skills)}"
    user_vec = model.encode([user_profile_str])
    
    scored_jobs = []
    for job in raw_jobs:
        job_content = f"{job.get('job_title')} {job.get('job_description')}"
        job_vec = model.encode([job_content])
        
        # Calculate how well the job matches the resume data
        score = cosine_similarity(user_vec, job_vec)[0][0]
        
        scored_jobs.append({
            "role": job.get("job_title"),
            "company": job.get("employer_name"),
            "skills": job.get("job_highlights", {}).get("Qualifications", [])[:3],
            "location": f"{job.get('job_city', 'Remote')}, {job.get('job_country')}",
            "url": job.get("job_apply_link"),
            "score": float(score)
        })

    # Sort by score and return top 4
    scored_jobs.sort(key=lambda x: x['score'], reverse=True)
    return scored_jobs[:4]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)