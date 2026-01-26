import argparse
import json
import os
import re
import sys
from pathlib import Path

import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def load_dotenv() -> None:
    current_path = Path(__file__).resolve().parent
    for parent in [current_path, *current_path.parents]:
        env_path = parent / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip("\"").strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
            break


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_jobs(search_query: str, api_key: str) -> list[dict]:
    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }
    params = {
        "query": search_query,
        "page": "1",
        "num_pages": "1",
        "country": "morocco",
        "date_posted": "all"
    }
    response = requests.get(url, headers=headers, params=params, timeout=30)
    response.raise_for_status()
    return response.json().get("data", []) or []


def score_jobs(resume_text: str, jobs: list[dict]) -> list[dict]:
    cleaned_resume = clean_text(resume_text)
    if not cleaned_resume or not jobs:
        return []

    scored_jobs: list[dict] = []
    valid_jobs: list[dict] = []
    valid_texts: list[str] = []

    for job in jobs:
        job_title = job.get("job_title") or ""
        job_description = job.get("job_description") or ""
        job_text = clean_text(f"{job_title} {job_description}")
        qualifications = job.get("job_highlights", {}).get("Qualifications") or []
        job_city = job.get("job_city") or ""
        job_country = job.get("job_country") or ""
        location_parts = [part for part in [job_city, job_country] if part]
        location = ", ".join(location_parts) if location_parts else job.get("job_location") or "Remote"

        job_payload = {
            "job_title": job_title,
            "job_id": job.get("job_id") or "",
            "company": job.get("employer_name") or "",
            "location": location,
            "url": job.get("job_apply_link") or "",
            "skills": qualifications[:3] if isinstance(qualifications, list) else [],
        }

        if job_text:
            valid_jobs.append(job_payload)
            valid_texts.append(job_text)
        else:
            scored_jobs.append({**job_payload, "match_score": 0.0})

    if valid_texts:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([cleaned_resume, *valid_texts])
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        for job_payload, score in zip(valid_jobs, similarities):
            scored_jobs.append(
                {**job_payload, "match_score": float(round(score, 4))}
            )

    scored_jobs.sort(key=lambda item: item["match_score"], reverse=True)
    return scored_jobs[:5]


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch and score jobs based on resume text.")
    parser.add_argument("search_query", type=str, help="Query used to search jobs")
    parser.add_argument("resume_text", type=str, help="Resume content to compare")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key:
        raise RuntimeError("RAPIDAPI_KEY is not set in the environment")

    try:
        jobs = fetch_jobs(args.search_query, api_key)
        results = score_jobs(args.resume_text, jobs)
        print(json.dumps(results))
    except Exception as exc:
        sys.stderr.write(f"Error: {exc}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
