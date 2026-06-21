import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { realPhoto } from '@/assets/real-photos';
const authFishingImage = realPhoto(0);
import logo from '@/assets/fishx-logo.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');


const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [signupSource, setSignupSource] = useState(searchParams.get('promo') || searchParams.get('source') || '');
  const [referredBy, setReferredBy] = useState(searchParams.get('ref') || '');
  
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

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

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
        .select('onboarding_completed, account_mode')
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
        const { error } = await signUp(email, password, displayName, signupSource, referredBy);
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
            title: 'Welcome to Fish-X!',
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
        navigate('/app/feed');
      }
    } finally {
      setRecoveryLoading(false);
    }
  };


  // Recovery Mode UI
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Fish-X" className="h-16 w-auto" />
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
        <img 
          src={authFishingImage} 
          alt="Fish-X" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="flex justify-end p-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Fish-X" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold mb-8">
              {isSignUp ? 'Create Account!' : 'Welcome Back!'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">

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

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social OAuth Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
                className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Sign in with Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } })}
                className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Sign in with Apple"
              >
                <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: window.location.origin } })}
                className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Sign in with Facebook"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>

            {/* Toggle Sign Up / Log In */}
            <div className="text-center">
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