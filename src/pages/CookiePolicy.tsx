import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Helmet } from 'react-helmet-async';
import { Cookie, Shield, BarChart3, Settings, Clock, Globe, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CookiePolicy() {
  const essentialCookies = [
    {
      name: 'sb-auth-token',
      purpose: 'Authentication session management',
      duration: 'Session / 7 days',
      provider: 'FishX',
    },
    {
      name: 'sb-refresh-token',
      purpose: 'Maintains login session across visits',
      duration: '7 days',
      provider: 'FishX',
    },
    {
      name: 'cookie-consent',
      purpose: 'Stores your cookie preferences',
      duration: '1 year',
      provider: 'FishX',
    },
    {
      name: 'csrf-token',
      purpose: 'Security token to prevent cross-site request forgery',
      duration: 'Session',
      provider: 'FishX',
    },
    {
      name: 'device-id',
      purpose: 'Identifies your device for security purposes',
      duration: '1 year',
      provider: 'FishX',
    },
  ];

  const analyticsCookies = [
    {
      name: '_ga',
      purpose: 'Distinguishes unique users for analytics',
      duration: '2 years',
      provider: 'Google Analytics',
    },
    {
      name: '_ga_*',
      purpose: 'Maintains session state for analytics',
      duration: '2 years',
      provider: 'Google Analytics',
    },
    {
      name: '_gid',
      purpose: 'Distinguishes users for daily analytics',
      duration: '24 hours',
      provider: 'Google Analytics',
    },
    {
      name: '_gat',
      purpose: 'Throttles request rate to analytics',
      duration: '1 minute',
      provider: 'Google Analytics',
    },
    {
      name: 'analytics_session',
      purpose: 'Tracks session-level engagement metrics',
      duration: 'Session',
      provider: 'Find Fishing Dates',
    },
  ];

  const preferenceCookies = [
    {
      name: 'theme',
      purpose: 'Stores your light/dark mode preference',
      duration: '1 year',
      provider: 'Find Fishing Dates',
    },
    {
      name: 'locale',
      purpose: 'Stores your language preference',
      duration: '1 year',
      provider: 'Find Fishing Dates',
    },
    {
      name: 'map-style',
      purpose: 'Remembers your preferred map view style',
      duration: '1 year',
      provider: 'Find Fishing Dates',
    },
    {
      name: 'units',
      purpose: 'Stores measurement unit preferences (imperial/metric)',
      duration: '1 year',
      provider: 'Find Fishing Dates',
    },
    {
      name: 'notification-prefs',
      purpose: 'Stores in-app notification preferences',
      duration: '1 year',
      provider: 'Find Fishing Dates',
    },
  ];

  const thirdPartyCookies = [
    {
      name: 'stripe-*',
      purpose: 'Payment processing and fraud prevention',
      duration: 'Varies',
      provider: 'Stripe',
    },
    {
      name: 'mapbox-*',
      purpose: 'Map functionality and location services',
      duration: 'Session',
      provider: 'Mapbox',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Cookie Policy | Find Fishing Dates</title>
        <meta 
          name="description" 
          content="Learn about how Find Fishing Dates uses cookies to improve your experience, including essential, analytics, and preference cookies." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <PublicHeader />
        
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-6">
            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Cookie className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">Cookie Policy</h1>
              </div>
              <p className="text-muted-foreground">
                Last Updated: January 6, 2026
              </p>
            </div>

            {/* Introduction */}
            <section className="mb-12">
              <p className="text-lg text-muted-foreground mb-6">
                This Cookie Policy explains how Find Fishing Date LLC ("we", "us", or "our") uses cookies 
                and similar tracking technologies when you visit our website and use our services. This policy 
                should be read alongside our Privacy Policy.
              </p>
              <p className="text-muted-foreground">
                By continuing to use our website, you consent to our use of cookies as described in this policy. 
                You can manage your cookie preferences at any time using the controls described below.
              </p>
            </section>

            {/* What Are Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground mb-4">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when 
                you visit a website. They are widely used to make websites work more efficiently, provide a 
                better user experience, and give website owners information about how their site is being used.
              </p>
              <p className="text-muted-foreground">
                Cookies can be "persistent" (remaining on your device until deleted or expired) or "session" 
                (deleted when you close your browser). They can be set by us ("first-party cookies") or by 
                third-party services we use ("third-party cookies").
              </p>
            </section>

            {/* Cookie Categories */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Types of Cookies We Use</h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                {/* Essential Cookies */}
                <AccordionItem value="essential" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Essential Cookies</div>
                        <div className="text-sm text-muted-foreground font-normal">Required for the website to function</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="text-muted-foreground mb-4">
                      These cookies are strictly necessary for the website to function properly. They enable core 
                      functionality such as security, authentication, and accessibility. You cannot opt out of 
                      these cookies as the website would not function correctly without them.
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cookie Name</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Provider</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {essentialCookies.map((cookie) => (
                            <TableRow key={cookie.name}>
                              <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                              <TableCell>{cookie.purpose}</TableCell>
                              <TableCell>{cookie.duration}</TableCell>
                              <TableCell>{cookie.provider}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Analytics Cookies */}
                <AccordionItem value="analytics" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Analytics Cookies</div>
                        <div className="text-sm text-muted-foreground font-normal">Help us understand how you use our site</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="text-muted-foreground mb-4">
                      These cookies help us understand how visitors interact with our website by collecting and 
                      reporting information anonymously. This helps us improve our website and services. You can 
                      opt out of analytics cookies without affecting your ability to use the website.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>What we track:</strong> Pages visited, time spent on pages, navigation patterns, 
                      device and browser information, geographic region (country/state level), and referral sources.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>What we don't track:</strong> Personal information, specific location data, or any 
                      information that could identify you personally.
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cookie Name</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Provider</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analyticsCookies.map((cookie) => (
                            <TableRow key={cookie.name}>
                              <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                              <TableCell>{cookie.purpose}</TableCell>
                              <TableCell>{cookie.duration}</TableCell>
                              <TableCell>{cookie.provider}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Preference Cookies */}
                <AccordionItem value="preferences" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Preference Cookies</div>
                        <div className="text-sm text-muted-foreground font-normal">Remember your settings and preferences</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="text-muted-foreground mb-4">
                      These cookies allow our website to remember choices you make (such as your theme preference, 
                      language, or region) and provide enhanced, more personalized features. Without these cookies, 
                      you may need to re-enter your preferences each time you visit.
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cookie Name</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Provider</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preferenceCookies.map((cookie) => (
                            <TableRow key={cookie.name}>
                              <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                              <TableCell>{cookie.purpose}</TableCell>
                              <TableCell>{cookie.duration}</TableCell>
                              <TableCell>{cookie.provider}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Third-Party Cookies */}
                <AccordionItem value="third-party" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Third-Party Cookies</div>
                        <div className="text-sm text-muted-foreground font-normal">Set by our service providers</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="text-muted-foreground mb-4">
                      We use trusted third-party services that may set their own cookies. These cookies are 
                      necessary for features like payment processing and mapping functionality to work correctly.
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cookie Name</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Provider</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {thirdPartyCookies.map((cookie) => (
                            <TableRow key={cookie.name}>
                              <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                              <TableCell>{cookie.purpose}</TableCell>
                              <TableCell>{cookie.duration}</TableCell>
                              <TableCell>{cookie.provider}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        For more information about how these third parties use cookies, please visit their 
                        respective privacy policies:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>
                          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Stripe Privacy Policy
                          </a>
                        </li>
                        <li>
                          <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Mapbox Privacy Policy
                          </a>
                        </li>
                        <li>
                          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Google Privacy Policy
                          </a>
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Managing Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Managing Your Cookie Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Cookie Consent Banner</h3>
                  <p className="text-muted-foreground">
                    When you first visit our website, you will see a cookie consent banner that allows you to 
                    accept or customize your cookie preferences. You can change these preferences at any time 
                    by clicking the "Cookie Settings" link in the footer of any page.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Browser Settings</h3>
                  <p className="text-muted-foreground mb-3">
                    Most web browsers allow you to control cookies through their settings. You can usually find 
                    these settings in the "Options" or "Preferences" menu of your browser. The following links 
                    provide information on how to manage cookies in common browsers:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Google Chrome
                      </a>
                    </li>
                    <li>
                      <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Mozilla Firefox
                      </a>
                    </li>
                    <li>
                      <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Apple Safari
                      </a>
                    </li>
                    <li>
                      <a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Microsoft Edge
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Opt-Out Tools</h3>
                  <p className="text-muted-foreground">
                    You can opt out of Google Analytics tracking by installing the{' '}
                    <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Google Analytics Opt-out Browser Add-on
                    </a>.
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> Blocking or deleting cookies may impact your experience on our website. 
                    Some features may not work correctly, and you may need to re-enter your preferences each time 
                    you visit.
                  </p>
                </div>
              </div>
            </section>

            {/* Similar Technologies */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Similar Technologies</h2>
              <p className="text-muted-foreground mb-4">
                In addition to cookies, we may use other similar technologies:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong>Local Storage:</strong> Similar to cookies but can store larger amounts of data. Used 
                  to store your preferences and cached data for offline functionality.
                </li>
                <li>
                  <strong>Session Storage:</strong> Similar to local storage but is cleared when you close your 
                  browser tab. Used for temporary data during your browsing session.
                </li>
                <li>
                  <strong>Pixels/Web Beacons:</strong> Small transparent images that help us understand how you 
                  interact with our emails and website.
                </li>
              </ul>
            </section>

            {/* Do Not Track */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Do Not Track Signals</h2>
              <p className="text-muted-foreground">
                Some browsers have a "Do Not Track" (DNT) feature that sends a signal to websites you visit 
                indicating you do not want to be tracked. Currently, there is no industry standard for how 
                websites should respond to DNT signals. Our website does not currently respond to DNT signals, 
                but you can use the cookie management options described above to control tracking.
              </p>
            </section>

            {/* Updates */}
            <section className="mb-12">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or 
                    for other operational, legal, or regulatory reasons. We will notify you of any material 
                    changes by posting the new policy on this page and updating the "Last Updated" date. We 
                    encourage you to review this policy periodically.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="p-6 bg-muted/50 rounded-xl">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Questions About Cookies?</h2>
                  <p className="text-muted-foreground mb-3">
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Email: <a href="mailto:privacy@findfishingdates.com" className="text-primary hover:underline">privacy@findfishingdates.com</a></li>
                    <li>Mail: Find Fishing Date LLC, Lake City, FL</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </main>
        
        <PublicFooter />
      </div>
    </>
  );
}
