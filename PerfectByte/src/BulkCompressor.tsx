import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToWebp } from './compressionService';
import { addHistoryEntry, getHistoryStats } from './historyService';

interface CompressedFile {
  name: string;
  url: string;
  originalSize: number;
  compressedSize: number;
}

export default function BulkCompressor() {
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState(() => getHistoryStats());

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    // Clean up old object URLs to prevent memory leaks
    compressedFiles.forEach(file => URL.revokeObjectURL(file.url));

    try {
      const results: CompressedFile[] = [];

      // Process files sequentially using a for...of loop
      for (const file of files) {
        try {
          const blob = await compressToWebp(file);
          results.push({
            name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            url: URL.createObjectURL(blob),
            originalSize: file.size,
            compressedSize: blob.size,
          });
          addHistoryEntry({
            fileName: file.name,
            originalSize: file.size,
            compressedSize: blob.size,
          });
        } catch (fileError) {
          // If one image fails, log it but don't stop the whole batch
          console.error(`Failed to compress ${file.name}:`, fileError);
        }
      }

      setCompressedFiles(results);
      setStats(getHistoryStats());

      if (results.length === 0) {
        alert("Failed to compress the selected images.");
      }

    } catch (error) {
      console.error("Error during bulk compression:", error);
      alert("A critical error occurred during compression.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to format bytes into readable KB/MB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Link to="/" className="mb-8 text-blue-500 hover:underline self-start max-w-4xl w-full mx-auto">
        &larr; Back to Home
      </Link>

      <div className="bg-white p-10 rounded-lg shadow-sm border border-gray-100 max-w-4xl w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Bulk Compress</h2>

        <div className="flex flex-col gap-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-center text-xs text-gray-400 mt-2 pointer-events-none">
              {isDragging ? 'Drop your images here' : 'or drag and drop images anywhere in this box'}
            </p>
          </div>

          <button
            onClick={handleCompress}
            disabled={isProcessing || files.length === 0}
            className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Compressing...' : `Compress ${files.length} Image${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Results Section */}
        {compressedFiles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Results</h3>
            <div className="space-y-3">
              {compressedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{file.name}</span>
                    <span className="text-sm text-gray-500">
                      {formatBytes(file.originalSize)} &rarr; <span className="text-green-600 font-medium">{formatBytes(file.compressedSize)}</span>
                    </span>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.count > 0 && (
          <p className="text-xs text-gray-400 text-center mt-6">
            {formatBytes(stats.totalOriginal - stats.totalCompressed)} saved across {stats.count} image{stats.count !== 1 ? 's' : ''} so far
          </p>
        )}
      </div>
    </div>
  );
}
