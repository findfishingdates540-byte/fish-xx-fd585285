import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, LogOut, Plus, Check, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface EnteredSpot {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  created_at: string;
}

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Parse DMS coordinates like "24° 54.450'N" or "80° 31.490'W"
function parseDMS(input: string): number | null {
  const trimmed = input.trim();
  // Try plain decimal first
  const decimal = parseFloat(trimmed);
  if (!isNaN(decimal) && /^-?\d+(\.\d+)?$/.test(trimmed)) return decimal;

  // DMS pattern: 24° 54.450'N or 24°54.450'N
  const match = trimmed.match(/(\d+)[°]\s*(\d+(?:\.\d+)?)[''′]?\s*([NSEW])?/i);
  if (match) {
    const degrees = parseFloat(match[1]);
    const minutes = parseFloat(match[2]);
    const dir = match[3]?.toUpperCase();
    let result = degrees + minutes / 60;
    if (dir === 'S' || dir === 'W') result = -result;
    return parseFloat(result.toFixed(6));
  }
  return null;
}

export default function SpotEntry() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Spot form
  const [siteNumber, setSiteNumber] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [locationName, setLocationName] = useState('');
  const [county, setCounty] = useState('');
  const [primaryMaterial, setPrimaryMaterial] = useState('');
  const [tons, setTons] = useState('');
  const [reliefFt, setReliefFt] = useState('');
  const [depthFt, setDepthFt] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [coast, setCoast] = useState('');
  const [deployDate, setDeployDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentSpots, setRecentSpots] = useState<EnteredSpot[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkDataEntryRole(session.user.id);
      } else {
        setHasAccess(false);
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkDataEntryRole(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkDataEntryRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'data_entry')
      .maybeSingle();

    setHasAccess(!!data);
    setAuthLoading(false);

    if (data) loadRecentSpots(userId);
  };

  const loadRecentSpots = async (userId: string) => {
    const { data } = await supabase
      .from('fishing_spots')
      .select('id, name, location_lat, location_lng, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setRecentSpots(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch {
      toast({ title: 'Invalid credentials', variant: 'destructive' });
      return;
    }

    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);

    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasAccess(false);
  };

  const handleSubmitSpot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({ title: 'Description is required', variant: 'destructive' });
      return;
    }

    const lat = parseDMS(latInput);
    const lng = parseDMS(lngInput);

    if (lat === null || lng === null) {
      toast({ title: 'Invalid coordinates', description: 'Enter decimal or DMS format (e.g. 24° 54.450\'N)', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const spotName = siteNumber ? `Site ${siteNumber} - ${description}` : description;

    const { error } = await supabase.from('fishing_spots').insert({
      name: spotName,
      description: fullDescription || description,
      location_lat: lat,
      location_lng: lng,
      location_name: locationName || null,
      county: county || null,
      primary_material: primaryMaterial || null,
      tons: tons ? parseFloat(tons) : null,
      relief_ft: reliefFt ? parseFloat(reliefFt) : null,
      depth_ft: depthFt ? parseFloat(depthFt) : null,
      jurisdiction: jurisdiction || null,
      coast: coast || null,
      deploy_date: deployDate || null,
      created_by: user.id,
      is_public: !isPrivate,
      is_verified: false,
      area_type: 'saltwater',
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Failed to add spot', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Spot added!', description: spotName });
      setSiteNumber('');
      setDescription('');
      setFullDescription('');
      setLatInput('');
      setLngInput('');
      setLocationName('');
      setCounty('');
      setPrimaryMaterial('');
      setTons('');
      setReliefFt('');
      setDepthFt('');
      setJurisdiction('');
      setCoast('');
      setDeployDate('');
      loadRecentSpots(user.id);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="FishX" className="h-12 w-auto mx-auto mb-4" />
            <div className="p-3 rounded-full bg-primary/10 inline-flex mb-3">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Spot Data Entry</h1>
            <p className="text-muted-foreground mt-1">Sign in to add fishing spots</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="de-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="de-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="h-12 pl-12 bg-muted/30 border-border rounded-xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="de-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="de-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12 pl-12 pr-12 bg-muted/30 border-border rounded-xl" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loginLoading} className="w-full h-12 rounded-xl text-base font-semibold">
                {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <img src={logo} alt="FishX" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Your account doesn't have data entry permissions. Contact an admin to get access.</p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Spot entry form
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FishX" className="h-8 w-8 rounded-full object-cover" />
            <div>
              <h1 className="font-bold text-lg">Spot Data Entry</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Entry form */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Add New Spot
          </h2>
          <form onSubmit={handleSubmitSpot} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-number">Site Number</Label>
                <Input id="site-number" placeholder="e.g. 75" value={siteNumber} onChange={e => setSiteNumber(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-name">Location / Area</Label>
                <Input id="location-name" placeholder="e.g. Florida Keys" value={locationName} onChange={e => setLocationName(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spot-desc">Deployment Name *</Label>
              <Input id="spot-desc" placeholder='e.g. Crocker Reef "16"' value={description} onChange={e => setDescription(e.target.value)} className="bg-muted/30 rounded-xl" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-desc">Description</Label>
              <Textarea id="full-desc" placeholder="e.g. 97' X 30' X 20' Steel hulled vessel" value={fullDescription} onChange={e => setFullDescription(e.target.value)} className="bg-muted/30 rounded-xl min-h-[80px]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude *</Label>
                <Input id="lat" placeholder="24° 54.450'N or 24.9075" value={latInput} onChange={e => setLatInput(e.target.value)} className="bg-muted/30 rounded-xl" required />
                <p className="text-xs text-muted-foreground">Decimal or DMS format</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude *</Label>
                <Input id="lng" placeholder="80° 31.490'W or -80.5248" value={lngInput} onChange={e => setLngInput(e.target.value)} className="bg-muted/30 rounded-xl" required />
                <p className="text-xs text-muted-foreground">Decimal or DMS format</p>
              </div>
            </div>

            {/* Reef-specific fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input id="county" placeholder="e.g. Bay" value={county} onChange={e => setCounty(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deploy-date">Deploy Date</Label>
                <Input id="deploy-date" type="date" value={deployDate} onChange={e => setDeployDate(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Primary Material</Label>
              <Input id="material" placeholder="e.g. Steel vessel 97'" value={primaryMaterial} onChange={e => setPrimaryMaterial(e.target.value)} className="bg-muted/30 rounded-xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tons">Tons</Label>
                <Input id="tons" type="number" step="0.1" placeholder="e.g. 94" value={tons} onChange={e => setTons(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relief">Relief (ft)</Label>
                <Input id="relief" type="number" step="0.1" placeholder="e.g. 20" value={reliefFt} onChange={e => setReliefFt(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depth">Depth (ft)</Label>
                <Input id="depth" type="number" step="0.1" placeholder="e.g. 74" value={depthFt} onChange={e => setDepthFt(e.target.value)} className="bg-muted/30 rounded-xl" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Jurisdiction</Label>
                <Select value={jurisdiction} onValueChange={setJurisdiction}>
                  <SelectTrigger className="bg-muted/30 rounded-xl">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="State">State</SelectItem>
                    <SelectItem value="Federal">Federal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coast</Label>
                <Select value={coast} onValueChange={setCoast}>
                  <SelectTrigger className="bg-muted/30 rounded-xl">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gulf">Gulf</SelectItem>
                    <SelectItem value="Atlantic">Atlantic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Spot
            </Button>
          </form>
        </div>

        {/* Recent entries */}
        {recentSpots.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Recently Added ({recentSpots.length})</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentSpots.map(spot => (
                <div key={spot.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{spot.name}</p>
                    <p className="text-xs text-muted-foreground">{spot.location_lat.toFixed(4)}, {spot.location_lng.toFixed(4)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(spot.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}