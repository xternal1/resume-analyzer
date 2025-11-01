// src/components/WipeData.tsx
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { toast } from "react-toastify";
import ResumeCard from "./ResumeCard";

interface WipeDataProps {
    resumes: Resume[];
    onDataDeleted: () => void;
}

const WipeData = ({ resumes, onDataDeleted }: WipeDataProps) => {
    const { fs, kv } = usePuterStore();
    const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        try {
            const fileList = (await fs.readDir("./")) as FSItem[];
            setFiles(fileList || []);
        } catch (error) {
            console.error("Error loading files:", error);
            setFiles([]);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const toggleResumeSelection = (id: string) => {
        setSelectedResumes((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        if (selectedResumes.length === resumes.length) setSelectedResumes([]);
        else setSelectedResumes(resumes.map((r) => r.id));
    };

    const handleDelete = () => {
        if (selectedResumes.length === 0) {
            toast.warning("Please select at least one resume to delete");
            return;
        }

        const message =
            selectedResumes.length === 1 ? "Yakin ingin menghapus data ini?" : `Yakin ingin menghapus ${selectedResumes.length} data ini?`;

        toast(
            ({ closeToast }) => (
                <div className="flex flex-col gap-3">
                    <p className="font-medium">{message}</p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => closeToast()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Batal</button>
                        <button
                            onClick={() => {
                                closeToast();
                                confirmDelete();
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            ),
            { position: "top-center", autoClose: false, closeButton: false, draggable: false }
        );
    };

    const handleDeleteAll = () => {
        const message = "Yakin ingin menghapus SEMUA data aplikasi? Tindakan ini tidak dapat dibatalkan!";

        toast(
            ({ closeToast }) => (
                <div className="flex flex-col gap-3">
                    <p className="font-bold text-red-600">{message}</p>
                    <p className="text-sm text-gray-600">Ini akan menghapus semua file ({files.length} files) dan data KV.</p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => closeToast()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Batal</button>
                        <button
                            onClick={() => {
                                closeToast();
                                confirmDeleteAll();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-bold"
                        >
                            Hapus Semua
                        </button>
                    </div>
                </div>
            ),
            { position: "top-center", autoClose: false, closeButton: false, draggable: false }
        );
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const toDelete = resumes.filter((r) => selectedResumes.includes(r.id));

            for (const resume of toDelete) {
                try {
                    if (resume.resumePath) {
                        try { await fs.delete(resume.resumePath); } catch (e) { console.warn(`Resume file already deleted: ${resume.resumePath}`); }
                    }

                    if (resume.imagePath && resume.imagePath !== resume.resumePath) {
                        try { await fs.delete(resume.imagePath); } catch (e) { console.warn(`Image file already deleted: ${resume.imagePath}`); }
                    }

                    try { await kv.set(`resume:${resume.id}`, ""); console.log(`Cleared KV entry: resume:${resume.id}`); } catch (e) { console.error(e); }
                } catch (err) {
                    console.error(`Error deleting resume ${resume.id}:`, err);
                }
            }

            toast.success(`${selectedResumes.length} data berhasil dihapus!`, { position: "top-center" });
            setSelectedResumes([]);
            await loadFiles();
            onDataDeleted();
        } catch (err) {
            console.error("Error deleting resumes:", err);
            toast.error("Gagal menghapus data. Silakan coba lagi.", { position: "top-center" });
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDeleteAll = async () => {
        setIsDeleting(true);
        try {
            for (const f of files) {
                try { await fs.delete(f.path); } catch (err) { console.error(`Error deleting file ${f.path}:`, err); }
            }
            await kv.flush();

            toast.success("Semua data aplikasi berhasil dihapus!", { position: "top-center" });
            setSelectedResumes([]);
            await loadFiles();
            onDataDeleted();
        } catch (err) {
            console.error("Error wiping app data:", err);
            toast.error("Gagal menghapus data. Silakan coba lagi.", { position: "top-center" });
        } finally {
            setIsDeleting(false);
        }
    };

    if (resumes.length === 0) return null;

    return (
        <div className="w-full mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                            {selectedResumes.length} out of {resumes.length}
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={selectedResumes.length === 0 || isDeleting}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${selectedResumes.length === 0 || isDeleting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600 cursor-pointer"}`}
                        >
                            {isDeleting ? "Deleting..." : `Delete Selected (${selectedResumes.length})`}
                        </button>

                        <button
                            onClick={handleDeleteAll}
                            disabled={isDeleting}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${isDeleting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 cursor-pointer border-2 border-red-700"}`}
                        >
                            {isDeleting ? "Deleting..." : "Delete All Data"}
                        </button>
                    </div>
                </div>

                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <strong>Info:</strong> Total {files.length} files dalam storage. "Delete All Data" akan menghapus SEMUA file dan data.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
                    {resumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            selectable={true}
                            isSelected={selectedResumes.includes(resume.id)}
                            onToggleSelect={(id) => toggleResumeSelection(id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WipeData;
