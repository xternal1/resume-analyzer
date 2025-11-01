// src/components/ResumeCard.tsx
import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

type ResumeCardProps = {
  resume: Resume;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
};

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath },
  selectable = false,
  isSelected = false,
  onToggleSelect,
}: ResumeCardProps) => {
  const { fs } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    let objectUrl = "";

    const loadResume = async () => {
      try {
        const blob = await fs.read(imagePath);
        if (!blob) return;

        const isPdf = imagePath?.match(/\.pdf$/i);
        let mimeType = "image/jpeg";
        if (isPdf) mimeType = "application/pdf";
        else if (imagePath?.match(/\.png$/i)) mimeType = "image/png";
        else if (imagePath?.match(/\.webp$/i)) mimeType = "image/webp";

        const fileBlob = new Blob([blob], { type: mimeType });
        objectUrl = URL.createObjectURL(fileBlob);
        if (mounted) setResumeUrl(objectUrl);
      } catch (error: any) {
        // silently ignore not-found, but log other errors
        if (error?.code !== "subject_does_not_exist") console.error("Error loading resume image:", error);
        if (mounted) setResumeUrl("");
      }
    };

    if (imagePath) loadResume();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagePath, fs]);

  return (
    <div className="relative resume-card animate-in fade-in duration-300">
      {selectable && (
        <div className="absolute top-3 left-3 z-20">
          <label htmlFor={`select-${id}`} className="sr-only">Select resume</label>
          <input
            id={`select-${id}`}
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(id)}
            onClick={(e) => e.stopPropagation()} // prevent Link navigation
            className="w-5 h-5 cursor-pointer"
          />
        </div>
      )}

      <Link to={`/resume/${id}`} className="block bg-white rounded-md overflow-hidden shadow-sm">
        <div className="resume-card-header p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2">
              {companyName ? <h2 className="!text-black font-bold break-words">{companyName}</h2> : null}
              {jobTitle ? <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3> : null}
              {!companyName && !jobTitle && <h2 className="text-black font-bold">Resume</h2>}
            </div>
          </div>

          <div className="flex-shrink-0">
            <ScoreCircle score={feedback?.overallScore ?? 0} />
          </div>
        </div>

        {resumeUrl ? (
          <div className="gradient-color">
            <div className="w-full h-full">
              <img
                src={resumeUrl}
                alt="resume preview"
                className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
              />
            </div>
          </div>
        ) : (
          <div className="gradient-color">
            <div className="w-full h-[350px] max-sm:h-[200px] flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Preview not available</p>
              </div>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
};

export default ResumeCard;
