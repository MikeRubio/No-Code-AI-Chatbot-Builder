import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { openAIService } from '../../lib/openai';
import toast from 'react-hot-toast';

interface FAQUploaderProps {
  chatbotId: string;
  onUploadComplete: () => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  faqCount?: number;
}

export function FAQUploader({ chatbotId, onUploadComplete }: FAQUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Add file to state
      setUploadedFiles(prev => [...prev, {
        id: fileId,
        filename: file.name,
        status: 'uploading',
        progress: 0
      }]);

      try {
        // Read file content
        const content = await readFileContent(file);
        
        // Update progress
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 30 } : f
        ));

        // Save document to database
        const { data: document, error: docError } = await supabase
          .from('faq_documents')
          .insert({
            chatbot_id: chatbotId,
            filename: file.name,
            file_type: file.type,
            file_size: file.size,
            content: content,
            processing_status: 'processing'
          })
          .select()
          .single();

        if (docError) throw docError;

        // Update status to processing
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'processing', progress: 50 } : f
        ));

        // Process FAQ content using OpenAI
        const faqEntries = await openAIService.processFAQDocument(content, file.name);
        
        // Update progress
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 75 } : f
        ));

        // Save FAQ entries to database
        if (faqEntries.length > 0) {
          const faqInserts = faqEntries.map(entry => ({
            document_id: document.id,
            chatbot_id: chatbotId,
            question: entry.question,
            answer: entry.answer,
            keywords: entry.keywords
          }));

          const { error: faqError } = await supabase
            .from('faq_entries')
            .insert(faqInserts);

          if (faqError) throw faqError;
        }

        // Update document status
        await supabase
          .from('faq_documents')
          .update({ 
            processing_status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', document.id);

        // Update status to completed
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'completed', 
            progress: 100,
            faqCount: faqEntries.length
          } : f
        ));

        toast.success(`${file.name} processed successfully! Found ${faqEntries.length} FAQ entries.`);
        onUploadComplete();

      } catch (error: any) {
        console.error('Upload error:', error);
        
        // Update document status to failed if it was created
        try {
          await supabase
            .from('faq_documents')
            .update({ 
              processing_status: 'failed',
              error_message: error.message
            })
            .eq('chatbot_id', chatbotId)
            .eq('filename', file.name);
        } catch (updateError) {
          console.error('Failed to update document status:', updateError);
        }

        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'failed', 
            progress: 0,
            error: error.message 
          } : f
        ));
        toast.error(`Failed to process ${file.name}: ${error.message}`);
      }
    }
  }, [chatbotId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload FAQ Documents
        </h3>
        <p className="text-gray-600 mb-4">
          Upload your FAQ documents to train your chatbot with AI-powered processing. Supported formats: TXT, CSV, PDF (up to 10MB each).
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop files here, or <span className="text-blue-600 font-medium">browse</span>
              </p>
              <p className="text-sm text-gray-500">
                TXT, CSV, PDF files up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* AI Processing Info */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            AI-Powered Processing
          </h4>
          <p className="text-sm text-gray-700">
            Our AI will automatically extract questions and answers from your documents, 
            generate relevant keywords, and optimize them for intelligent responses.
          </p>
        </div>

        {/* Format Examples */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">TXT Format Example:</h4>
            <pre className="text-xs text-gray-600 bg-white p-2 rounded border">
{`Q: What are your business hours?
A: We're open Monday-Friday 9AM-6PM

Q: How can I contact support?
A: Email us at support@company.com`}
            </pre>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">CSV Format Example:</h4>
            <pre className="text-xs text-gray-600 bg-white p-2 rounded border">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Files
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.filename}</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            file.status === 'completed' ? 'bg-green-600' :
                            file.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{file.progress}%</span>
                    </div>
                    {file.status === 'completed' && file.faqCount && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {file.faqCount} FAQ entries extracted
                      </p>
                    )}
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'uploading' && (
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {file.status === 'processing' && (
                    <div className="flex items-center space-x-1">
                      <Loader className="w-5 h-5 text-orange-600 animate-spin" />
                      <span className="text-xs text-orange-600">AI Processing...</span>
                    </div>
                  )}
                  {file.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {file.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-red-600" />
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