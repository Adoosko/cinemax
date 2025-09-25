'use client';

import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import EditSeriesModal from '../../../components/admin/edit-series-modal';
import { SeriesCard } from './series-card';
import { SeriesUpload } from './series-upload';

import { AlertCircle, Film, Plus } from 'lucide-react';

interface Series {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  backdropUrl: string;
  releaseYear: number;
  isPublished: boolean;
  genres: string[];
  cast: string[];
  rating?: number;
  seasons: any[];
}

export function SeriesAdminClient({ initialSeries = [] }: { initialSeries?: Series[] }) {
  const [series, setSeries] = useState<Series[]>(initialSeries);
  const [loading, setLoading] = useState(initialSeries.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSeriesForUpload, setSelectedSeriesForUpload] = useState<string | null>(null);
  const [selectedSeriesTitleForUpload, setSelectedSeriesTitleForUpload] = useState<string | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSeriesForEdit, setSelectedSeriesForEdit] = useState<Series | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddSeriesModal, setShowAddSeriesModal] = useState(false);

  useEffect(() => {
    // Only fetch series if we don't have initial series
    if (initialSeries.length === 0) {
      fetchSeries();
    }
  }, [initialSeries.length]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/series');
      const data = await response.json();

      if (data.series) {
        setSeries(data.series);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeries = async (seriesData: any) => {
    try {
      const response = await fetch('/api/admin/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seriesData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Series added successfully');
        fetchSeries();
      } else {
        toast.error(data.error || 'Failed to add series');
      }
    } catch (error) {
      console.error('Error adding series:', error);
      toast.error('Failed to add series');
    }
  };

  const handleDeleteSeries = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/series/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Series deleted successfully');
        setSeries(series.filter((s) => s.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete series');
      }
    } catch (error) {
      console.error('Error deleting series:', error);
      toast.error('Failed to delete series');
    }
  };

  const handleUpdateSeries = async (id: string, updatedData: any) => {
    try {
      const response = await fetch(`/api/admin/series/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Series updated successfully');
        fetchSeries();
      } else {
        toast.error(data.error || 'Failed to update series');
      }
    } catch (error) {
      console.error('Error updating series:', error);
      toast.error('Failed to update series');
    }
  };

  const handleViewSeries = (series: Series) => {
    // Open series in new tab
    window.open(`/series/${series.title.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
  };

  const stats = {
    total: series.length,
    published: series.filter((s) => s.isPublished).length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Series Management</h1>
          <p className="text-white/60">Manage your series catalog and content</p>
        </div>
        <button
          onClick={() => setShowAddSeriesModal(true)}
          className="bg-netflix-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
        >
          <Plus className="w-5 h-5" />
          <span>Add Series</span>
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-netflix-red text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-current rounded-sm" />
              ))}
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-netflix-red text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="w-4 h-4 flex flex-col space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-current h-0.5 rounded" />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden animate-pulse"
            >
              {/* Skeleton Image */}
              <div className="aspect-video bg-white/5"></div>

              {/* Skeleton Content */}
              <div className="p-6 space-y-3">
                <div className="h-6 bg-white/5 rounded-lg w-3/4"></div>
                <div className="flex space-x-2">
                  <div className="h-4 bg-white/5 rounded-full w-16"></div>
                  <div className="h-4 bg-white/5 rounded-full w-12"></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <div className="h-6 bg-white/5 rounded-full w-14"></div>
                  <div className="h-6 bg-white/5 rounded-full w-16"></div>
                  <div className="h-6 bg-white/5 rounded-full w-12"></div>
                </div>
                <div className="h-4 bg-white/5 rounded-lg w-full"></div>
                <div className="h-4 bg-white/5 rounded-lg w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 text-xl font-semibold mb-2">Error Loading Series</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={fetchSeries}
            className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Series Content */}
      {!loading && !error && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-white/60">{series.length} series</div>
          </div>

          {series.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Film className="w-12 h-12 text-white/40" />
              </div>
              <h3 className="text-white text-2xl font-semibold mb-2">No series found</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Start building your series catalog
              </p>
              <button
                onClick={() => setShowAddSeriesModal(true)}
                className="bg-netflix-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center space-x-3 mx-auto shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Series</span>
              </button>
            </div>
          ) : (
            /* Series Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {series.map((item) => (
                <SeriesCard
                  key={item.id}
                  series={item}
                  onDelete={handleDeleteSeries}
                  onUpdate={handleUpdateSeries}
                  onView={handleViewSeries}
                  onUpload={(series) => {
                    setSelectedSeriesForUpload(series.id);
                    setSelectedSeriesTitleForUpload(series.title);
                    setShowUploadModal(true);
                  }}
                  onEdit={(series) => {
                    setSelectedSeriesForEdit(series);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && selectedSeriesForUpload && (
          <SeriesUpload
            seriesId={selectedSeriesForUpload}
            seriesTitle={selectedSeriesTitleForUpload || ''}
            onClose={() => {
              setShowUploadModal(false);
              setSelectedSeriesForUpload(null);
              setSelectedSeriesTitleForUpload(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Series Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditSeriesModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedSeriesForEdit(null);
            }}
            onUpdateSeries={async (seriesData) => {
              if (selectedSeriesForEdit) {
                await handleUpdateSeries(selectedSeriesForEdit.id, seriesData);
                setShowEditModal(false);
                setSelectedSeriesForEdit(null);
              }
            }}
            series={selectedSeriesForEdit || undefined}
            isNew={false}
          />
        )}
      </AnimatePresence>

      {/* Add Series Modal */}
      <AnimatePresence>
        {showAddSeriesModal && (
          <EditSeriesModal
            isOpen={showAddSeriesModal}
            onClose={() => setShowAddSeriesModal(false)}
            onUpdateSeries={async (seriesData) => {
              try {
                const response = await fetch('/api/admin/series', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(seriesData),
                });

                const data = await response.json();

                if (data.success) {
                  toast.success('Series added successfully');
                  fetchSeries();
                  setShowAddSeriesModal(false);
                } else {
                  toast.error(data.error || 'Failed to add series');
                }
              } catch (error) {
                console.error('Error adding series:', error);
                toast.error('Failed to add series');
              }
            }}
            isNew={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
