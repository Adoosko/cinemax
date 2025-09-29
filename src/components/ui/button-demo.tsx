'use client';

import { Check, Film, Play, Plus, Star } from 'lucide-react';
import React from 'react';
import { Button } from './button';

export function ButtonDemo() {
  const [loading, setLoading] = React.useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 bg-black/95 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">CINEMX Button Component</h1>

      {/* Button Variants */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default Button</Button>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
          <Button variant="glass">Glass Button</Button>
          <Button variant="premium">Premium Button</Button>
          <Button variant="destructive">Destructive Button</Button>
        </div>
      </div>

      {/* Button Sizes */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="default">
            Default
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" size="xl">
            Extra Large
          </Button>
        </div>
      </div>

      {/* Icon Buttons */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Icon Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="icon">
            <Film />
          </Button>
          <Button variant="outline" size="icon">
            <Star />
          </Button>
          <Button variant="glass" size="icon">
            <Play />
          </Button>
          <Button variant="default" size="icon-sm">
            <Plus />
          </Button>
        </div>
      </div>

      {/* Buttons with Icons */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">
            <Play className="mr-1" /> Play Now
          </Button>
          <Button variant="outline">
            <Plus className="mr-1" /> Add to List
          </Button>
          <Button variant="secondary">
            <Film className="mr-1" /> View Details
          </Button>
        </div>
      </div>

      {/* Loading State */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Loading State</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            isLoading={loading}
            loadingText="Loading..."
            onClick={handleLoadingClick}
          >
            Click to Load
          </Button>
          <Button variant="outline" isLoading={true}>
            Processing...
          </Button>
        </div>
      </div>

      {/* Animated Buttons */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Animated Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" withAnimation>
            Animated Button
          </Button>
          <Button variant="premium" withAnimation>
            Premium Animated
          </Button>
          <Button variant="outline" withAnimation>
            <Check className="mr-1" /> With Animation
          </Button>
        </div>
      </div>

      {/* Disabled State */}
      <div className="space-y-4">
        <h2 className="text-xl text-white/80 font-medium">Disabled State</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" disabled>
            Disabled Button
          </Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
        </div>
      </div>
    </div>
  );
}
