'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, Film, Play, Clock, Zap } from 'lucide-react';

interface VideoUploadProps {
  movieId: string;
  movieTitle?: string;
  onUploadComplete?: (videoUrl: string) => void;
  onClose?: () => void;
}

interface UploadProgress {
  quality: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  uploadedBytes?: number;
  totalBytes?: number;
  uploadSpeed?: number;
  startTime?: number;
  estimatedTimeRemaining?: number;
}

export function VideoUpload({ movieId, movieTitle, onUploadComplete, onClose }: VideoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<{ [quality: string]: File }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [quality: string]: UploadProgress }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [videoSlug, setVideoSlug] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [quality: string]: HTMLInputElement | null }>({});

  interface VideoQualityOption {
    quality: string;
    label: string;
    maxSize: string;
    icon: string;
  }

  const videoQualities: VideoQualityOption[] = [
    { quality: '4k', label: '4K Ultra HD', maxSize: '10GB', icon: '4K' },
    { quality: '1080p', label: 'Full HD', maxSize: '5GB', icon: 'HD' },
    { quality: '720p', label: 'HD Ready', maxSize: '2GB', icon: 'HD' },
    { quality: '480p', label: 'Standard', maxSize: '1GB', icon: 'SD' },
  ];

  const handleFileSelect = (quality: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    setSelectedFiles((prev) => ({
      ...prev,
      [quality]: file,
    }));

    setUploadProgress((prev) => ({
      ...prev,
      [quality]: {
        quality,
        progress: 0,
        status: 'pending',
      },
    }));
  };

  const removeFile = (quality: string) => {
    setSelectedFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[quality];
      return newFiles;
    });

    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[quality];
      return newProgress;
    });
  };

  const uploadFile = async (quality: string, file: File) => {
    return new Promise<string>((resolve, reject) => {
      const startTime = Date.now();

      setUploadProgress((prev) => ({
        ...prev,
        [quality]: {
          ...prev[quality],
          status: 'uploading',
          progress: 0,
          uploadedBytes: 0,
          totalBytes: file.size,
          startTime,
          uploadSpeed: 0,
          estimatedTimeRemaining: 0,
        },
      }));

      fetch('/api/admin/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: movieId,
          movieTitle: movieTitle,
          quality,
          contentType: file.type,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to get upload URL');
          }
          return response.json();
        })
        .then(({ uploadUrl, videoUrl, videoSlug: slug }) => {
          if (slug && !videoSlug) {
            setVideoSlug(slug);
          }

          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              const currentTime = Date.now();
              const elapsedTime = (currentTime - startTime) / 1000;
              const uploadSpeed = event.loaded / elapsedTime;
              const remainingBytes = event.total - event.loaded;
              const estimatedTimeRemaining = remainingBytes / uploadSpeed;

              setUploadProgress((prev) => ({
                ...prev,
                [quality]: {
                  ...prev[quality],
                  progress,
                  uploadedBytes: event.loaded,
                  totalBytes: event.total,
                  uploadSpeed,
                  estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : 0,
                },
              }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress((prev) => ({
                ...prev,
                [quality]: {
                  ...prev[quality],
                  status: 'completed',
                  progress: 100,
                  url: videoUrl,
                  estimatedTimeRemaining: 0,
                },
              }));
              resolve(videoUrl);
            } else {
              throw new Error(`Upload failed: ${xhr.statusText}`);
            }
          });

          xhr.addEventListener('error', () => {
            throw new Error('Upload failed due to network error');
          });

          xhr.addEventListener('abort', () => {
            throw new Error('Upload was aborted');
          });

          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        })
        .catch((error) => {
          console.error(`Error uploading ${quality}:`, error);
          setUploadProgress((prev) => ({
            ...prev,
            [quality]: {
              ...prev[quality],
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed',
            },
          }));
          reject(error);
        });
    });
  };

  const handleUploadAll = async () => {
    if (Object.keys(selectedFiles).length === 0) {
      alert('Please select at least one video file');
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Object.entries(selectedFiles).map(([quality, file]) =>
        uploadFile(quality, file)
      );

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results.filter((result) => result.status === 'fulfilled');

      if (successfulUploads.length > 0 && onUploadComplete) {
        const primaryUrl = (successfulUploads[0] as PromiseFulfilledResult<string>).value;
        onUploadComplete(primaryUrl);
      }

      if (successfulUploads.length === results.length) {
        alert('All videos uploaded successfully!');
      } else {
        alert(`${successfulUploads.length}/${results.length} videos uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUploadSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0 || !isFinite(seconds)) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-netflix-red rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Upload Movie Videos</h1>
              <p className="text-white/60 text-sm">
                {movieTitle ? `"${movieTitle}"` : `Movie ID: ${movieId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            disabled={isUploading}
          >
            <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-8 space-y-8">
            {/* Upload Path Info */}
            <AnimatePresence>
              {(movieTitle || videoSlug) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                      <Upload className="w-4 h-4 text-netflix-red" />
                    </div>
                    <h3 className="text-white font-semibold">Upload Destination</h3>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 font-mono">
                    <div className="text-white/40 text-sm mb-1">Path:</div>
                    <div className="text-netflix-red text-sm break-all">
                      videos/
                      {videoSlug ||
                        (movieTitle
                          ? movieTitle
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, '')
                          : (movieId || 'unknown-movie')
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, ''))}
                      /{'{quality}'}.mp4
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Cards */}
            <div className="grid gap-6">
              {videoQualities.map(({ quality, label, maxSize, icon }, index) => (
                <motion.div
                  key={quality}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-netflix-red/50 transition-all duration-300">
                    {/* Quality Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{icon}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{label}</h3>
                          <p className="text-white/60 text-sm">Maximum file size: {maxSize}</p>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center space-x-2">
                        {uploadProgress[quality]?.status === 'completed' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-10 h-10 bg-netflix-red rounded-full flex items-center justify-center"
                          >
                            <CheckCircle className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                        {uploadProgress[quality]?.status === 'error' && (
                          <div className="w-10 h-10 bg-netflix-red/20 border border-netflix-red/50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-netflix-red" />
                          </div>
                        )}
                        {uploadProgress[quality]?.status === 'uploading' && (
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    {!selectedFiles[quality] ? (
                      /* Upload Drop Zone */
                      <div
                        onClick={() => fileInputRefs.current[quality]?.click()}
                        className="relative border-2 border-dashed border-white/20 hover:border-netflix-red/50 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group-hover:border-netflix-red/70"
                      >
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-netflix-red/20 transition-colors">
                            <Upload className="w-8 h-8 text-white/60 group-hover:text-netflix-red transition-colors" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-lg">
                              Drop {label} video here
                            </p>
                            <p className="text-white/60 text-sm mt-1">or click to browse files</p>
                          </div>
                          <div className="text-white/40 text-xs">
                            Supports MP4, MOV, AVI, MKV formats
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* File Preview */
                      <div className="space-y-4">
                        <div className="bg-black/30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                                <Play className="w-5 h-5 text-netflix-red" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {selectedFiles[quality].name}
                                </p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className="text-white/60 text-sm">
                                    {formatFileSize(selectedFiles[quality].size)}
                                  </span>
                                  {selectedFiles[quality].size > 2 * 1024 * 1024 * 1024 && (
                                    <span className="bg-netflix-red/20 border border-netflix-red/50 text-netflix-red text-xs px-2 py-1 rounded-full">
                                      Large file
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!isUploading && (
                              <button
                                onClick={() => removeFile(quality)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4 text-white/60 hover:text-white" />
                              </button>
                            )}
                          </div>

                          {/* Upload Progress */}
                          {uploadProgress[quality]?.status === 'uploading' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-6 space-y-4"
                            >
                              {/* Progress Bar */}
                              <div className="relative">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress[quality].progress}%` }}
                                    className="h-full bg-gradient-to-r from-netflix-red to-red-400 rounded-full relative"
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                  </motion.div>
                                </div>
                                <div className="absolute -top-8 right-0">
                                  <span className="bg-netflix-red text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {uploadProgress[quality].progress}%
                                  </span>
                                </div>
                              </div>

                              {/* Upload Stats */}
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                  <div className="flex items-center justify-center space-x-1 mb-1">
                                    <Zap className="w-3 h-3 text-netflix-red" />
                                    <span className="text-white/40 text-xs">Speed</span>
                                  </div>
                                  <div className="text-white text-sm font-medium">
                                    {formatUploadSpeed(uploadProgress[quality].uploadSpeed || 0)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center space-x-1 mb-1">
                                    <Clock className="w-3 h-3 text-netflix-red" />
                                    <span className="text-white/40 text-xs">ETA</span>
                                  </div>
                                  <div className="text-white text-sm font-medium">
                                    {formatTime(
                                      uploadProgress[quality].estimatedTimeRemaining || 0
                                    )}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white/40 text-xs mb-1">Progress</div>
                                  <div className="text-white text-sm font-medium">
                                    {formatFileSize(uploadProgress[quality].uploadedBytes || 0)} /{' '}
                                    {formatFileSize(uploadProgress[quality].totalBytes || 0)}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Error State */}
                          {uploadProgress[quality]?.status === 'error' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 p-4 bg-netflix-red/10 border border-netflix-red/30 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-netflix-red flex-shrink-0" />
                                <span className="text-netflix-red text-sm">
                                  {uploadProgress[quality].error}
                                </span>
                              </div>
                            </motion.div>
                          )}

                          {/* Success State */}
                          {uploadProgress[quality]?.status === 'completed' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-4 p-4 bg-netflix-red/10 border border-netflix-red/30 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-netflix-red flex-shrink-0" />
                                <span className="text-netflix-red text-sm font-medium">
                                  Upload completed successfully!
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      ref={(el) => {
                        fileInputRefs.current[quality] = el;
                      }}
                      type="file"
                      accept="video/*,.mkv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(quality, file);
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Global Progress */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-xl font-semibold">Overall Progress</h3>
                    <div className="text-white/60 text-sm">
                      {Object.values(uploadProgress).filter((p) => p.status === 'completed').length}{' '}
                      of {Object.keys(selectedFiles).length} completed
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-netflix-red via-red-500 to-netflix-red rounded-full transition-all duration-500"
                        style={{
                          width: `${(Object.values(uploadProgress).filter((p) => p.status === 'completed').length / Object.keys(selectedFiles).length) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-white/40 text-sm mb-1">Total Size</div>
                        <div className="text-white font-medium">
                          {formatFileSize(
                            Object.values(selectedFiles).reduce(
                              (total, file) => total + file.size,
                              0
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-sm mb-1">Avg Speed</div>
                        <div className="text-netflix-red font-medium">
                          {formatUploadSpeed(
                            Object.values(uploadProgress)
                              .filter((p) => p.status === 'uploading' && p.uploadSpeed)
                              .reduce((total, p) => total + (p.uploadSpeed || 0), 0) /
                              Math.max(
                                1,
                                Object.values(uploadProgress).filter(
                                  (p) => p.status === 'uploading'
                                ).length
                              )
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-sm mb-1">Time Remaining</div>
                        <div className="text-white font-medium">
                          {formatTime(
                            Math.max(
                              ...Object.values(uploadProgress)
                                .filter((p) => p.status === 'uploading')
                                .map((p) => p.estimatedTimeRemaining || 0)
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-8">
          <div className="flex items-center justify-between">
            <div className="text-white/60">
              {Object.keys(selectedFiles).length} file
              {Object.keys(selectedFiles).length !== 1 ? 's' : ''} selected
              {isUploading && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3 inline-flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
                  <span className="text-netflix-red font-medium">Uploading...</span>
                </motion.span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200"
                disabled={isUploading}
              >
                {isUploading ? 'Close when done' : 'Cancel'}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUploadAll}
                disabled={Object.keys(selectedFiles).length === 0 || isUploading}
                className="bg-netflix-red hover:bg-red-700 disabled:bg-white/10 disabled:text-white/40 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
              >
                <Upload className="w-5 h-5" />
                <span>{isUploading ? 'Uploading...' : 'Start Upload'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
