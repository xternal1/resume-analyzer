import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";
import type { Feedback } from "stores/feedbackStores";

export const meta = () => ([
  { title: 'Resumind | Review' },
  { name: 'description', content: 'Detailed Review of Your Resume' },
])

const resume = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFileType, setResumeFileType] = useState<'pdf' | 'image'>('pdf');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resumeData, setResumeData] = useState<Resume | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const resume = await kv.get(`resume:${id}`);

        if (!resume) {
          console.error('Resume not found');
          navigate('/');
          return;
        }

        const data = JSON.parse(resume);
        setResumeData(data);

        // Load resume file
        try {
          const resumeBlob = await fs.read(data.resumePath);
          if (!resumeBlob) throw new Error('Resume file not found');

          // Deteksi tipe file dari blob atau path
          const isImage = data.resumePath.match(/\.(jpg|jpeg|png|webp)$/i);

          if (isImage) {
            // Jika file adalah gambar
            setResumeFileType('image');
            const mimeType = data.resumePath.match(/\.png$/i)
              ? 'image/png'
              : data.resumePath.match(/\.webp$/i)
                ? 'image/webp'
                : 'image/jpeg';
            const imageBlob = new Blob([resumeBlob], { type: mimeType });
            const url = URL.createObjectURL(imageBlob);
            setResumeUrl(url);
          } else {
            // Jika file adalah PDF
            setResumeFileType('pdf');
            const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            setResumeUrl(url);
          }
        } catch (error: any) {
          if (error?.code !== 'subject_does_not_exist') {
            console.error('Error loading resume file:', error);
          }
        }

        // Load image preview
        try {
          const imageBlob = await fs.read(data.imagePath);
          if (!imageBlob) throw new Error('Image file not found');

          // Detect correct MIME type for image
          const mimeType = data.imagePath.match(/\.png$/i)
            ? 'image/png'
            : data.imagePath.match(/\.webp$/i)
              ? 'image/webp'
              : 'image/jpeg';

          const blob = new Blob([imageBlob], { type: mimeType });
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } catch (error: any) {
          if (error?.code !== 'subject_does_not_exist') {
            console.error('Error loading image preview:', error);
          }
        }

        setFeedback(data.feedback);
        console.log({
          resumeData: data,
          resumeUrl: resumeUrl || 'loading...',
          imageUrl: imageUrl || 'loading...',
          feedback: data.feedback,
          fileType: data.resumePath.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : 'pdf'
        });
      } catch (error) {
        console.error('Error loading resume data:', error);
        navigate('/');
      }
    }

    if (id) {
      loadResume();
    }

    // Cleanup URLs on unmount
    return () => {
      if (resumeUrl) URL.revokeObjectURL(resumeUrl);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    }
  }, [id])

  const handleUpdateResume = () => {
    // Navigate ke upload page dengan state
    navigate(`/upload/${id}`, {
      state: resumeData
    });
  };

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-bold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg [url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justfiy-center]">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title={resumeFileType === 'pdf' ? 'Resume PDF' : 'Resume Image'}
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
            {feedback && (
              <button
                onClick={handleUpdateResume}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center gap-2 max-sm:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Resume
              </button>
            )}
          </div>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS?.score || 0} suggestions={feedback.ATS?.tips || []} />
              <Details feedback={feedback} />

              {/* Update Resume Button - Bottom */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Want to improve your resume?</h3>
                <p className="text-gray-600 mb-4">Update your resume with the same job details and get fresh feedback</p>
                <button
                  onClick={handleUpdateResume}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Resume
                </button>
              </div>
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif"
              className="w-full"
            />
          )}
        </section>
      </div>
    </main>
  )
}

export default resume