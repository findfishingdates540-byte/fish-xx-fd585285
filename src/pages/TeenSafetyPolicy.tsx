import { PageMeta } from '@/components/seo/PageMeta';
import { Link } from 'react-router-dom';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TeenSafetyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title="Teen Safety & Parental Consent Policy | Fish-X"
        description="How Fish-X protects anglers aged 13–17: parental consent, safer defaults, restricted features, moderation, data handling, and family rights."
      />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teen Safety & Parental Consent Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: May 28, 2026</p>
          </div>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold">1. Overview</h2>
            <p>
              Fish-X is a fishing-first community designed to be safe and welcoming for anglers of all
              experience levels, including teen anglers aged 13 to 17 ("Junior Anglers"). This policy
              explains how we protect minors, the restrictions we automatically apply to their
              accounts, the role of a parent or legal guardian, and the rights families have over data
              we collect. It applies in addition to our{' '}
              <Link to="/terms" className="text-primary underline">Terms of Service</Link>,{' '}
              <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>, and{' '}
              <Link to="/guidelines" className="text-primary underline">Community Guidelines</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Minimum Age & Eligibility</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be at least <strong>13 years old</strong> to create a Fish-X account.</li>
              <li>Children under 13 are not permitted to register, submit content, or otherwise use the service. We will delete any account we believe belongs to a child under 13.</li>
              <li>Adult dating features are restricted to users <strong>18 or older</strong>. Users aged 13–17 cannot access, view, or be discovered through dating features under any circumstance.</li>
              <li>Where local law sets a higher digital age of consent (for example, parts of the EU), additional verification or parental authorization may be required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Parental / Guardian Consent</h2>
            <p>
              When a user indicates a date of birth that places them between 13 and 17, Fish-X requires
              the user to confirm that a parent or legal guardian has reviewed this policy and
              authorized their use of the service. We may also collect a parent/guardian email address
              for safety communications. By submitting the consent checkbox, the user represents that:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A parent or legal guardian is aware of the account and the safety features below.</li>
              <li>The parent/guardian agrees to our Terms of Service on the minor's behalf.</li>
              <li>The information provided about the minor's age is accurate.</li>
            </ul>
            <p>
              Parents who did not authorize an account, or who wish to withdraw consent at any time,
              may contact us at <a href="mailto:safety@fishx.app" className="text-primary underline">safety@fishx.app</a> and we will deactivate or delete the account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Junior Angler Account — Default Protections</h2>
            <p>Every Junior Angler account is automatically configured with the following safer defaults, which cannot be disabled by the minor:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Fishing mode only.</strong> Account mode is locked to fishing. Dating discovery, dating profiles, likes, and matches are completely hidden and server-side blocked.</li>
              <li><strong>Restricted direct messaging.</strong> Junior Anglers can only chat with confirmed Fishing Buddies (mutually accepted connections). They cannot receive or send unsolicited DMs from strangers.</li>
              <li><strong>Reduced location precision.</strong> Public location is fuzzed; precise GPS is never shown on public surfaces and is only shared with confirmed Buddies on trips that the minor has explicitly opted into.</li>
              <li><strong>Profile privacy defaults.</strong> Discoverability in adult-facing surfaces is limited, and Junior Angler badging is shown to other users so the community knows to interact respectfully.</li>
              <li><strong>Tournaments and challenges.</strong> Junior Anglers are routed to events flagged appropriate for minors and to Junior brackets. Cash-prize events and 18+ contests are filtered out.</li>
              <li><strong>No payouts to minors.</strong> Real-money prize payouts, gift cards, and other monetary rewards are not available to Junior Angler accounts. Where a Junior places in a qualifying event, prizes may only be released to a verified parent/guardian.</li>
              <li><strong>Advertising restrictions.</strong> No interest-based or sensitive-category ads (alcohol, gambling, dating, weapons) are served to minor accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Content Standards & Moderation</h2>
            <p>We hold all users to our Community Guidelines, and apply additional moderation around minors:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Sexual content, sexualized imagery, or grooming behavior directed at a minor is strictly prohibited and reported to authorities where required.</li>
              <li>Adult users who repeatedly attempt to contact, follow, or solicit Junior Anglers outside of legitimate fishing context will be banned.</li>
              <li>Any imagery uploaded to a Junior account that appears to depict CSAM is removed, preserved as evidence, and reported to the National Center for Missing & Exploited Children (NCMEC) and applicable authorities.</li>
              <li>Junior Anglers are encouraged to use in-app <strong>Block</strong> and <strong>Report</strong> tools. Reports involving minors are prioritized in our moderation queue.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Real-World Safety</h2>
            <p>Fishing is a real-world activity. We strongly recommend that Junior Anglers:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Always fish with a trusted adult or in a group; never meet an unknown buddy alone.</li>
              <li>Tell a parent/guardian where you are going, your planned spot, and your expected return time before any trip.</li>
              <li>Wear a personal flotation device (PFD) when fishing from boats, kayaks, jetties, or unstable banks.</li>
              <li>Follow all local fishing licenses, bag limits, size limits, and seasonal closures.</li>
              <li>Never share home address, school, daily routine, or live precise GPS location with anyone they have not met in real life through a trusted adult.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Collection for Minors</h2>
            <p>
              For Junior Angler accounts we collect only the data needed to operate the service safely:
              account credentials, date of birth (to verify age), display name, profile photo, fishing
              activity (catches, spots, trips you choose to log), device and diagnostic data, and any
              messages exchanged with confirmed Buddies. We do <strong>not</strong> sell minors' personal information,
              and we do not use it for behavioral advertising. Retention, access, and deletion rights
              are described in our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Parent & Guardian Rights</h2>
            <p>A parent or legal guardian of a Junior Angler may, at any time, request that we:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirm whether their child has an account.</li>
              <li>Provide a copy of the personal information associated with that account.</li>
              <li>Correct or update inaccurate information.</li>
              <li>Delete the account and associated personal information.</li>
              <li>Refuse further collection or use of the minor's information.</li>
            </ul>
            <p>
              Email <a href="mailto:safety@fishx.app" className="text-primary underline">safety@fishx.app</a> with the child's account username/email. We will verify the relationship before acting on the request and respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Graduation to an Adult Account</h2>
            <p>
              When a Junior Angler turns 18, restrictions are lifted automatically based on the
              verified date of birth on file. The user may then choose to enable adult features such as
              dating. We do not retroactively expose any historical Junior Angler activity to dating
              surfaces, and prior content remains governed by the protections in place when it was
              posted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Reporting & Emergency Contacts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>In-app:</strong> Tap the report icon on any profile, message, post, or spot.</li>
              <li><strong>Safety team:</strong> <a href="mailto:safety@fishx.app" className="text-primary underline">safety@fishx.app</a></li>
              <li><strong>Child exploitation (US):</strong> CyberTipline at <a href="https://report.cybertip.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">report.cybertip.org</a> or 1-800-843-5678.</li>
              <li><strong>Immediate danger:</strong> Always contact local emergency services first (911 in the US).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
            <p>
              We may update this policy to reflect product changes, new regulations, or community
              feedback. Material changes will be communicated through in-app notice and, where
              available, to the parent/guardian email on file. Continued use of a Junior Angler
              account after such notice constitutes acceptance of the updated policy.
            </p>
          </section>
        </article>
      </div>

      <PublicFooter />
    </div>
  );
}