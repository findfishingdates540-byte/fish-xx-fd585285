import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Fish, Heart, Eye, EyeOff, Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import authBothImage from '@/assets/auth-couple-fishing.jpg';
import authDatingImage from '@/assets/auth-dating.jpg';
import authFishingImage from '@/assets/auth-fishing.jpg';
import logo from '@/assets/logo.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  
  // Recovery mode states (when user clicks email link)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  
  const { signIn, signUp, user, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detect recovery mode from URL
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Skip redirect logic if in recovery mode
    if (isRecoveryMode) return;
    
    const redirectTo = searchParams.get('redirect');

    const checkOnboardingAndPremium = async () => {
      if (!user) return;

      const { supabase } = await import('@/integrations/supabase/client');

      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase
          .from('profiles')
          .select('onboarding_completed, account_mode, is_premium, premium_expires_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'moderator'])
          .maybeSingle(),
      ]);

      const isAdmin = !!roleRow;

      // Admins should never be blocked by onboarding/premium redirects
      if (isAdmin) {
        if (redirectTo && redirectTo.startsWith('/')) {
          navigate(redirectTo);
          return;
        }
        navigate('/admin');
        return;
      }

      if (!profile?.onboarding_completed) {
        navigate('/onboarding');
        return;
      }

      // Check if fishing/both users need to pay or have expired subscription (with 3-day grace period)
      const requiresPremium = profile.account_mode === 'fishing' || profile.account_mode === 'both';
      const gracePeriodMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      const isPremiumExpired =
        profile.premium_expires_at &&
        new Date(profile.premium_expires_at).getTime() + gracePeriodMs < Date.now();
      const hasPremiumAccess = profile.is_premium && !isPremiumExpired;

      if (requiresPremium && !hasPremiumAccess) {
        navigate('/pricing');
        return;
      }

      if (redirectTo && redirectTo.startsWith('/')) {
        navigate(redirectTo);
        return;
      }

      navigate('/app/feed');
    };

    checkOnboardingAndPremium();
  }, [user, navigate, searchParams, isRecoveryMode]);

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
        const { error } = await signUp(email, password, displayName);
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
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
            toast({
              title: 'Email not confirmed',
              description: 'Please check your inbox and click the confirmation link before logging in. Check your spam folder too.',
              variant: 'destructive',
            });
          } else if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message || 'Something went wrong. Please try again.',
              variant: 'destructive',
            });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(forgotEmail);
    } catch {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    setForgotLoading(true);
    
    try {
      const { error } = await resetPassword(forgotEmail);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setForgotEmailSent(true);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(newPassword);
    } catch {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match.',
        variant: 'destructive',
      });
      return;
    }
    
    setRecoveryLoading(true);
    
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password updated!',
          description: 'Your password has been successfully changed.',
        });
        setIsRecoveryMode(false);
        navigate('/app/discover');
      }
    } finally {
      setRecoveryLoading(false);
    }
  };

  const accountModeOptions: { value: AccountMode; label: string; icon: React.ReactNode }[] = [
    { value: 'dating', label: 'Dating', icon: <Heart className="w-4 h-4" /> },
    { value: 'fishing', label: 'Fishing', icon: <Fish className="w-4 h-4" /> },
    { value: 'both', label: 'Both', icon: <><Heart className="w-3 h-3" /><Fish className="w-3 h-3" /></> },
  ];

  // Recovery Mode UI
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Find Fishing Dates" className="h-16 w-auto" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-center">Set New Password</h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter your new password below.
          </p>
          
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-muted/30 border-border rounded-xl"
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-muted/30 border-border rounded-xl"
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
            </div>
            
            <Button
              type="submit"
              disabled={recoveryLoading}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-base font-semibold"
            >
              {recoveryLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          setForgotEmailSent(false);
          setForgotEmail('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {forgotEmailSent ? 'Check your email' : 'Reset your password'}
            </DialogTitle>
            <DialogDescription>
              {forgotEmailSent 
                ? "We've sent you a password reset link. Please check your inbox."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </DialogDescription>
          </DialogHeader>
          
          {forgotEmailSent ? (
            <div className="flex flex-col items-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                onClick={() => setForgotEmailSent(false)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Try again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-12 pl-12 bg-muted/30 border-border rounded-xl"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl"
              >
                {forgotLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
