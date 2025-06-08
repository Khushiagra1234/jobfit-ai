import React, { useRef, useState } from "react";
import axios from "axios";
import './UploadResume.css';

import html2pdf from "html2pdf.js";
import SkillRadarChart from "./SkillRadarChart";


type MatchedRole = {
  title: string;
  score: number;
  description: string;
};

const UploadResume = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setMessage] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extractedText, setExtractedText] = useState('');
  const [matchedRoles, setMatchedRoles] = useState<MatchedRole[]>([]);

  const componentRef = useRef<HTMLDivElement>(null);
  const bestScore = matchedRoles.length > 0 
  ? Math.max(...matchedRoles.map(role => role.score)) 
  : 0;


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setSkills([]);
      setError("");
      setExtractedText('');
      setMatchedRoles([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "Upload successful!");
      setExtractedText(res.data.text || "");
      setSkills(res.data.parsed.skills || []);

      const suggestRes = await axios.post("http://127.0.0.1:5000/suggest_roles", {
        resume_text: res.data.text,
      });

      setMatchedRoles(suggestRes.data);

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Upload failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Upload failed");
      }
      setMessage("Upload failed.");
      setExtractedText("");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const element = componentRef.current;
    if (!element) return;

    setTimeout(() => {
      const opt = {
        margin: 0.5,
        filename: "ResumeInsights.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
    }, 300); // wait for rendering
  };

  return (
    <div className="upload-container">
      <h2>Upload Resume (PDF)</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Resume"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>{text}</p>

      {/* Printable section */}
      <div ref={componentRef} className="print-section">
        {extractedText && (
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            background: '#f4f4f4',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '10px',
            border: '1px solid #ccc'
          }}>
            <h3>Extracted Text:</h3>
            <p>{extractedText}</p>
          </div>
        )}

        {skills.length > 0 && (
          <>
            <h3>Detected Skills:</h3>
            <ul>{skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
          </>
        )}

        {matchedRoles.length > 0 && (
          <>
          <h3>Skill Coverage</h3>
    <SkillRadarChart
      userSkills={skills}
      jobSkills={matchedRoles[0].description?.match(/\b(\w+)\b/g) || []} // mock skill extraction from description
    />
            <h3>Matched Roles:</h3>
            <ul>
              {matchedRoles.map((role, index) => (
                <li key={index}>
                  <strong>{role.title}</strong> — Match Score: {role.score.toFixed(2)}%<br />
                  {role.description}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {matchedRoles.length > 0 && (
  <>
    <h3>Resume Match Score</h3>
    <div style={{ marginBottom: "20px" }}>
      <div style={{ background: "#e0e0e0", borderRadius: "10px", height: "25px", width: "100%" }}>
        <div style={{
          width: `${bestScore}%`,
          background: "#4caf50",
          height: "100%",
          borderRadius: "10px",
          color: "white",
          textAlign: "center",
          lineHeight: "25px",
          fontWeight: "bold"
        }}>
          {bestScore.toFixed(1)}%
        </div>
      </div>
    </div>
  </>
)}


      {/* Export button only if data exists */}
      {extractedText && (
        <button onClick={handleDownloadPdf} style={{ marginTop: "20px" }}>
          Export as PDF
        </button>
      )}
    </div>
  );
};

export default UploadResume;
