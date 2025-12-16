import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.jpg';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-1 max-w-7xl mx-auto">
          <Link to="/">
            <img src={logo} alt="Find Fishing Dates" className="h-24 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <Link to="/about" className="text-foreground hover:opacity-60 transition-opacity">About</Link>
            <Link to="/dating" className="text-foreground hover:opacity-60 transition-opacity">Dating</Link>
            <Link to="/fishing" className="text-foreground hover:opacity-60 transition-opacity">Fishing</Link>
            <Link to="/safety" className="text-foreground hover:opacity-60 transition-opacity">Safety</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:bg-muted font-medium">
                Log in
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="btn-primary">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-12">Last updated: December 16, 2025</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Find Fishing Dates ("Service"), you agree to be bound by these Terms of 
                Service ("Terms"). If you disagree with any part of these terms, you do not have permission to 
                access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use our Service, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Be legally able to enter into a binding contract</li>
                <li>Not be prohibited from using the Service under applicable laws</li>
                <li>Not have been previously banned from the Service</li>
                <li>Not be a registered sex offender</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using the Service, you represent and warrant that you meet all eligibility requirements.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you create an account with us, you must provide accurate, complete, and current information. 
                Failure to do so constitutes a breach of these Terms. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Using only one account per person</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Community Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To maintain a safe and respectful community, you agree NOT to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Post false, misleading, or deceptive information</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Post content that is offensive, discriminatory, or hateful</li>
                <li>Share sexually explicit or pornographic content</li>
                <li>Impersonate another person or entity</li>
                <li>Use the Service for commercial purposes without authorization</li>
                <li>Attempt to access other users' accounts</li>
                <li>Use automated systems or bots to access the Service</li>
                <li>Engage in any illegal activity</li>
                <li>Solicit money from other users</li>
                <li>Share other users' personal information without consent</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Content and Conduct</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">Your Content</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You retain ownership of content you post on the Service. By posting content, you grant us a 
                non-exclusive, royalty-free, worldwide license to use, display, and distribute your content 
                in connection with the Service. You represent that you have the right to post any content you share.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">Content Moderation</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to review, remove, or modify any content that violates these Terms or 
                that we find objectionable. We are not obligated to monitor all content but may do so at our discretion.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Safety and Reporting</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your safety is important to us. We encourage you to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Report any suspicious or inappropriate behavior</li>
                <li>Use the blocking feature for unwanted contacts</li>
                <li>Follow our safety tips when meeting in person</li>
                <li>Never share financial information with other users</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We investigate all reports and take appropriate action, including account suspension or termination.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Premium Subscriptions</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">Billing</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Premium subscriptions are billed on a recurring basis (monthly or annually). By subscribing, 
                you authorize us to charge your payment method at the beginning of each billing period.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">Cancellation</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may cancel your subscription at any time through your account settings. Cancellation will 
                take effect at the end of your current billing period. We do not provide refunds for partial 
                subscription periods.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">Price Changes</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may change subscription prices at any time. Price changes will not affect your current 
                subscription period but will apply to subsequent renewals. We will notify you of any price 
                changes in advance.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content (excluding user-generated content), features, and functionality 
                are owned by Find Fishing Dates and are protected by international copyright, trademark, patent, 
                trade secret, and other intellectual property laws. You may not copy, modify, distribute, or create 
                derivative works based on our content without express written permission.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM 
                ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Warranties of merchantability and fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy of user-provided information</li>
                <li>Warranties regarding the conduct of other users</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not conduct criminal background checks on users. We are not responsible for the actions 
                of users on or off the platform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIND FISHING DATES SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF 
                PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL 
                LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless Find Fishing Dates, its officers, directors, employees, 
                and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) 
                arising from your use of the Service, your content, or your violation of these Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for 
                any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Breach of these Terms</li>
                <li>Violation of Community Guidelines</li>
                <li>Fraudulent or illegal activity</li>
                <li>At your request</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Upon termination, your right to use the Service will immediately cease. All provisions of these 
                Terms which should survive termination shall survive.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Any disputes arising from these Terms or your use of the Service will be resolved through 
                binding arbitration in accordance with the rules of the American Arbitration Association. 
                You agree to waive your right to a jury trial and to participate in class actions.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Notwithstanding the above, either party may seek injunctive relief in any court of competent 
                jurisdiction to protect intellectual property rights.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of 
                Florida, United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">15. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. If we make material changes, we will 
                notify you by email or through the Service before the changes take effect. Your continued use 
                of the Service after changes become effective constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">16. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Find Fishing Dates</p>
                <p>Email: legal@findfishingdates.com</p>
                <p>Address: 123 Fishing Lane, Lake City, FL 32055</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <img src={logo} alt="Find Fishing Dates" className="h-16 w-auto" />
              <p className="text-muted-foreground">
                The dating app for fishing enthusiasts.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-3">
                <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link to="/help" className="block text-muted-foreground hover:text-foreground transition-colors">Help Center</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Features</h4>
              <div className="space-y-3">
                <Link to="/dating" className="block text-muted-foreground hover:text-foreground transition-colors">Dating</Link>
                <Link to="/fishing" className="block text-muted-foreground hover:text-foreground transition-colors">Fishing</Link>
                <Link to="/safety" className="block text-muted-foreground hover:text-foreground transition-colors">Safety</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <div className="space-y-3">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Find Fishing Dates. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
