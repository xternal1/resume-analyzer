import { useState } from 'react'
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
    { name: 'description', content: 'Log into your account!' },
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
    const oldData = location.state; 


    const {
        register,
        handleSubmit,
        control,
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
                    setIsProcessing(false)
                    return
                }

                setStatusText('Uploading the image...')
                const uploadedImage = await fs.upload([imageFile.file])
                if (!uploadedImage) {
                    setStatusText('Error: Failed to upload image')
                    setIsProcessing(false)
                    return
                }
                imagePath = uploadedImage.path
            } else {
                // Jika sudah berupa image, langsung gunakan file yang diupload
                imagePath = uploadedFile.path
            }

            setStatusText('Preparing data...')
            const uuid = generateUUID()
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: imagePath,
                companyName,
                jobTitle,
                jobDescription,
                feedback: '',
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data))

            setStatusText('Analyzing...')

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription })
            )

            if (!feedback) {
                setStatusText('Error: Failed to analyze resume')
                setIsProcessing(false)
                return
            }

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text

            data.feedback = JSON.parse(feedbackText)
            await kv.set(`resume:${uuid}`, JSON.stringify(data))

            setStatusText('Analysis complete, redirecting...')
            console.log(data)
            navigate(`/resume/${uuid}`)
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
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" alt="Processing" />
                        </>
                    ) : (
                        <h2>Drop your resume (PDF or Image) for an ATS score and improvement tips</h2>
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
                                    render={({ field: { value, onChange } }) => (
                                        <FileUploader onFileSelect={onChange} />
                                    )}
                                />
                                {errors.file && (
                                    <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>
                                )}
                            </div>

                            <button className="primary-button" type="submit" disabled={isProcessing}>
                                {isProcessing ? 'Processing...' : 'Analyze Resume'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload