import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Heart, Fish, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.jpg';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'eligibility', label: 'Eligibility & Account' },
  { id: 'mode-rules', label: 'Mode-Specific Rules' },
  { id: 'safety', label: 'Safety & Conduct' },
  { id: 'intellectual', label: 'Intellectual Property' },
  { id: 'disclaimers', label: 'Disclaimers & Liability' },
  { id: 'dispute', label: 'Dispute Resolution' },
];

const Terms = () => {
  const [activeSection, setActiveSection] = useState('introduction');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-1 max-w-7xl mx-auto">
          <Link to="/">
            <img src={logo} alt="Find Fishing Dates" className="h-24 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <Link to="/" className="text-foreground hover:opacity-60 transition-opacity">Home</Link>
            <Link to="/dating" className="text-foreground hover:opacity-60 transition-opacity">Modes</Link>
            <Link to="/about" className="text-foreground hover:opacity-60 transition-opacity">About</Link>
            <Link to="/contact" className="text-foreground hover:opacity-60 transition-opacity">Contact</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="pt-32 pb-8 px-6 bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground text-sm font-medium mb-2">
                <Fish className="h-4 w-4" />
                <span>LEGAL CENTER</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
              <p className="text-muted-foreground">Last Updated: October 24, 2023</p>
            </div>
            <Button variant="outline" className="hidden md:flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-6 sticky top-32">
              <div className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  TABLE OF CONTENTS
                </h3>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                        activeSection === section.id
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted-foreground/20'
                      }`}>
                        {index + 1}
                      </span>
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Need Help Box */}
              <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <span className="text-lg">💬</span>
                  <span>Need Help?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  If you have questions about these terms, please contact our legal team.
                </p>
                <Link 
                  to="/contact" 
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
            {/* Section 1: Introduction */}
            <section id="introduction" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  1
                </span>
                <h2 className="text-2xl font-bold text-foreground">Introduction</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Welcome to FindFish Date! These Terms and Conditions govern your use of our website and mobile 
                  application. By accessing or using FindFish Date, you agree to be bound by these terms. FindFish Date 
                  is a unique platform offering three distinct modes: Dating, Fishing Spots, and a Combo mode.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Please read these terms carefully. If you do not agree with any part of these terms, you must not use our 
                  services.
                </p>
              </div>
            </section>

            {/* Section 2: Eligibility & Account */}
            <section id="eligibility" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  2
                </span>
                <h2 className="text-2xl font-bold text-foreground">Eligibility & Account</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  To use FindFish Date, you must be at least 18 years old. By creating an account, you warrant that you 
                  meet this age requirement and that the information you provide is accurate and complete.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Account Security</h4>
                      <p className="text-sm text-muted-foreground">
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur 
                        under your account.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        We reserve the right to require identity verification to ensure the safety of our community, especially for users 
                        engaging in the Dating and Combo modes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Mode-Specific Rules */}
            <section id="mode-rules" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  3
                </span>
                <h2 className="text-2xl font-bold text-foreground">Mode-Specific Rules</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  FindFish Date operates in three distinct modes. By using the platform, you agree to the specific rules 
                  governed by your active mode.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Dating Mode Card */}
                  <div className="bg-rose-50 rounded-xl p-5 border border-rose-100">
                    <div className="flex items-center gap-2 text-rose-600 font-semibold mb-2">
                      <Heart className="h-4 w-4" />
                      Dating Mode
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Users must interact respectfully. Harassment, unwanted advances, or catfishing will result in 
                      immediate suspension.
                    </p>
                  </div>

                  {/* Fishing Spots Mode Card */}
                  <div className="bg-sky-50 rounded-xl p-5 border border-sky-100">
                    <div className="flex items-center gap-2 text-sky-600 font-semibold mb-2">
                      <Fish className="h-4 w-4" />
                      Fishing Spots Mode
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share accurate locations. Do not trespass on private property. Respect local fishing regulations and 
                      conservation efforts.
                    </p>
                  </div>
                </div>

                {/* Combo Mode Card */}
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold mb-2">
                    <Users className="h-4 w-4" />
                    Combo Mode (Dating + Fishing)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Combines rules from both modes. Safety is paramount when meeting new people in remote fishing locations. 
                    Always inform a third party of your whereabouts.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Safety & Conduct */}
            <section id="safety" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  4
                </span>
                <h2 className="text-2xl font-bold text-foreground">Safety & Conduct</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, impairs, 
                  or renders the Service less efficient.
                </p>
                
                {/* Zero Tolerance Alert */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-600">Zero Tolerance Policy</h4>
                    <p className="text-sm text-red-600/80">
                      We have zero tolerance for hate speech, bullying, or illegal content. Violations result in a permanent ban.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Intellectual Property */}
            <section id="intellectual" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  5
                </span>
                <h2 className="text-2xl font-bold text-foreground">Intellectual Property</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  The Service and its original content (excluding Content provided by users), features, and functionality 
                  are and will remain the exclusive property of FindFish Date and its licensors. You grant FindFish Date a 
                  worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, 
                  publish, transmit, display, and distribute any content you post (e.g., fishing catch photos, profile bios).
                </p>
              </div>
            </section>

            {/* Section 6: Disclaimers & Liability */}
            <section id="disclaimers" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  6
                </span>
                <h2 className="text-2xl font-bold text-foreground">Disclaimers & Liability</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed uppercase text-sm mb-4">
                  YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS 
                  AVAILABLE" BASIS.
                </p>
                <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                  IN NO EVENT SHALL FINDFISH DATE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR 
                  AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE 
                  DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER 
                  INTANGIBLE LOSSES.
                </p>
              </div>
            </section>

            {/* Section 7: Dispute Resolution */}
            <section id="dispute" className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  7
                </span>
                <h2 className="text-2xl font-bold text-foreground">Dispute Resolution</h2>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  Any dispute related to these Terms will be governed by the laws of the State of California, without regard 
                  to its conflict of law provisions. You agree to submit to the personal jurisdiction of the courts located 
                  within San Francisco County, California for the purpose of litigating all such claims or disputes.
                </p>
              </div>
            </section>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Acceptance Bar */}
      <div className="sticky bottom-0 bg-background border-t border-border py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">I accept the Terms & Conditions</p>
            <p className="text-sm text-muted-foreground">Please scroll to the bottom to accept</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="px-6">
              Decline
            </Button>
            <Link to="/auth?mode=signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
                Accept →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="Find Fishing Dates" className="h-48 w-auto" />
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/help" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <Link to="/safety" className="hover:text-foreground transition-colors">Community Guidelines</Link>
          </div>
          
          <p className="text-xs text-muted-foreground">
            © 2023 FindFish Date Inc. All rights reserved. Fishing spots are user-generated; verify local 
            laws before fishing. Dating safety is your responsibility.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
