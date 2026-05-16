import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Users, 
  Shield, 
  Fish, 
  MessageSquare, 
  Camera, 
  Ban, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
  ArrowRight,
  Calendar,
  ThumbsUp,
  UserCheck,
  Sparkles,
  Target,
  Award,
  Globe,
  Leaf
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/layout';

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Community Guidelines — FishX"
        description="The rules that keep FishX safe and fair: respectful conduct, honest catches, no harassment, and zero tolerance for fraud."
        path="/guidelines"
      />
      <PublicHeader />

      {/* Hero Banner */}
      <div className="pt-32 pb-12 px-6 bg-muted/30 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-foreground text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            <span>Community Standards</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Community Guidelines</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our community thrives when everyone treats each other with respect and authenticity. 
            These guidelines help create a safe, welcoming space for all fishing enthusiasts.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Last Updated: January 6, 2026
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-16">
        <div className="max-w-4xl mx-auto">

          {/* Our Values */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <ThumbsUp className="h-8 w-8 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Respect</h3>
                <p className="text-muted-foreground text-sm">
                  Treat every member with dignity and respect, regardless of their background, experience level, or preferences. 
                  Disagreements are fine; disrespect is not.
                </p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <UserCheck className="h-8 w-8 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Authenticity</h3>
                <p className="text-muted-foreground text-sm">
                  Be yourself. Use real photos, honest information, and genuine intentions. 
                  Catfishing and misrepresentation harm trust in our community.
                </p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <Shield className="h-8 w-8 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Safety</h3>
                <p className="text-muted-foreground text-sm">
                  Prioritize safety - yours and others'. Report suspicious behavior, 
                  follow meeting guidelines, and look out for fellow community members.
                </p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <Globe className="h-8 w-8 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Inclusion</h3>
                <p className="text-muted-foreground text-sm">
                  Everyone is welcome here. We celebrate diversity in all forms and 
                  do not tolerate discrimination or exclusionary behavior.
                </p>
              </div>
            </div>
          </section>

          {/* Profile Guidelines */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Camera className="h-6 w-6 text-primary" />
              Profile Guidelines
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Photo Requirements</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Do
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>Use recent photos (within last 2 years)</li>
                      <li>Include at least one clear face photo</li>
                      <li>Show your genuine interests and personality</li>
                      <li>Include fishing photos if relevant to you</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="font-medium text-red-800 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Don't
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>Use heavily filtered or misleading photos</li>
                      <li>Post nudity or sexually explicit content</li>
                      <li>Include photos with identifiable children</li>
                      <li>Use copyrighted images or others' photos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Bio Guidelines</h3>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Write an honest bio that represents who you are</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Share your genuine fishing interests and experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Be clear about what you're looking for (dating, buddies, or both)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>No hate speech, slurs, or discriminatory language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>No spam, advertisements, or solicitations</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" /> Verification Encouraged
                </p>
                <p className="text-sm text-amber-700">
                  Getting verified (ID or Live) shows you're committed to authenticity and helps build trust. 
                  Verified profiles often receive more matches and buddy requests.
                </p>
              </div>
            </div>
          </section>

          {/* Communication Guidelines */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              Communication Guidelines
            </h2>
            
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Respectful Messaging</h3>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li>Start conversations with genuine interest, not generic openers</li>
                  <li>Respect boundaries - if someone isn't responding, move on</li>
                  <li>Keep conversations appropriate for the platform</li>
                  <li>No unsolicited explicit content or messages</li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Handling Rejection</h3>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li>Accept "no" gracefully - everyone has the right to decline</li>
                  <li>Don't continue contacting someone who has unmatched or blocked you</li>
                  <li>Never use other platforms to contact someone who rejected you here</li>
                  <li>Remember: rejection isn't personal, it's just compatibility</li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Consent is Key</h3>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li>Ask before sharing personal contact information</li>
                  <li>Get consent before sending photos, especially intimate ones</li>
                  <li>Respect privacy - don't share someone's info without permission</li>
                  <li>Honor requests to stop or change topics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Dating Conduct */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Heart className="h-6 w-6 text-primary" />
              Dating Conduct
            </h2>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Dating mode connects you with potential romantic partners. Follow these guidelines for a positive experience:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Before Meeting</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Video call before meeting in person</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Be honest about your intentions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Trust your instincts about compatibility</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Meeting Up</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Meet in public places first</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Tell someone where you're going</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Arrange your own transportation</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <p className="font-medium text-destructive mb-2">Zero Tolerance</p>
                <p className="text-sm text-foreground">
                  Sexual harassment, unsolicited explicit content, catfishing, and any form of assault 
                  will result in immediate, permanent account termination and may be reported to authorities.
                </p>
              </div>
            </div>
          </section>

          {/* Fishing Community Conduct */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Fish className="h-6 w-6 text-primary" />
              Fishing Community Conduct
            </h2>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Our fishing community is built on shared passion. These guidelines help everyone enjoy the sport:
              </p>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Fishing Spot Etiquette</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Share accurate information about spots you add</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Respect spots marked as private by others</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Never share locations on private property without permission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Report hazards or access issues promptly</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Leaf className="h-5 w-5" /> Conservation & Regulations
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Follow all local, state, and federal fishing regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Practice catch-and-release when appropriate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Leave fishing spots cleaner than you found them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Never promote, share, or glorify poaching or illegal fishing</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Catch Logging Honesty</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Log catches accurately with correct species, size, and weight</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Don't claim catches you didn't make</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Don't use photos from others or the internet</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Buddy System</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Buddy connections are for platonic fishing partnerships</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Honor trip commitments or give reasonable notice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Share safety information for remote trips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Don't use buddy features to circumvent dating rejections</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Behavior */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Ban className="h-6 w-6 text-destructive" />
              Prohibited Behavior
            </h2>
            
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
              <p className="text-foreground mb-4">
                The following behaviors are strictly prohibited and will result in account action:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Harassment & Abuse</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Bullying, intimidation, or threats</li>
                    <li>Stalking or unwanted repeated contact</li>
                    <li>Doxing (sharing personal information)</li>
                    <li>Sexual harassment in any form</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Hate & Discrimination</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Hate speech targeting any group</li>
                    <li>Discrimination based on race, gender, orientation, religion, etc.</li>
                    <li>Promoting violence against any group</li>
                    <li>Symbols or imagery of hate groups</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Fraud & Deception</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Catfishing or fake profiles</li>
                    <li>Scams or financial fraud</li>
                    <li>Impersonating another person</li>
                    <li>Fake verification documents</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Illegal Activity</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Promoting illegal fishing (poaching)</li>
                    <li>Drug sales or promotion</li>
                    <li>Any content involving minors inappropriately</li>
                    <li>Solicitation for illegal activities</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Enforcement */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary" />
              Enforcement
            </h2>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We take violations seriously and enforce our guidelines fairly and consistently:
              </p>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Enforcement Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Warning</p>
                      <p className="text-sm text-muted-foreground">For minor first-time violations. Account remains active with notice to correct behavior.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Temporary Suspension</p>
                      <p className="text-sm text-muted-foreground">For repeat or moderate violations. Account disabled for 7-30 days.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Ban className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Permanent Ban</p>
                      <p className="text-sm text-muted-foreground">For severe or repeated violations. Account permanently terminated, no new accounts allowed.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Appeal Process</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  If you believe your account was suspended or banned in error:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Email appeals@fishx.app within 30 days</li>
                  <li>Include your account email and explanation</li>
                  <li>Appeals are reviewed within 5-7 business days</li>
                  <li>Zero-tolerance violations (harassment, child safety) cannot be appealed</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <div className="bg-foreground text-background rounded-3xl p-12">
              <h2 className="text-2xl font-bold mb-4">Questions about our guidelines?</h2>
              <p className="text-background/70 mb-6 max-w-lg mx-auto">
                If you're unsure about anything or need to report a violation, our team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90 rounded-full px-8">
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/safety">
                  <Button size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 rounded-full px-8">
                    Safety Center
                  </Button>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CommunityGuidelines;