import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, Trophy, Users, Check, DollarSign, Vote, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { realPhoto } from '@/assets/real-photos';
const fishingPhoto1 = realPhoto(0);
const fishingPhoto2 = realPhoto(1);
const fishingPhoto3 = realPhoto(2);
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const Challenges = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Photo & Fishing Challenges on Fish-X"
        description="Enter live photo challenges, vote on entries, and win cash and gear. New fishing challenges every week on Fish-X."
        path="/challenges"
      />
      <PublicHeader />

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Competitions</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Compete & Win Real Prizes
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Enter photo challenges and fishing tournaments for as little as $5. 
                Go head-to-head with anglers across the country and take home cash prizes, 
                gift cards, and bragging rights.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="btn-primary text-lg px-10 py-6 mt-[30px]">
                  Join a Challenge
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                <img src={fishingPhoto1} alt="Angler with trophy catch" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg mt-12">
                <img src={fishingPhoto2} alt="Competition fishing" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Three Steps to Glory
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">1</div>
                <h3 className="text-2xl font-bold text-foreground">Pick a Challenge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Browse open photo challenges and tournaments. Find one that matches your style and skill level.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">2</div>
                <h3 className="text-2xl font-bold text-foreground">Enter for $5</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pay the entry fee and submit your best catch photo or register for a tournament bracket.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">3</div>
                <h3 className="text-2xl font-bold text-foreground">Win Prizes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The community votes or scores decide. Winners take home a share of the prize pool — cash, gift cards, or gear.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Competition Types */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Photo Challenges */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Photo Challenges</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Let Your Catch Do the Talking
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Submit your best catch photo and let the community decide. No judges, no bias — 
                just anglers voting for the most impressive catches.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Community Voting</h4>
                    <p className="text-muted-foreground">Every member gets one vote per challenge</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Winner Takes the Pot</h4>
                    <p className="text-muted-foreground">50% of all entry fees go to the winner</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Rolling Challenges</h4>
                    <p className="text-muted-foreground">New challenges every week — always something to compete in</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img src={fishingPhoto3} alt="Photo challenge winner" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Tournaments */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-1">
              <div className="bg-muted rounded-3xl p-12 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background">
                  <Trophy className="w-8 h-8 text-foreground" />
                  <div>
                    <h4 className="font-semibold text-foreground">Single Elimination</h4>
                    <p className="text-sm text-muted-foreground">One loss and you're out — high stakes fishing</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background">
                  <Award className="w-8 h-8 text-foreground" />
                  <div>
                    <h4 className="font-semibold text-foreground">Double Elimination</h4>
                    <p className="text-sm text-muted-foreground">Two chances to prove your skills</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background">
                  <DollarSign className="w-8 h-8 text-foreground" />
                  <div>
                    <h4 className="font-semibold text-foreground">Scored by Weight or Length</h4>
                    <p className="text-sm text-muted-foreground">Biggest catch or total weight wins</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Tournaments</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Bracket-Style Competition
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Classic tournament formats where anglers face off head-to-head. 
                Climb the bracket, beat your opponents, and take the title.
              </p>
            </div>
          </div>

          {/* Team Competitions */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Team Competitions</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Strength in Numbers
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Form a team with your fishing crew. Compete together across categories, 
                climb the team leaderboard, and dominate your region.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Build Your Crew</h4>
                    <p className="text-muted-foreground">Invite buddies and form a competitive team</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Trophy className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Category-Based</h4>
                    <p className="text-muted-foreground">Compete by species, location, or skill level</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Award className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Team Leaderboard</h4>
                    <p className="text-muted-foreground">Track your team's standing against the competition</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-3xl p-12 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Team Leaderboard</h3>
                <p className="text-muted-foreground">See where your crew ranks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 section-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Ready to compete?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join thousands of anglers entering challenges every week. Your next trophy catch could win you real prizes.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Challenges;