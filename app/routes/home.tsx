  import type { Route } from "./+types/home";
  import ResumeCard from "~/components/ResumeCard";
  import WipeData from "~/components/WipeData";
  import { usePuterStore } from "~/lib/puter";
  import { Link, useNavigate } from "react-router";
  import { useEffect, useState } from "react";
  import Navbar from "~/components/navbar";
  import { ToastContainer } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";

  export function meta({ }: Route.MetaArgs) {
    return [
      { title: "Resumind" },
      { name: "description", content: "Smart feedback for your dream job!" },
    ];
  }

  export default function Home() {
    const { auth, kv, fs } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [showWipeData, setShowWipeData] = useState(false);

    useEffect(() => {
      if (!auth.isAuthenticated) navigate("/auth?next=/");
    }, [auth.isAuthenticated]);

    const loadResumes = async () => {
      setLoadingResumes(true);

      try {
        const resumes = (await kv.list("resume:*", true)) as KVItem[];

        if (!resumes || resumes.length === 0) {
          setResumes([]);
          setLoadingResumes(false);
          return;
        }

        const parsedResumes: Resume[] = [];

        // Parse and filter valid resumes
        for (const resume of resumes) {
          try {
            // Skip empty or invalid entries
            if (!resume.value || resume.value === '') {
              continue;
            }

            const data = JSON.parse(resume.value) as Resume;

            // Validate that resume has required fields
            if (data.id && data.imagePath) {
              parsedResumes.push(data);
            } else {
              console.warn(`Invalid resume data for key ${resume.key}`);
            }
          } catch (error) {
            console.error("Error parsing resume:", error);
          }
        }

        console.log("parsedResumes", parsedResumes);
        setResumes(parsedResumes);
      } catch (error) {
        console.error("Error loading resumes:", error);
        setResumes([]);
      } finally {
        setLoadingResumes(false);
      }
    };

    useEffect(() => {
      loadResumes();
    }, []);

    const handleDataDeleted = () => {
      loadResumes();
      setShowWipeData(false);
    };

    return (
      <main className="bg-[url('/images/minimalist.png')] bg-cover">
        <Navbar
          showWipeData={showWipeData}
          onToggleWipe={() => setShowWipeData((s) => !s)}
        />
        <ToastContainer />

        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Track Your Applications & Resume Ratings</h1>
            {!loadingResumes && resumes?.length === 0 ? (
              <h2>No resumes found. Upload your first resume to get feedback.</h2>
            ) : (
              <h2>Review your submissions and check AI-powered feedback.</h2>
            )}
          </div>

          {loadingResumes && (
            <div className="flex flex-wrap gap-4">
              {(resumes.length > 0 ? resumes : Array.from({ length: 4 })).map((_, i) => (
                <div
                  key={i}
                  className="w-[200px] h-[250px] bg-gray-200 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          )}


          {!loadingResumes && resumes.length > 0 && (
            <>
              {showWipeData && <WipeData resumes={resumes} onDataDeleted={handleDataDeleted} />}

              <div className="resumes-section">
                {resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} />
                ))}
              </div>
            </>
          )}

          {!loadingResumes && resumes?.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 gap-4">
              <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                Upload Resume
              </Link>
            </div>
          )}
        </section>
      </main>
    );
  }