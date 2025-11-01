import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatSize } from '~/lib/utils';

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;
        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024;

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize: maxFileSize,
    });

    const file = acceptedFiles[0] || null;

    // Fungsi untuk mendapatkan icon berdasarkan tipe file
    const getFileIcon = (file: File): string => {
        if (file.type === 'application/pdf') {
            return '/images/pdf.png';
        }
        // Untuk image, tampilkan preview
        return '/images/pdf.png'; // fallback
    };

    // Fungsi untuk mendapatkan nama tipe file
    const getFileTypeName = (file: File) => {
        if (file.type === 'application/pdf') {
            return 'PDF';
        }
        if (file.type.startsWith('image/')) {
            return file.type.split('/')[1].toUpperCase();
        }
        return 'File';
    };

    return (
        <div className='w-full gradient-border'>
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className='space-y-6 cursor-pointer'>
                    {file ? (
                        <div className='uploader-selected-file' onClick={(e) => e.stopPropagation()}>
                            {file.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="preview"
                                    className='size-10 object-cover rounded'
                                />
                            ) : (
                                <img src="/images/pdf.png" alt="file icon" className='size-10' />
                            )}
                            <div className='flex items-center space-x-3'>
                                <div>
                                    <p className='text-sm text-gray-700 font-medium truncate max-w-xs'>
                                        {file.name}
                                    </p>
                                    <p className='text-sm text-gray-500'>
                                        {getFileTypeName(file)} • {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                className='p-2 cursor-pointer'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileSelect?.(null);
                                }}
                            >
                                <img src="/icons/cross.svg" alt="remove" className='w-4 h-4' />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="upload" className="size-20" />
                            </div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">
                                    Click to upload
                                </span> or drag and drop
                            </p>
                            <p className="text-lg text-gray-500">
                                PDF or Image (JPEG, PNG, WebP) - max {formatSize(maxFileSize)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FileUploader;