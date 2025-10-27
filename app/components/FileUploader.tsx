import {useCallback, useState} from 'react';
import {useDropzone} from 'react-dropzone';

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = () => {
    const [file, setfile] = useState();
      const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0] || null;
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div className='w-full gradient-border'>
        <div {...getRootProps()}>
            <input {...getInputProps()} />
        <div className='space-y-6 cursor-pointer'>
            <div className='mx-auto w-26 h-16 flex items-center justify-center'>
                <img 
                    src="/icons/info.svg" 
                    alt="upload"
                    className='size-20' 
                />
            </div>
            {file?(
                <div>

                </div>
            ):(
                <div>
                    <p className='text-lg text-gray-500'>
                        <span className='font-semibold'>
                            Click here to upload
                        </span> or drag and drop
                    </p>
                    <p className='text-lg text-gray-500'>
                        PDF (Max 20 MB)
                    </p>
                </div>
            )}
        </div>
    </div>
    </div>
  )
}

export default FileUploader