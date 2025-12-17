import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Fish, Heart, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";

type AccountMode = 'dating' | 'fishing' | 'both';

interface ModeOption {
  value: AccountMode;
  label: string;
  description: string;
  icon: typeof Fish;
  iconBg: string;
  recommended?: boolean;
}

const modeOptions: ModeOption[] = [
  {
    value: 'fishing',
    label: 'Fishing Spots Only',
    description: 'Strictly business. Find the best local spots, check weather conditions, and log your catches without the romance.',
    icon: MapPin,
    iconBg: 'bg-primary/10 text-primary',
  },
  {
    value: 'dating',
    label: 'Dating Only',
    description: 'Cast your line for love. Connect with singles who share your passion for the outdoors and fishing lifestyle.',
    icon: Heart,
    iconBg: 'bg-pink-100 text-pink-500',
  },
  {
    value: 'both',
    label: 'Combo Mode',
    description: "The full experience. Seamlessly toggle between finding hot spots and hot dates. Why choose when you can have both?",
    icon: Fish,
    iconBg: 'bg-green-100 text-green-600',
    recommended: true,
  },
];

export default function OnboardingSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<AccountMode>('both');
  const [saving, setSaving] = useState(false);

  const handleChooseMode = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_mode: selectedMode })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Mode selected!",
        description: `You're all set with ${selectedMode === 'both' ? 'Combo' : selectedMode === 'dating' ? 'Dating' : 'Fishing'} mode.`,
      });

      navigate('/app/discover');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">FindFish Date</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-foreground text-sm">Captain Jack</p>
            <p className="text-xs text-muted-foreground">Profile ID: #8821</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Progress Card */}
        <div className="bg-background rounded-2xl p-6 border border-border">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-semibold text-foreground">Onboarding Complete</h2>
              <p className="text-sm text-muted-foreground">Your tackle box is packed!</p>
            </div>
            <span className="text-primary font-bold">100%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-full" />
          </div>
        </div>

        {/* Success Hero */}
        <div className="bg-background rounded-2xl p-8 border border-border overflow-hidden relative">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                You're <span className="text-primary">Hooked Up!</span>
              </h1>
              <p className="text-muted-foreground">
                Thanks for joining FindFish Date. Your profile is rigged and ready to go. You are now part of our community of anglers and singles.
              </p>
              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleChooseMode}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? 'Saving...' : 'Choose Your Mode'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/app/profile')}
                >
                  View Profile
                </Button>
              </div>
            </div>
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-primary/5 border-4 border-primary/20 flex items-center justify-center overflow-hidden">
              <div className="text-8xl">🐟</div>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Next Steps</h2>
            <p className="text-muted-foreground">
              Decide how you want to use the app today. Don't worry, you can switch modes anytime from the settings menu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modeOptions.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.value;

              return (
                <button
                  key={mode.value}
                  onClick={() => setSelectedMode(mode.value)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 bg-background ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {mode.recommended && (
                    <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                      RECOMMENDED
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mode.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{mode.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit Profile Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/app/profile/edit')}
            className="text-sm text-primary hover:underline"
          >
            Need to change something? Edit Profile
          </button>
        </div>
      </main>
    </div>
  );
}
