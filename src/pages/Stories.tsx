import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Fish, MapPin, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import fishingPhoto1 from '@/assets/fishing-photo-1.jpg';
import fishingPhoto2 from '@/assets/fishing-photo-2.jpg';
import fishingPhoto3 from '@/assets/fishing-photo-3.jpg';
import fishingPhoto4 from '@/assets/fishing-photo-4.jpg';
import fishingPhoto5 from '@/assets/fishing-photo-5.jpg';
import fishingPhoto6 from '@/assets/fishing-photo-6.jpg';
import fishingPhoto7 from '@/assets/fishing-photo-7.jpg';

const stories = [
  {
    name: 'Sarah M.',
    location: 'Tampa Bay, FL',
    image: fishingPhoto1,
    quote: "I joined Fish-X to find fishing spots near me. Within a week, I connected with a group of inshore anglers who showed me the best snook spots I'd never known about. Now we fish together every weekend!",
    highlight: 'Found her fishing crew',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Ashley R.',
    location: 'Islamorada, FL',
    image: fishingPhoto2,
    quote: "As a female angler, I sometimes felt out of place. Fish-X connected me with an amazing community of women who fish. We've done permit trips, offshore runs, and even started a local tournament team.",
    highlight: 'Built a tournament team',
    icon: <Fish className="w-5 h-5" />,
  },
  {
    name: 'Emily K.',
    location: 'Lake Cumberland, KY',
    image: fishingPhoto3,
    quote: "I moved to a new state and didn't know anyone who fished. Fish-X helped me find bass fishing buddies within days. We share spots, swap tips, and push each other to land bigger fish.",
    highlight: 'Made friends in a new city',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    name: 'Jake & Friends',
    location: 'Ketchikan, AK',
    image: fishingPhoto4,
    quote: "Fish-X changed everything for us. We found the best fishing spots, planned amazing trips, and built friendships that last a lifetime. The trip planner feature is a game-changer for group adventures.",
    highlight: 'Epic group trips',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Mike T.',
    location: 'Lake Michigan, MI',
    image: fishingPhoto5,
    quote: "Night fishing used to be a solo grind. Through Fish-X I found a crew of lake trout fanatics who fish the rocks after dark. We've logged some monster catches together and even won a local challenge.",
    highlight: 'Found his night crew',
    icon: <Fish className="w-5 h-5" />,
  },
  {
    name: 'The Martinez Family',
    location: 'Key West, FL',
    image: fishingPhoto6,
    quote: "We wanted to get our kids into fishing but didn't know where to start. Fish-X connected us with family-friendly charters and other fishing families. Our son caught his first mahi-mahi and was hooked for life!",
    highlight: 'Family fishing adventures',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    name: 'Captain Dave',
    location: 'Cabo San Lucas, MX',
    image: fishingPhoto7,
    quote: "As a charter captain, Fish-X has been incredible for connecting with serious anglers. The community here is passionate, knowledgeable, and always ready for the next big catch. Best fishing platform out there.",
    highlight: 'Grew his charter business',
    icon: <MapPin className="w-5 h-5" />,
  },
];

const Stories = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Angler Stories — Real Catches, Real People"
        description="Stories from the Fish-X community: epic catches, lifelong fishing buddies, and dating connections that started on the water."
        path="/stories"
      />
      <PublicHeader />

      {/* Hero */}
      <header className="pt-32 pb-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Real Stories from<br />
              <span className="italic">Real Anglers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how Fish-X is helping anglers discover spots, find buddies, and create unforgettable fishing memories.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Stories Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          {stories.map((story, index) => (
            <ScrollReveal key={index} delay={0.1} direction={index % 2 === 0 ? 'left' : 'right'}>
              <div className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:direction-rtl' : ''}`}>
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                    <img
                      src={story.image}
                      alt={`${story.name} fishing story`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium text-foreground">
                    {story.icon}
                    {story.highlight}
                  </div>
                  <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-snug">
                    "{story.quote}"
                  </blockquote>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{story.name}</p>
                    <p className="text-muted-foreground">{story.location}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 section-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to write your story?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join thousands of anglers sharing their passion on Fish-X.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg group">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Stories;
