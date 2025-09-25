'use client';

import { Edit, Eye, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

interface SeriesCardProps {
  series: {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    backdropUrl?: string;
    releaseYear: number;
    isPublished: boolean;
    seasons: any[];
  };
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
  onView: (series: any) => void;
  onUpload: (series: any) => void;
  onEdit: (series: any) => void;
}

export function SeriesCard({
  series,
  onDelete,
  onUpdate,
  onView,
  onUpload,
  onEdit,
}: SeriesCardProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(series.isPublished);

  const handlePublishToggle = async () => {
    const newStatus = !isPublished;
    setIsPublished(newStatus);
    await onUpdate(series.id, { isPublished: newStatus });
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this series?')) {
      onDelete(series.id);
    }
  };

  return (
    <div className="group relative">
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-netflix-red/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/50">
        {/* Series Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={
              series.backdropUrl ||
              series.coverUrl ||
              'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop'
            }
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                series.isPublished ? 'bg-netflix-red text-white' : 'bg-white/20 text-white/60'
              }`}
            >
              {series.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>

          {/* Poster Thumbnail */}
          {series.coverUrl && (
            <div className="absolute left-4 top-4 w-16 h-24 shadow-xl rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
              <img
                src={series.coverUrl}
                alt={series.title + ' poster'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <button
              onClick={() => onView(series)}
              className="bg-white/90 hover:bg-white text-black p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
              title="View Series"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEdit(series)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
              title="Edit Series"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => onUpload(series)}
              className="bg-netflix-red hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
              title="Upload Episodes"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDelete(series.id)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
              title="Delete Series"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Series Info */}
        <div className="p-6">
          <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{series.title}</h3>

          <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
            <div className="flex items-center space-x-1">
              <span>{series.releaseYear}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{series.seasons?.length || 0} seasons</span>
            </div>
          </div>

          <p className="text-white/60 text-sm line-clamp-2">{series.description}</p>
        </div>
      </div>
    </div>
  );
}
