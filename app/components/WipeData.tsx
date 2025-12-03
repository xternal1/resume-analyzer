// src/components/WipeData.tsx
"use client";

import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import ResumeCard from "./ResumeCard";
import { Alert, Button, Modal, ModalHeader, ModalBody } from "flowbite-react";
import { HiCheckCircle, HiXCircle, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";

interface WipeDataProps {
    resumes: Resume[];
    onDataDeleted: () => void;
}

type AlertType = "success" | "error" | "warning" | "info";

const WipeData = ({ resumes, onDataDeleted }: WipeDataProps) => {
    const { fs, kv } = usePuterStore();
    const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [files, setFiles] = useState<FSItem[]>([]);

    // Alert state
    const [alert, setAlert] = useState<{ type: AlertType; message: string; visible: boolean }>({
        type: "info",
        message: "",
        visible: false,
    });

    // Modal state
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

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

    const showAlert = (type: AlertType, message: string, duration = 4000) => {
        setAlert({ type, message, visible: true });
        setTimeout(() => setAlert((a) => ({ ...a, visible: false })), duration);
    };

    const toggleResumeSelection = (id: string) => {
        setSelectedResumes((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const handleDelete = () => {
        if (selectedResumes.length === 0) {
            showAlert("warning", "Pilih minimal satu data untuk dihapus.");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleDeleteAll = () => {
        setIsDeleteAllModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        setIsConfirmModalOpen(false);
        try {
            const toDelete = resumes.filter((r) => selectedResumes.includes(r.id));

            for (const resume of toDelete) {
                try {
                    if (resume.resumePath) await fs.delete(resume.resumePath);
                    if (resume.imagePath && resume.imagePath !== resume.resumePath) await fs.delete(resume.imagePath);
                    await kv.set(`resume:${resume.id}`, "");
                } catch (err) {
                    console.warn(`Error deleting resume ${resume.id}:`, err);
                }
            }

            showAlert("success", `${selectedResumes.length} data berhasil dihapus!`);
            setSelectedResumes([]);
            await loadFiles();
            onDataDeleted();
        } catch (err) {
            console.error("Error deleting resumes:", err);
            showAlert("error", "Gagal menghapus data. Silakan coba lagi.");
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDeleteAll = async () => {
        setIsDeleting(true);
        setIsDeleteAllModalOpen(false);
        try {
            for (const f of files) {
                try {
                    await fs.delete(f.path);
                } catch (err) {
                    console.error(`Error deleting file ${f.path}:`, err);
                }
            }
            await kv.flush();
            showAlert("success", "Semua data aplikasi berhasil dihapus!");
            setSelectedResumes([]);
            await loadFiles();
            onDataDeleted();
        } catch (err) {
            console.error("Error wiping app data:", err);
            showAlert("error", "Gagal menghapus data. Silakan coba lagi.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (resumes.length === 0) return null;

    const alertColor = (t: AlertType) =>
        t === "success" ? "success" : t === "error" ? "failure" : t === "warning" ? "warning" : "info";

    const alertIcon = (t: AlertType) =>
        t === "success" ? HiCheckCircle : t === "error" ? HiXCircle : t === "warning" ? HiExclamationCircle : HiInformationCircle;

    return (
        <div className="w-full mb-6">
            {alert.visible && (
                <div className="mb-4">
                    <Alert color={alertColor(alert.type)} icon={alertIcon(alert.type)}>
                        <span className="font-medium capitalize mr-2">{alert.type}:</span>
                        {alert.message}
                    </Alert>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                            {selectedResumes.length} out of {resumes.length}
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <Button color="failure" onClick={handleDelete} disabled={selectedResumes.length === 0 || isDeleting}>
                            {isDeleting ? "Deleting..." : `Delete Selected (${selectedResumes.length})`}
                        </Button>

                        <Button color="failure" outline onClick={handleDeleteAll} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete All Data"}
                        </Button>
                    </div>
                </div>

                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <strong>Info:</strong> Total {files.length} files dalam storage. Tombol <strong>"Delete All Data"</strong> akan menghapus SEMUA file dan data aplikasi.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
                    {resumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            selectable
                            isSelected={selectedResumes.includes(resume.id)}
                            onToggleSelect={toggleResumeSelection}
                        />
                    ))}
                </div>
            </div>

            {/* Modal konfirmasi Delete Selected */}
            <Modal show={isConfirmModalOpen} size="md" onClose={() => setIsConfirmModalOpen(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">
                            Yakin ingin menghapus {selectedResumes.length} data ini?
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Button color="failure" onClick={confirmDelete}>
                                Ya, hapus
                            </Button>
                            <Button color="gray" onClick={() => setIsConfirmModalOpen(false)}>
                                Batal
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            {/* Modal konfirmasi Delete All */}
            <Modal show={isDeleteAllModalOpen} size="md" onClose={() => setIsDeleteAllModalOpen(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
                        <h3 className="mb-2 text-lg font-semibold text-red-600">Hapus Semua Data Aplikasi?</h3>
                        <p className="text-sm text-gray-500 mb-5">Ini akan menghapus semua file ({files.length} files) dan data KV secara permanen.</p>
                        <div className="flex justify-center gap-4">
                            <Button color="failure" onClick={confirmDeleteAll}>
                                Ya, hapus semua
                            </Button>
                            <Button color="gray" onClick={() => setIsDeleteAllModalOpen(false)}>
                                Batal
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default WipeData;