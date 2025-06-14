import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, File, CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface FAQUploaderProps {
  chatbotId: string;
  onUploadComplete: () => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  status: "uploading" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  faqCount?: number;
}

export function FAQUploader({ chatbotId, onUploadComplete }: FAQUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);

        // Add file to state
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: fileId,
            filename: file.name,
            status: "uploading",
            progress: 0,
          },
        ]);

        try {
          // Read file content
          const content = await readFileContent(file);

          // Update progress
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: 30 } : f))
          );

          // Save document to database
          const { data: document, error: docError } = await supabase
            .from("faq_documents")
            .insert({
              chatbot_id: chatbotId,
              filename: file.name,
              file_type: file.type,
              file_size: file.size,
              content: content,
              processing_status: "processing",
            })
            .select()
            .single();

          if (docError) throw docError;

          // Update status to processing
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, status: "processing", progress: 50 } : f
            )
          );

          // Process FAQ content using server-side endpoint
          const response = await fetch(
            `${
              import.meta.env.VITE_SUPABASE_URL
            }/functions/v1/process-faq-document`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${
                  import.meta.env.VITE_SUPABASE_ANON_KEY
                }`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content,
                filename: file.name,
                chatbotId,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Processing failed: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.error) {
            throw new Error(result.error);
          }

          const faqEntries = result.entries || [];

          // Update progress
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: 75 } : f))
          );

          // Save FAQ entries to database
          if (faqEntries.length > 0) {
            type FAQEntry = {
              question: string;
              answer: string;
              keywords?: string;
            };

            const faqInserts = faqEntries.map((entry: FAQEntry) => ({
              document_id: document.id,
              chatbot_id: chatbotId,
              question: entry.question,
              answer: entry.answer,
              keywords: entry.keywords,
            }));

            const { error: faqError } = await supabase
              .from("faq_entries")
              .insert(faqInserts);

            if (faqError) throw faqError;
          }

          // Update document status
          await supabase
            .from("faq_documents")
            .update({
              processing_status: "completed",
              processed_at: new Date().toISOString(),
            })
            .eq("id", document.id);

          // Update status to completed
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    faqCount: faqEntries.length,
                  }
                : f
            )
          );

          const processingMethod =
            result.method === "ai" ? "AI-powered processing" : "manual parsing";
          toast.success(
            `${file.name} processed successfully using ${processingMethod}! Found ${faqEntries.length} FAQ entries.`
          );
          onUploadComplete();
        } catch (error: unknown) {
          console.error("Upload error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "An unknown error occurred";

          // Update document status to failed if it was created
          try {
            await supabase
              .from("faq_documents")
              .update({
                processing_status: "failed",
                error_message: errorMessage,
              })
              .eq("chatbot_id", chatbotId)
              .eq("filename", file.name);
          } catch (updateError) {
            console.error("Failed to update document status:", updateError);
          }

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "failed",
                    progress: 0,
                    error: errorMessage,
                  }
                : f
            )
          );
          toast.error(`Failed to process ${file.name}: ${errorMessage}`);
        }
      }
    },
    [chatbotId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Upload FAQ Documents
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Upload your FAQ documents to train your chatbot. Our server-side AI
          processing will automatically extract questions and answers. Supported
          formats: TXT, CSV, PDF (up to 10MB each).
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Drop the files here...
            </p>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drag & drop files here, or{" "}
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  browse
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                TXT, CSV, PDF files up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* AI Processing Info */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Server-Side AI Processing
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Our secure server-side AI will automatically extract questions and
            answers from your documents, generate relevant keywords, and
            optimize them for intelligent responses. No API keys required on
            your end!
          </p>
        </div>

        {/* Format Examples */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
              TXT Format Example:
            </h4>
            <pre className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
              {`Q: What are your business hours?
A: We're open Monday-Friday 9AM-6PM

Q: How can I contact support?
A: Email us at support@company.com`}
            </pre>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
              CSV Format Example:
            </h4>
            <pre className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
              {`question,answer
"What are your hours?","9AM-6PM Mon-Fri"
"How to contact?","support@company.com"`}
            </pre>
          </div>
        </div>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Processing Files
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {file.filename}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            file.status === "completed"
                              ? "bg-green-600"
                              : file.status === "failed"
                              ? "bg-red-600"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {file.progress}%
                      </span>
                    </div>
                    {file.status === "completed" && file.faqCount && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {file.faqCount} FAQ entries extracted
                      </p>
                    )}
                    {file.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {file.error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === "uploading" && (
                    <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  )}
                  {file.status === "processing" && (
                    <div className="flex items-center space-x-1">
                      <Loader className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-spin" />
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        Server Processing...
                      </span>
                    </div>
                  )}
                  {file.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {file.status === "failed" && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="p-1"
                  >
                    ×
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
