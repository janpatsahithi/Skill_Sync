import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSkills } from "../context/SkillContext";
import { resumeAPI } from "../services/api";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedSkills, setUploadedSkills] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { setExtractedSkills } = useSkills();

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  /* ---------------- DRAG & DROP ---------------- */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  const validateAndSetFile = (file) => {
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileName = file.name.toLowerCase();

    const isValid = allowedExtensions.some(ext =>
      fileName.endsWith(ext)
    );

    if (!isValid) {
      setErrorMessage("Please upload a PDF or DOC/DOCX file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be less than 5MB.");
      return;
    }

    setFile(file);
    setIsUploaded(false);
    setUploadProgress(0);
    setErrorMessage("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  /* ---------------- UPLOAD ---------------- */
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMessage("");

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 200);

    try {
      const response = await resumeAPI.upload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploaded(true);

      if (response.data?.skills?.length) {
        setUploadedSkills(response.data.skills);
        setExtractedSkills(response.data.skills);
      }

      setTimeout(() => navigate("/app/extracted-skills"), 800);
    } catch (err) {
      clearInterval(progressInterval);
      setErrorMessage(err.response?.data?.detail || err.message || "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Upload Your Resume
        </h1>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-200/80 border border-red-500 rounded-lg text-sm text-red-900">
            {errorMessage}
          </div>
        )}

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center ${
            isDragging ? "border-primary-500 bg-primary-200/50" : "border-primary-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{ backgroundColor: isDragging ? 'rgba(249, 168, 212, 0.5)' : 'rgba(255, 255, 255, 0.2)' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <Upload className="w-10 h-10 mx-auto mb-4 text-primary" />
          <p className="text-text-primary">Drag & drop or click to upload</p>
          {file && (
            <p className="mt-2 text-sm text-text-secondary">{file.name}</p>
          )}
        </div>

        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-primary-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-text-secondary mt-2">{uploadProgress}%</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            className="px-8 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
            onClick={handleUpload}
            disabled={!file || isUploading}
            style={{ background: 'linear-gradient(to right, #A855F7, #EC4899, #3B82F6)' }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#DB2777'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #A855F7, #EC4899, #3B82F6)'; }}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                Uploading...
              </>
            ) : (
              "Upload Resume"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;

