import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, X, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay before showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    
    // Dispatch custom event for other components to react to consent changes
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: prefs }));
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      preferences: true,
    });
  };

  const acceptEssentialOnly = () => {
    savePreferences({
      essential: true,
      analytics: false,
      preferences: false,
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-2xl">
          {/* Main Banner */}
          <div className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 hidden sm:block">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  We use cookies
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                  <Link to="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>{' '}
                  to learn more.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={acceptAll} className="btn-primary">
                    Accept All
                  </Button>
                  <Button onClick={acceptEssentialOnly} variant="outline">
                    Essential Only
                  </Button>
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="ghost"
                    className="text-muted-foreground"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                    {showSettings ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Close button - dismiss but will show again on next visit */}
              <button
                onClick={() => setShowBanner(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Dismiss cookie banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-border">
                  <div className="space-y-4">
                    {/* Essential Cookies */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="essential" className="font-medium text-foreground">
                            Essential Cookies
                          </Label>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            Required
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Necessary for the website to function. Cannot be disabled.
                        </p>
                      </div>
                      <Switch
                        id="essential"
                        checked={true}
                        disabled
                        className="opacity-50"
                      />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="analytics" className="font-medium text-foreground">
                          Analytics Cookies
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Help us understand how you use our website to improve it.
                        </p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={preferences.analytics}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, analytics: checked })
                        }
                      />
                    </div>

                    {/* Preference Cookies */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="preferences" className="font-medium text-foreground">
                          Preference Cookies
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Remember your settings like theme and language preferences.
                        </p>
                      </div>
                      <Switch
                        id="preferences"
                        checked={preferences.preferences}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, preferences: checked })
                        }
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <Button onClick={saveCustomPreferences}>
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check cookie consent
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPrefs) {
      setConsent(JSON.parse(savedPrefs));
    }

    const handleConsentChange = (event: CustomEvent<CookiePreferences>) => {
      setConsent(event.detail);
    };

    window.addEventListener('cookie-consent-changed', handleConsentChange as EventListener);
    return () => {
      window.removeEventListener('cookie-consent-changed', handleConsentChange as EventListener);
    };
  }, []);

  return consent;
}
