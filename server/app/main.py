import spacy
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from pdfminer.high_level import extract_text
from sentence_transformers import SentenceTransformer, util


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

nlp = spacy.load("en_core_web_sm")
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

job_roles = [
    {"title": "Data Scientist", "description": "Analyze data, build ML models, Python, statistics"},
    {"title": "Frontend Developer", "description": "Build UIs using React, JavaScript, CSS"},
    {"title": "Backend Developer", "description": "Create APIs with Node.js or Flask, database design"},
    {"title": "NLP Engineer", "description": "Work with transformers, NER, and text data"},
    {"title": "DevOps Engineer", "description": "CI/CD pipelines, Docker, Kubernetes, cloud infrastructure"},
    {"title": "AI Research Intern", "description": "Experiment with deep learning, BERT, transformers, LLMs"}
]

@app.route("/upload", methods=["POST"])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        text = extract_text(filepath)
    except Exception as e:
        return jsonify({"error": "Failed to extract text from PDF", "details": str(e)}), 500

    doc = nlp(text)
    names = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
    skills_keywords = ["Python", "JavaScript", "Machine Learning", "React", "Flask", "NLP", "SQL","HTML","CSS","Node.JS","Git","C++"]
    skills_found = [skill for skill in skills_keywords if skill.lower() in text.lower()]

    return jsonify({
        "message": "File uploaded and text extracted successfully",
        "text": text,
        "parsed": {
            "names": list(set(names)),
            "skills": skills_found
        }
    })

@app.route("/suggest_roles", methods=["POST"])
def suggest_roles():
    data = request.get_json()
    resume_text = data.get("resume_text", "")
    if not resume_text:
        return jsonify({"error": "Missing resume_text"}), 400

    resume_embedding = sbert_model.encode(resume_text, convert_to_tensor=True)
    role_scores = []

    for role in job_roles:
        role_embedding = sbert_model.encode(role['description'], convert_to_tensor=True)
        similarity = util.cos_sim(resume_embedding, role_embedding).item()
        role_scores.append({
            "title": role['title'],
            "description": role['description'],
            "score": round(similarity * 100, 2)  # percentage
        })

    role_scores.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(role_scores[:5])  # top 5 roles

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port)
