from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def match_roles(resume_text, job_list):
    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    job_scores = []
    for job in job_list:
        job_embedding = model.encode(job['description'], convert_to_tensor=True)
        score = util.pytorch_cos_sim(resume_embedding, job_embedding).item()
        job_scores.append({**job, "score": round(score * 100, 2)})
    return sorted(job_scores, key=lambda x: x["score"], reverse=True)
