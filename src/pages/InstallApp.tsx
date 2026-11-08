import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, Check, ShieldCheck, MapPin, Trophy, Users, ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { motion } from 'framer-motion';
import mobileAppScreen from '@/assets/mobile-app-screen.png';

const APK_URL = 'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/apk-downloads/Fish-X.apk';

const features = [
  { icon: MapPin, title: 'Discover fishing spots', description: 'Explore community-shared spots and save your own private honey holes.' },
  { icon: Trophy, title: 'Compete & win prizes', description: 'Join championships, photo challenges, and tournaments from your pocket.' },
  { icon: Users, title: 'Connect with anglers', description: 'Message buddies, share catches, and build your fishing crew.' },
];

const installSteps = [
  { step: 1, title: 'Download the app', description: 'Tap the download button below to get the Fish-X app file on your phone.' },
  { step: 2, title: 'Open the file', description: 'Find the downloaded file in your notifications or Downloads folder and tap it.' },
  { step: 3, title: 'Allow installation', description: 'If your phone asks, allow installs from this source — Fish-X is safe and verified by our team.' },
  { step: 4, title: 'Sign in & fish', description: 'Open Fish-X, sign in or create a free account, and start logging catches.' },
];

const InstallApp = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Get the Fish-X App — Download for Android"
        description="Download the Fish-X mobile app. Discover fishing spots, log catches, join competitions, and connect with anglers wherever you are."
        path="/install"
      />
      <PublicHeader />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 px-6 border-b border-border overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal direction="left" className="space-y-8">
                <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Mobile App</span>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                  Take the catch<br />with you
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Download the Fish-X mobile app and start connecting with anglers
                  wherever you are. Discover spots, log catches, and plan trips on the go.
                </p>

                <StaggerContainer className="space-y-3" staggerDelay={0.1}>
                  {['Instant match notifications', 'Log catches anywhere', 'Discover nearby fishing spots'].map((item) => (
                    <StaggerItem key={item} className="flex items-center gap-3 text-foreground">
                      <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="w-3 h-3 text-background" />
                      </div>
                      <span>{item}</span>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <motion.div
                  className="flex flex-wrap gap-4 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <motion.a
                    href={APK_URL}
                    download="Fish-X.apk"
                    className="flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-xl group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-7 h-7 transition-transform group-hover:translate-y-0.5" />
                    <div className="text-left">
                      <p className="text-xs opacity-80">Download for Android</p>
                      <p className="text-lg font-semibold -mt-1">Get the App</p>
                    </div>
                  </motion.a>
                </motion.div>

                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  Free download · Served directly from Fish-X
                </p>
              </ScrollReveal>

              {/* Phone Mockup */}
              <ScrollReveal direction="right" delay={0.2} className="flex justify-center lg:justify-end">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-foreground/10 blur-3xl rounded-full scale-150"
                    animate={{ scale: [1.5, 1.6, 1.5], opacity: [0.3, 0.4, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative w-72 h-[580px] bg-foreground rounded-[3rem] p-2 shadow-2xl"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-foreground rounded-b-2xl z-10" />
                      <img
                        src={mobileAppScreen}
                        alt="Fish-X mobile app preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* How to install */}
        <section className="py-24 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal className="text-center space-y-4 mb-16">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Easy setup</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">How to install</h2>
              <p className="text-xl text-muted-foreground">Up and running in under a minute.</p>
            </ScrollReveal>

            <StaggerContainer className="grid md:grid-cols-2 gap-6" staggerDelay={0.12}>
              {installSteps.map((s) => (
                <StaggerItem key={s.step} className="flex gap-5 p-6 rounded-2xl border border-border bg-card">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold">
                    {s.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal className="text-center space-y-4 mb-16">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Why Fish-X</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Everything in your pocket</h2>
            </ScrollReveal>

            <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
              {features.map((f) => (
                <StaggerItem key={f.title} className="text-center space-y-4 p-8 rounded-2xl border border-border bg-card">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-foreground text-background flex items-center justify-center">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <ScrollReveal className="space-y-4">
              <Smartphone className="w-12 h-12 mx-auto text-foreground" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Ready to fish smarter?</h2>
              <p className="text-xl text-muted-foreground">
                Download the app now, or create a free account and explore on the web.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.15} className="flex flex-wrap justify-center gap-4">
              <a href={APK_URL} download="Fish-X.apk">
                <Button size="lg" className="btn-primary text-lg px-8 py-6">
                  <Download className="mr-2 w-5 h-5" />
                  Download the App
                </Button>
              </a>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 group">
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default InstallApp;
