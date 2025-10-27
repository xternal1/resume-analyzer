export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  console.log("[loadPdfJs] called");

  if (pdfjsLib) {
    console.log("[loadPdfJs] using cached pdfjsLib");
    return pdfjsLib;
  }
  if (loadPromise) {
    console.log("[loadPdfJs] returning existing loadPromise");
    return loadPromise;
  }

  isLoading = true;
  console.log("[loadPdfJs] importing pdfjs-dist...");
  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    console.log("[loadPdfJs] pdfjs-dist loaded", lib);
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    console.log("[loadPdfJs] worker source set");
    pdfjsLib = lib;
    isLoading = false;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  console.log("[convertPdfToImage] start", file);

  try {
    const lib = await loadPdfJs();
    console.log("[convertPdfToImage] pdfjs loaded", lib);

    const arrayBuffer = await file.arrayBuffer();
    console.log("[convertPdfToImage] arrayBuffer created", arrayBuffer.byteLength);

    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    console.log("[convertPdfToImage] PDF loaded", pdf);

    const page = await pdf.getPage(1);
    console.log("[convertPdfToImage] first page loaded", page);

    const viewport = page.getViewport({ scale: 4 });
    console.log("[convertPdfToImage] viewport created", viewport);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    console.log("[convertPdfToImage] canvas/context ready", canvas, context);

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }

    console.log("[convertPdfToImage] rendering page...");
    await page.render({ canvasContext: context!, viewport }).promise;
    console.log("[convertPdfToImage] render complete");

    return new Promise((resolve) => {
      console.log("[convertPdfToImage] converting canvas to blob...");
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("[convertPdfToImage] blob created", blob);
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            console.log("[convertPdfToImage] file created", imageFile);
            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            console.error("[convertPdfToImage] failed to create blob");
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0
      );
    });
  } catch (err) {
    console.error("[convertPdfToImage] error", err);
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err}`,
    };
  }
}
