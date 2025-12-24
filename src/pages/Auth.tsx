import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Fish, Heart, Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';
import { z } from 'zod';
import authBothImage from '@/assets/auth-couple-fishing.jpg';
import authDatingImage from '@/assets/auth-dating.jpg';
import authFishingImage from '@/assets/auth-fishing.jpg';
import logo from '@/assets/logo.png';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AccountMode = 'dating' | 'fishing' | 'both';

const accountImages: Record<AccountMode, string> = {
  dating: authDatingImage,
  fishing: authFishingImage,
  both: authBothImage,
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountMode, setAccountMode] = useState<AccountMode>('both');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkOnboardingAndPremium = async () => {
      if (user) {
        // Check onboarding status, account mode, and premium status
        const { data } = await (await import('@/integrations/supabase/client')).supabase
          .from('profiles')
          .select('onboarding_completed, account_mode, is_premium')
          .eq('id', user.id)
          .single();
        
        if (!data?.onboarding_completed) {
          navigate('/onboarding');
          return;
        }
        
        // Check if fishing/both users need to pay
        const requiresPremium = data.account_mode === 'fishing' || data.account_mode === 'both';
        if (requiresPremium && !data.is_premium) {
          navigate('/pricing');
          return;
        }
        
        navigate('/app/discover');
      }
    };
    checkOnboardingAndPremium();
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName, accountMode);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Try logging in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome to Find Fishing Dates!',
            description: 'Check your email to confirm your account, then complete your profile.',
          });
          // Navigate to onboarding after successful signup
          navigate('/onboarding');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const accountModeOptions: { value: AccountMode; label: string; icon: React.ReactNode }[] = [
    { value: 'dating', label: 'Dating', icon: <Heart className="w-4 h-4" /> },
    { value: 'fishing', label: 'Fishing', icon: <Fish className="w-4 h-4" /> },
    { value: 'both', label: 'Both', icon: <><Heart className="w-3 h-3" /><Fish className="w-3 h-3" /></> },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {Object.entries(accountImages).map(([mode, src]) => (
          <img 
            key={mode}
            src={src} 
            alt={`${mode} mode`} 
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              accountMode === mode 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="flex justify-end p-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Find Fishing Dates" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold mb-8">
              {isSignUp ? 'Create Account!' : 'Welcome Back!'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Account Mode Selection - Only show on signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label>I'm looking for</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {accountModeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAccountMode(option.value)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                          accountMode === option.value
                            ? 'bg-foreground text-background'
                            : 'bg-background text-foreground hover:bg-muted'
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Display Name - Only show on signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-12 pl-12 bg-muted/30 border-border rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-12 pl-12 bg-muted/30 border-border rounded-xl ${errors.email ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 pl-12 pr-12 bg-muted/30 border-border rounded-xl ${errors.password ? 'border-destructive' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password - Only show on signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`h-12 pl-12 pr-12 bg-muted/30 border-border rounded-xl ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-base font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSignUp ? (
                  'Sign Up'
                ) : (
                  'Log In'
                )}
              </Button>
            </form>

            {/* Toggle Sign Up / Log In */}
            <div className="mt-6 text-center">
              <span className="text-muted-foreground">
                {isSignUp ? 'Have an account? ' : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-foreground hover:underline"
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </button>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
