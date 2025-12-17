import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fish, User, Heart, Sparkles, Sun, Sailboat, Footprints, Mountain, Utensils } from "lucide-react";

interface StepPreferenceSyncProps {
  fishingImportance: number;
  setFishingImportance: (value: number) => void;
  myStyle: string;
  setMyStyle: (value: string) => void;
  theirStyle: string;
  setTheirStyle: (value: string) => void;
  myPace: 'relaxed' | 'intense';
  setMyPace: (value: 'relaxed' | 'intense') => void;
  theirPace: 'relaxed' | 'intense';
  setTheirPace: (value: 'relaxed' | 'intense') => void;
  comboActivities: string[];
  setComboActivities: (value: string[]) => void;
}

const styleOptions = [
  { value: 'weekend_warrior', label: 'Weekend Warrior' },
  { value: 'casual_angler', label: 'Casual Angler' },
  { value: 'tournament_fisher', label: 'Tournament Fisher' },
  { value: 'relaxed_hobbyist', label: 'Relaxed Hobbyist' },
];

const skillOptions = [
  { value: 'any', label: 'Any Skill Level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const comboActivityOptions = [
  { id: 'morning_cast', label: 'Morning Cast', icon: Sun },
  { id: 'boat_trip', label: 'Boat Trip', icon: Sailboat },
  { id: 'hike_and_fish', label: 'Hike & Fish', icon: Footprints },
  { id: 'weekend_camp', label: 'Weekend Camp', icon: Mountain },
  { id: 'catch_and_cook', label: 'Catch & Cook', icon: Utensils },
];

const importanceLabels = ['Nice to have', 'A Big Plus', 'Non-negotiable'];

export function StepPreferenceSync({
  fishingImportance,
  setFishingImportance,
  myStyle,
  setMyStyle,
  theirStyle,
  setTheirStyle,
  myPace,
  setMyPace,
  theirPace,
  setTheirPace,
  comboActivities,
  setComboActivities,
}: StepPreferenceSyncProps) {
  const toggleActivity = (id: string) => {
    if (comboActivities.includes(id)) {
      setComboActivities(comboActivities.filter((a) => a !== id));
    } else {
      setComboActivities([...comboActivities, id]);
    }
  };

  const getImportanceLabel = () => {
    if (fishingImportance <= 33) return importanceLabels[0];
    if (fishingImportance <= 66) return importanceLabels[1];
    return importanceLabels[2];
  };

  return (
    <div className="space-y-8">
      {/* Fishing Compatibility */}
      <div className="p-6 rounded-2xl border border-border bg-background">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Fishing Compatibility</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {getImportanceLabel()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          How important is it that your partner fishes?
        </p>
        <Slider
          value={[fishingImportance]}
          onValueChange={(value) => setFishingImportance(value[0])}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {importanceLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      {/* Your Style vs Their Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Style */}
        <div className="p-6 rounded-2xl border border-border bg-background">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Your Style</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">I consider myself a...</Label>
              <Select value={myStyle} onValueChange={setMyStyle}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select your style" />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">My preferred pace is...</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['relaxed', 'intense'] as const).map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setMyPace(pace)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all duration-200 ${
                      myPace === pace
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50 text-foreground'
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Their Style */}
        <div className="p-6 rounded-2xl border border-border bg-background">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Their Style</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Looking for someone who is...</Label>
              <Select value={theirStyle} onValueChange={setTheirStyle}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select their style" />
                </SelectTrigger>
                <SelectContent>
                  {skillOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">They should enjoy...</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['relaxed', 'intense'] as const).map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setTheirPace(pace)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all duration-200 ${
                      theirPace === pace
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50 text-foreground'
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Combo Activities */}
      <div className="p-6 rounded-2xl border border-border bg-background">
        <div className="flex items-center gap-2 mb-2">
          <Sailboat className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Preferred Combo Activities</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select the activities you'd love to do on a date.
        </p>
        <div className="flex flex-wrap gap-3">
          {comboActivityOptions.map((activity) => {
            const Icon = activity.icon;
            const isSelected = comboActivities.includes(activity.id);

            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => toggleActivity(activity.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{activity.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synergy Info */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">Synergy Detected: "The Early Birds"</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on your preferences, we'll prioritize matches who love early mornings and relaxed boat trips. Your "Combo" potential is high!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
