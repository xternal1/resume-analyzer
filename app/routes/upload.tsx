import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

import FileUploader from "~/components/FileUploader"
import { usePuterStore } from "~/lib/puter"
import { useLocation, useNavigate, useParams } from "react-router"

import { generateUUID } from "~/lib/utils"
import { prepareInstructions } from "../../constants"
import { convertPdfToImage } from '~/lib/pdf2image'
import Navbar from '~/components/navbar'

export const meta = () => ([
    { title: 'Resumind | Upload' },
    { name: 'description', content: 'Upload and analyze your resume!' },
])

// Zod schema untuk validasi form
const uploadSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    jobTitle: z.string().min(1, 'Job title is required'),
    jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
    file: z.instanceof(File, { message: 'Please upload a file' })
        .refine(
            (file) => file.size <= 20 * 1024 * 1024,
            'File size must be less than 20MB'
        )
        .refine(
            (file) => {
                const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
                return validTypes.includes(file.type)
            },
            'File must be a PDF or image (JPEG, PNG, WebP)'
        )
})

type UploadFormData = z.infer<typeof uploadSchema>

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore()
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState('')
    const { id } = useParams();
    const location = useLocation();
    const oldData = location.state as Resume | null;
    const isUpdateMode = !!id && !!oldData;

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<UploadFormData>({
        resolver: async (values) => {
            try {
                const validated = uploadSchema.parse(values)
                return { values: validated, errors: {} }
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const fieldErrors: Record<string, { type: string; message: string }> = {}
                    error.issues.forEach((issue) => {
                        const path = issue.path.join('.')
                        fieldErrors[path] = { type: 'validation', message: issue.message }
                    })
                    return {
                        values: {},
                        errors: fieldErrors
                    }
                }
                return { values: {}, errors: {} }
            }
        }
    })

    // Populate form with old data when in update mode
    useEffect(() => {
        if (isUpdateMode && oldData) {
            console.log('Populating form with old data:', oldData);
            setValue('companyName', oldData.companyName || '');
            setValue('jobTitle', oldData.jobTitle || '');
            setValue('jobDescription', oldData.jobDescription || '');
        }
    }, [isUpdateMode, oldData, setValue]);

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: UploadFormData) => {
        setIsProcessing(true)

        try {
            setStatusText('Uploading the file...')
            const uploadedFile = await fs.upload([file])
            if (!uploadedFile) {
                setStatusText('Error: Failed to upload file')
                setIsProcessing(false)
                return
            }

            let imagePath = ''

            // Jika file adalah PDF, convert ke image
            if (file.type === 'application/pdf') {
                setStatusText('Converting PDF to image...')
                const imageFile = await convertPdfToImage(file)
                if (!imageFile.file) {
                    setStatusText('Error: Failed to convert PDF to image')
                    // Cleanup uploaded file on error
                    try { await fs.delete(uploadedFile.path) } catch (e) { }
                    setIsProcessing(false)
                    return
                }

                setStatusText('Uploading the image...')
                const uploadedImage = await fs.upload([imageFile.file])
                if (!uploadedImage) {
                    setStatusText('Error: Failed to upload image')
                    // Cleanup uploaded file on error
                    try { await fs.delete(uploadedFile.path) } catch (e) { }
                    setIsProcessing(false)
                    return
                }
                imagePath = uploadedImage.path
            } else {
                // Jika sudah berupa image, langsung gunakan file yang diupload
                imagePath = uploadedFile.path
            }

            setStatusText('Analyzing...')
            console.log('Starting AI analysis with:', { jobTitle, jobDescription })

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription })
            )

            if (!feedback) {
                setStatusText('Error: Failed to analyze resume')
                // Cleanup uploaded files on error
                try {
                    await fs.delete(uploadedFile.path);
                    if (imagePath !== uploadedFile.path) {
                        await fs.delete(imagePath);
                    }
                } catch (e) { }
                setIsProcessing(false)
                return
            }

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text

            // Clean the response - remove markdown code blocks if present
            let cleanedFeedback = feedbackText.trim();

            // Remove ```json and ``` if present
            if (cleanedFeedback.startsWith('```json')) {
                cleanedFeedback = cleanedFeedback.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
            } else if (cleanedFeedback.startsWith('```')) {
                cleanedFeedback = cleanedFeedback.replace(/^```\s*/, '').replace(/```\s*$/, '');
            }

            cleanedFeedback = cleanedFeedback.trim();

            console.log('Cleaned feedback text:', cleanedFeedback.substring(0, 100) + '...');

            let parsedFeedback;
            try {
                parsedFeedback = JSON.parse(cleanedFeedback);
            } catch (parseError) {
                setStatusText('Error: Failed to parse AI feedback')
                console.error('JSON parse error:', parseError);
                console.error('Cleaned feedback:', cleanedFeedback);
                // Cleanup uploaded files on error
                try {
                    await fs.delete(uploadedFile.path);
                    if (imagePath !== uploadedFile.path) {
                        await fs.delete(imagePath);
                    }
                } catch (e) { }
                setIsProcessing(false)
                return
            }

            // SEKARANG baru delete old files setelah semua sukses
            if (isUpdateMode && oldData) {
                setStatusText('Removing old files...')
                try {
                    // Delete old resume file if it exists
                    if (oldData.resumePath) {
                        try {
                            await fs.delete(oldData.resumePath)
                            console.log('Deleted old resume:', oldData.resumePath)
                        } catch (err) {
                            console.warn('Old resume file may not exist:', oldData.resumePath)
                        }
                    }
                    // Delete old image file if different from resume
                    if (oldData.imagePath && oldData.imagePath !== oldData.resumePath) {
                        try {
                            await fs.delete(oldData.imagePath)
                            console.log('Deleted old image:', oldData.imagePath)
                        } catch (err) {
                            console.warn('Old image file may not exist:', oldData.imagePath)
                        }
                    }
                } catch (error) {
                    console.warn('Error deleting old files:', error)
                    // Not critical - continue
                }
            }

            setStatusText('Preparing data...')
            // Gunakan ID yang sama jika update mode, atau generate baru
            const resumeId = isUpdateMode && id ? id : generateUUID()
            const data = {
                id: resumeId,
                resumePath: uploadedFile.path,
                imagePath: imagePath,
                companyName,
                jobTitle,
                jobDescription,
                feedback: parsedFeedback,
            }

            await kv.set(`resume:${resumeId}`, JSON.stringify(data))

            setStatusText(isUpdateMode ? 'Update complete, redirecting...' : 'Analysis complete, redirecting...')
            console.log('Analysis complete:', data)
            navigate(`/resume/${resumeId}`)
        } catch (error) {
            console.error('Error during analysis:', error)
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
            setIsProcessing(false)
        }
    }

    const onSubmit = (data: UploadFormData) => {
        handleAnalyze(data)
    }

    return (
        <main className="bg-[url('/images/space.jpg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>{isUpdateMode ? 'Update Your Resume Analysis' : 'Smart feedback for your dream job'}</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" alt="Processing" />
                        </>
                    ) : (
                        <>
                            <h2>Drop your resume (PDF or Image) for an ATS score and improvement tips</h2>
                            {isUpdateMode && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 font-medium">
                                        🔄 Update Mode: Your previous job details are pre-filled. Upload a new resume to get fresh feedback.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                    {!isProcessing && (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="companyName">Company Name</label>
                                <input
                                    type="text"
                                    {...register('companyName')}
                                    placeholder="Company Name"
                                    id="companyName"
                                    className={errors.companyName ? 'border-red-500' : ''}
                                />
                                {errors.companyName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                                )}
                            </div>

                            <div className="form-div">
                                <label htmlFor="jobTitle">Job Title</label>
                                <input
                                    type="text"
                                    {...register('jobTitle')}
                                    placeholder="Job Title"
                                    id="jobTitle"
                                    className={errors.jobTitle ? 'border-red-500' : ''}
                                />
                                {errors.jobTitle && (
                                    <p className="text-red-500 text-sm mt-1">{errors.jobTitle.message}</p>
                                )}
                            </div>

                            <div className="form-div">
                                <label htmlFor="jobDescription">Job Description</label>
                                <textarea
                                    rows={5}
                                    {...register('jobDescription')}
                                    placeholder="Job Description"
                                    id="jobDescription"
                                    className={errors.jobDescription ? 'border-red-500' : ''}
                                />
                                {errors.jobDescription && (
                                    <p className="text-red-500 text-sm mt-1">{errors.jobDescription.message}</p>
                                )}
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume (PDF or Image)</label>
                                <Controller
                                    name="file"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <FileUploader
                                            onFileSelect={(file) => {
                                                if (file) {
                                                    onChange(file);
                                                } else {
                                                    // Clear the file when null is passed
                                                    onChange(undefined);
                                                }
                                            }}
                                        />
                                    )}
                                />
                                {errors.file && (
                                    <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>
                                )}
                            </div>

                            <button className="primary-button" type="submit" disabled={isProcessing}>
                                {isProcessing ? 'Processing...' : isUpdateMode ? 'Update & Analyze Resume' : 'Analyze Resume'}
                            </button>

                            {isUpdateMode && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/resume/${id}`)}
                                    className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium"
                                >
                                    Cancel Update
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload