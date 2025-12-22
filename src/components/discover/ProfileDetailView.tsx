import { useState } from 'react';
import { X, Heart, MapPin, Camera, ChevronLeft, ChevronRight, Shield, Flag, Fish, Trophy, Anchor, CheckCircle, Ruler, Wine, Cigarette, GraduationCap, Briefcase, Star, Brain, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProfilePrompt } from '@/components/profile';

export interface ProfileDetailData {
  id: string;
  name: string;
  age: number;
  location: string;
  distance: string;
  bio: string;
  photos: string[];
  isVerified?: boolean;
  isActive?: boolean;
  height?: string;
  heightCm?: number;
  smoker?: string;
  drinker?: string;
  education?: string;
  occupation?: string;
  zodiacSign?: string;
  personalityType?: string;
  targetSpecies?: string;
  bestCatch?: string;
  ride?: string;
  interests?: string[];
  promptResponses?: ProfilePrompt[];
}

interface ProfileDetailViewProps {
  profile: ProfileDetailData;
  onClose: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onLike: () => void;
}

export function ProfileDetailView({ profile, onClose, onPass, onSuperLike, onLike }: ProfileDetailViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    if (currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const formatHeight = (cm?: number) => {
    if (!cm) return profile.height || null;
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${feet}'${inches}"`;
  };

  const hasLifestyleInfo = profile.drinker || profile.smoker || profile.zodiacSign || profile.personalityType;
  const hasBasicsInfo = profile.heightCm || profile.education || profile.occupation;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bold text-lg">FindFish Date</span>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <span className="text-primary font-medium flex items-center gap-1">
                <Heart className="h-4 w-4 fill-primary" /> Discover
              </span>
              <span className="text-muted-foreground">Matches</span>
              <span className="text-muted-foreground">Messages</span>
              <span className="text-muted-foreground">Profile</span>
            </nav>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Back to Stack
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Top Section - Photo + Info Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Main Photo */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            <img
              src={profile.photos[currentPhotoIndex]}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Navigation */}
            {profile.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  disabled={currentPhotoIndex === profile.photos.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Photo Count Badge */}
            <div className="absolute bottom-3 left-3 bg-foreground/80 text-background px-3 py-1 rounded-full text-sm flex items-center gap-1.5">
              <Camera className="h-4 w-4" />
              {profile.photos.length} Photos
            </div>
          </div>

          {/* Info Card */}
          <div className="space-y-4">
            <div className="bg-background border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.name}, {profile.age}</h1>
                    {profile.isVerified && (
                      <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.distance}</span>
                  </div>
                </div>
                {profile.isActive && (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                    Active
                  </Badge>
                )}
              </div>

              {/* Stats - Height, Smoker, Drinker */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="text-center">
                  <p className="font-semibold">{formatHeight(profile.heightCm) || '—'}</p>
                  <p className="text-xs text-muted-foreground uppercase">Height</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold capitalize">{profile.smoker || '—'}</p>
                  <p className="text-xs text-muted-foreground uppercase">Smoker</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold capitalize">{profile.drinker || '—'}</p>
                  <p className="text-xs text-muted-foreground uppercase">Drinker</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full border-2"
                  onClick={onPass}
                >
                  <X className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-primary/20 hover:bg-primary/30 text-primary"
                  onClick={onSuperLike}
                >
                  <Fish className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={onLike}
                >
                  <Heart className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Verification Notice */}
            {profile.isVerified && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary text-sm">Catch with Confidence</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.name}'s profile is verified. Remember to stay safe and meet in public places for your first date.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="bg-background border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">👋</span> About {profile.name}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
        </div>

        {/* The Basics & Lifestyle */}
        {(hasBasicsInfo || hasLifestyleInfo) && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* The Basics */}
            {hasBasicsInfo && (
              <div className="bg-background border border-border rounded-2xl p-6">
                <h2 className="font-semibold mb-4">The Basics</h2>
                <div className="space-y-3">
                  {profile.heightCm && (
                    <div className="flex items-center gap-3">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatHeight(profile.heightCm)}</span>
                    </div>
                  )}
                  {profile.education && (
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.education}</span>
                    </div>
                  )}
                  {profile.occupation && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.occupation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {hasLifestyleInfo && (
              <div className="bg-background border border-border rounded-2xl p-6">
                <h2 className="font-semibold mb-4">Lifestyle</h2>
                <div className="space-y-3">
                  {profile.drinker && (
                    <div className="flex items-center gap-3">
                      <Wine className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{profile.drinker === 'never' ? 'Non-drinker' : `Drinks ${profile.drinker}`}</span>
                    </div>
                  )}
                  {profile.smoker && (
                    <div className="flex items-center gap-3">
                      <Cigarette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{profile.smoker === 'never' ? 'Non-smoker' : `Smokes ${profile.smoker}`}</span>
                    </div>
                  )}
                  {profile.zodiacSign && (
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.zodiacSign}</span>
                    </div>
                  )}
                  {profile.personalityType && (
                    <div className="flex items-center gap-3">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{profile.personalityType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Prompts */}
        {profile.promptResponses && profile.promptResponses.length > 0 && (
          <div className="mb-6 space-y-4">
            {profile.promptResponses.filter(p => p.answer).map((prompt, index) => (
              <Card key={index}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-primary">{prompt.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">{prompt.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fishing Stats */}
        {(profile.targetSpecies || profile.bestCatch || profile.ride) && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {profile.targetSpecies && (
              <div className="bg-background border border-border rounded-2xl p-4 text-center">
                <Fish className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-primary uppercase font-medium mb-1">Target Species</p>
                <p className="font-semibold text-sm">{profile.targetSpecies}</p>
              </div>
            )}
            {profile.bestCatch && (
              <div className="bg-background border border-border rounded-2xl p-4 text-center">
                <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-primary uppercase font-medium mb-1">Best Catch</p>
                <p className="font-semibold text-sm">{profile.bestCatch}</p>
              </div>
            )}
            {profile.ride && (
              <div className="bg-background border border-border rounded-2xl p-4 text-center">
                <Anchor className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-primary uppercase font-medium mb-1">My Ride</p>
                <p className="font-semibold text-sm">{profile.ride}</p>
              </div>
            )}
          </div>
        )}

        {/* Additional Photos */}
        {profile.photos.length > 1 && (
          <div className="mb-6">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted mb-4">
              <img
                src={profile.photos[1] || profile.photos[0]}
                alt="Photo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="bg-background border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Interests & Hobbies</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary" className="px-4 py-2 font-medium">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* More Photos Grid */}
        {profile.photos.length > 2 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {profile.photos.slice(2).map((photo, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-muted">
                <img src={photo} alt={`Photo ${idx + 3}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Report Link */}
        <div className="text-center pb-8">
          <button className="text-muted-foreground text-sm flex items-center gap-2 mx-auto hover:text-foreground transition-colors">
            <Flag className="h-4 w-4" />
            Report {profile.name}'s Profile
          </button>
        </div>
      </main>
    </div>
  );
}
