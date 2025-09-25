'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, Check } from 'lucide-react';

interface SeriesUploadProps {
  seriesId: string;
  seriesTitle: string;
  onClose: () => void;
}

interface Season {
  id: string;
  number: number;
  title: string;
}

interface Episode {
  id: string;
  number: number;
  title: string;
  seasonId: string;
  videoUrl?: string;
}

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

export function SeriesUpload({ seriesId, seriesTitle, onClose }: SeriesUploadProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedEpisode, setSelectedEpisode] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
    message: '',
  });

  useEffect(() => {
    fetchSeriesDetails();
  }, [seriesId]);

  useEffect(() => {
    if (selectedSeason) {
      const seasonEpisodes = episodes.filter((ep) => ep.seasonId === selectedSeason);
      if (seasonEpisodes.length > 0 && !selectedEpisode) {
        setSelectedEpisode(seasonEpisodes[0].id);
      } else if (seasonEpisodes.length === 0) {
        setSelectedEpisode('');
      }
    } else {
      setSelectedEpisode('');
    }
  }, [selectedSeason, episodes]);

  const fetchSeriesDetails = async () => {
    try {
      const response = await fetch(`/api/admin/series/${seriesId}`);
      const data = await response.json();

      if (data.series) {
        const allSeasons: Season[] = data.series.seasons.map((season: any) => ({
          id: season.id,
          number: season.number,
          title: `Season ${season.number}${season.title ? `: ${season.title}` : ''}`,
        }));

        const allEpisodes: Episode[] = [];
        data.series.seasons.forEach((season: any) => {
          season.episodes.forEach((episode: any) => {
            allEpisodes.push({
              id: episode.id,
              number: episode.number,
              title: episode.title,
              seasonId: season.id,
              videoUrl: episode.videoUrl,
            });
          });
        });

        setSeasons(allSeasons);
        setEpisodes(allEpisodes);

        if (allSeasons.length > 0) {
          setSelectedSeason(allSeasons[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching series details:', error);
      toast.error('Failed to load series details');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadToS3 = async (file: File, path: string): Promise<string> => {
    // This would be implemented with your S3 upload logic
    // For now, we'll simulate the upload process
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress((prev) => ({
          ...prev,
          progress,
        }));

        if (progress >= 100) {
          clearInterval(interval);
          // Return a simulated S3 URL
          const fileExtension = file.name.split('.').pop();
          resolve(
            `https://your-bucket-name.s3.amazonaws.com/series/${seriesId}/${path}.${fileExtension}`
          );
        }
      }, 300);
    });
  };

  const handleUpload = async () => {
    if (!selectedSeason || !selectedEpisode || !selectedFile) {
      toast.error('Please select a season, episode, and file');
      return;
    }

    try {
      setUploadProgress({
        progress: 0,
        status: 'uploading',
        message: 'Uploading episode...',
      });

      const selectedSeasonObj = seasons.find((s) => s.id === selectedSeason);
      const selectedEpisodeObj = episodes.find((e) => e.id === selectedEpisode);

      if (!selectedSeasonObj || !selectedEpisodeObj) {
        throw new Error('Season or episode not found');
      }

      // Create the path for the file: series-name/episode-name/1.mp4
      const seriesSlug = seriesTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const episodeSlug = selectedEpisodeObj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filePath = `${seriesSlug}/${episodeSlug}/${selectedEpisodeObj.number}`;

      // Upload to S3 (simulated)
      const videoUrl = await uploadToS3(selectedFile, filePath);

      // Update the episode with the video URL
      const response = await fetch('/api/admin/series/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seriesId,
          seasonNumber: selectedSeasonObj.number,
          episodeNumber: selectedEpisodeObj.number,
          videoUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress({
          progress: 100,
          status: 'success',
          message: 'Upload completed successfully!',
        });
        toast.success('Episode uploaded successfully');

        // Refresh the series details
        fetchSeriesDetails();

        // Reset the form
        setSelectedFile(null);

        // Reset the file input
        const fileInput = document.getElementById('episode-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        throw new Error(data.error || 'Failed to update episode');
      }
    } catch (error) {
      console.error('Error uploading episode:', error);
      setUploadProgress({
        progress: 0,
        status: 'error',
        message: 'Upload failed. Please try again.',
      });
      toast.error('Failed to upload episode');
    }
  };

  const getEpisodeStatusIcon = (episode: Episode) => {
    if (episode.videoUrl) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Season</label>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger>
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Episode</label>
          <Select
            value={selectedEpisode}
            onValueChange={setSelectedEpisode}
            disabled={
              !selectedSeason || episodes.filter((e) => e.seasonId === selectedSeason).length === 0
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an episode" />
            </SelectTrigger>
            <SelectContent>
              {episodes
                .filter((episode) => episode.seasonId === selectedSeason)
                .map((episode) => (
                  <SelectItem key={episode.id} value={episode.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {episode.number}. {episode.title}
                      </span>
                      {getEpisodeStatusIcon(episode)}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Upload Video File</label>
        <div className="flex items-center space-x-4">
          <input
            id="episode-file"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadProgress.status === 'uploading'}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {uploadProgress.status !== 'idle' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">{uploadProgress.message}</span>
            <span className="text-sm font-medium">{uploadProgress.progress}%</span>
          </div>
          <Progress value={uploadProgress.progress} />
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
