import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Helmet } from 'react-helmet-async';
import { 
  Accessibility as AccessibilityIcon, 
  Eye, 
  Keyboard, 
  MousePointer, 
  Monitor, 
  Smartphone,
  Headphones,
  MessageSquare,
  CheckCircle2,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Accessibility() {
  const accessibilityFeatures = [
    {
      icon: Eye,
      title: 'Visual Accessibility',
      features: [
        'High contrast color schemes in both light and dark modes',
        'Scalable text that respects browser zoom settings up to 200%',
        'Clear visual focus indicators for all interactive elements',
        'Sufficient color contrast ratios (minimum 4.5:1 for text)',
        'Icons paired with text labels for clarity',
        'Alternative text for all meaningful images',
        'No content that relies solely on color to convey information',
      ],
    },
    {
      icon: Keyboard,
      title: 'Keyboard Navigation',
      features: [
        'Full keyboard accessibility for all features',
        'Logical tab order throughout all pages',
        'Skip-to-content links for efficient navigation',
        'Keyboard shortcuts for common actions',
        'Escape key to close modals and dialogs',
        'Arrow keys for navigating menus and lists',
        'Enter and Space keys to activate buttons and links',
      ],
    },
    {
      icon: Headphones,
      title: 'Screen Reader Support',
      features: [
        'Semantic HTML structure for proper content hierarchy',
        'ARIA labels and descriptions where needed',
        'Live regions for dynamic content updates',
        'Descriptive link text (no "click here" links)',
        'Form labels properly associated with inputs',
        'Error messages announced to screen readers',
        'Tested with NVDA, JAWS, and VoiceOver',
      ],
    },
    {
      icon: MousePointer,
      title: 'Motor Accessibility',
      features: [
        'Large click/touch targets (minimum 44x44 pixels)',
        'No time-limited interactions without extension options',
        'Single-click actions (no complex gestures required)',
        'Drag-and-drop alternatives available',
        'Sticky headers for easy navigation access',
        'Generous spacing between interactive elements',
      ],
    },
    {
      icon: Monitor,
      title: 'Display Preferences',
      features: [
        'Respects system dark mode preferences',
        'Respects reduced motion preferences',
        'Responsive design for all screen sizes',
        'Content reflows properly when zoomed',
        'No horizontal scrolling at standard zoom levels',
        'Print-friendly stylesheets',
      ],
    },
    {
      icon: Smartphone,
      title: 'Mobile Accessibility',
      features: [
        'Touch-friendly interface design',
        'Support for mobile screen readers (TalkBack, VoiceOver)',
        'Orientation support (portrait and landscape)',
        'Pinch-to-zoom enabled',
        'No reliance on hover states for essential functions',
        'Adequate text sizing without zoom',
      ],
    },
  ];

  const wcagCriteria = [
    {
      principle: 'Perceivable',
      description: 'Information and user interface components must be presentable to users in ways they can perceive.',
      guidelines: [
        'Text alternatives for non-text content',
        'Captions and alternatives for multimedia',
        'Content adaptable to different presentations',
        'Distinguishable content (color, contrast, audio control)',
      ],
    },
    {
      principle: 'Operable',
      description: 'User interface components and navigation must be operable.',
      guidelines: [
        'Keyboard accessible functionality',
        'Enough time to read and use content',
        'No content that causes seizures',
        'Navigable with multiple ways to find pages',
        'Input modalities beyond keyboard',
      ],
    },
    {
      principle: 'Understandable',
      description: 'Information and the operation of user interface must be understandable.',
      guidelines: [
        'Readable and understandable text content',
        'Predictable appearance and operation',
        'Input assistance to avoid and correct mistakes',
      ],
    },
    {
      principle: 'Robust',
      description: 'Content must be robust enough to be interpreted by a wide variety of user agents.',
      guidelines: [
        'Compatible with current and future user agents',
        'Valid, well-formed markup',
        'Name, role, value for all UI components',
      ],
    },
  ];

  const keyboardShortcuts = [
    { keys: 'Tab', action: 'Move to next interactive element' },
    { keys: 'Shift + Tab', action: 'Move to previous interactive element' },
    { keys: 'Enter', action: 'Activate buttons, links, and form submissions' },
    { keys: 'Space', action: 'Activate buttons, toggle checkboxes' },
    { keys: 'Escape', action: 'Close modals, dialogs, and dropdowns' },
    { keys: 'Arrow Keys', action: 'Navigate within menus, tabs, and lists' },
    { keys: 'Home / End', action: 'Jump to first/last item in lists' },
  ];

  return (
    <>
      <Helmet>
        <title>Accessibility Statement | FishX</title>
        <meta 
          name="description" 
          content="FishX is committed to digital accessibility. Learn about our WCAG compliance efforts and accessibility features." 
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
                  <AccessibilityIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">Accessibility Statement</h1>
              </div>
              <p className="text-muted-foreground">
                Last Updated: January 6, 2026
              </p>
            </div>

            {/* Commitment */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Commitment to Accessibility</h2>
              <p className="text-lg text-muted-foreground mb-4">
                FishX LLC is committed to ensuring digital accessibility for people with disabilities. 
                We are continually improving the user experience for everyone and applying the relevant 
                accessibility standards to ensure we provide equal access to all users.
              </p>
              <p className="text-muted-foreground">
                We believe that the web should be accessible to everyone, regardless of ability. Our goal is 
                to make it easy for all users to find fishing buddies, romantic connections, plan trips, 
                and enjoy our community features.
              </p>
            </section>

            {/* WCAG Compliance */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">WCAG Compliance</h2>
              <p className="text-muted-foreground mb-6">
                We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. 
                These guidelines explain how to make web content more accessible for people with disabilities 
                and more user-friendly for everyone.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2">
                {wcagCriteria.map((criterion) => (
                  <Card key={criterion.principle} className="bg-card">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{criterion.principle}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{criterion.description}</p>
                      <ul className="space-y-1">
                        {criterion.guidelines.map((guideline, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{guideline}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Accessibility Features */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Accessibility Features</h2>
              <p className="text-muted-foreground mb-6">
                We have implemented the following accessibility features across our platform:
              </p>
              
              <div className="space-y-6">
                {accessibilityFeatures.map((category) => (
                  <div key={category.title} className="border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <category.icon className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                    </div>
                    <ul className="grid gap-2 md:grid-cols-2">
                      {category.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Keyboard Navigation</h2>
              <p className="text-muted-foreground mb-6">
                Our website can be fully navigated using a keyboard. Here are the common keyboard shortcuts:
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground">Keys</th>
                      <th className="text-left p-4 font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyboardShortcuts.map((shortcut, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-4">
                          <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">{shortcut.keys}</kbd>
                        </td>
                        <td className="p-4 text-muted-foreground">{shortcut.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Assistive Technologies */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Assistive Technology Compatibility</h2>
              <p className="text-muted-foreground mb-4">
                Our website is designed to be compatible with the following assistive technologies:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Screen Readers</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>NVDA (Windows)</li>
                    <li>JAWS (Windows)</li>
                    <li>VoiceOver (macOS, iOS)</li>
                    <li>TalkBack (Android)</li>
                    <li>Narrator (Windows)</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Browsers</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Google Chrome (latest 2 versions)</li>
                    <li>Mozilla Firefox (latest 2 versions)</li>
                    <li>Apple Safari (latest 2 versions)</li>
                    <li>Microsoft Edge (latest 2 versions)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Known Limitations */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Known Limitations</h2>
              <p className="text-muted-foreground mb-4">
                While we strive for comprehensive accessibility, we acknowledge some current limitations:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Maps:</strong> Our interactive maps (powered by Mapbox) have limited screen reader 
                    support. We provide text-based alternatives for location information.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>User-uploaded content:</strong> Images uploaded by other users may not always 
                    include descriptive alt text. We encourage users to add descriptions to their photos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Real-time features:</strong> Some real-time features like live chat may have 
                    delayed announcements for screen readers.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Third-party integrations:</strong> Some third-party services (payment processing, 
                    social logins) may have their own accessibility limitations.
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                We are actively working to address these limitations and improve accessibility across all features.
              </p>
            </section>

            {/* Testing */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Accessibility Testing</h2>
              <p className="text-muted-foreground mb-4">
                We regularly test our website for accessibility using:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Automated testing tools (axe, WAVE, Lighthouse)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Manual keyboard navigation testing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Screen reader testing (NVDA, VoiceOver)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Color contrast analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  User testing with people with disabilities
                </li>
              </ul>
            </section>

            {/* Resources */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Accessibility Resources</h2>
              <p className="text-muted-foreground mb-4">
                Learn more about web accessibility:
              </p>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Web Content Accessibility Guidelines (WCAG)
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.ada.gov/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Americans with Disabilities Act (ADA)
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.w3.org/WAI/fundamentals/accessibility-intro/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Introduction to Web Accessibility
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </li>
              </ul>
            </section>

            {/* Feedback */}
            <section className="p-6 bg-muted/50 rounded-xl">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Accessibility Feedback</h2>
                  <p className="text-muted-foreground mb-4">
                    We welcome your feedback on the accessibility of FishX. If you encounter 
                    any accessibility barriers or have suggestions for improvement, please let us know:
                  </p>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email: <a href="mailto:accessibility@findfishingdates.com" className="text-primary hover:underline">accessibility@findfishingdates.com</a>
                    </p>
                    <p>
                      We aim to respond to accessibility feedback within 2 business days and to resolve 
                      accessibility issues as quickly as possible.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal */}
            <section className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                This accessibility statement was last reviewed on January 6, 2026. We review and update 
                this statement regularly as we continue to improve the accessibility of our website.
              </p>
            </section>
          </div>
        </main>
        
        <PublicFooter />
      </div>
    </>
  );
}
