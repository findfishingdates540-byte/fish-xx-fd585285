import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import contactHero from '@/assets/contact-hero.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
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
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Contact Us</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Get in Touch
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Have questions, feedback, or need assistance? We're here to help. 
                Reach out to us and we'll respond as quickly as possible.
              </p>
            </motion.div>
            <motion.div 
              className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src={contactHero} alt="Contact support team" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Contact Methods */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
            <StaggerItem>
              <motion.div 
                className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Email Us</h3>
                <p className="text-muted-foreground">
                  support@findfishingdates.com
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div 
                className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Phone className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Call Us</h3>
                <p className="text-muted-foreground">
                  1-800-FISH-DATE
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div 
                className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <MapPin className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Location</h3>
                <p className="text-muted-foreground">
                  123 Fishing Lane<br />Lake City, FL 32055
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div 
                className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Hours</h3>
                <p className="text-muted-foreground">
                  24/7 Support<br />Always available
                </p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            <ScrollReveal direction="left" className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Send Us a Message
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Fill out the form and our team will get back to you within 24 hours. 
                For urgent matters, please use our in-app support or call us directly.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MessageSquare className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">General Inquiries</h4>
                    <p className="text-muted-foreground">Questions about our platform, features, or pricing</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MessageSquare className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Technical Support</h4>
                    <p className="text-muted-foreground">Help with account issues, bugs, or technical problems</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MessageSquare className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Partnership Opportunities</h4>
                    <p className="text-muted-foreground">Business collaborations and media inquiries</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right" delay={0.2}>
              <div className="bg-muted rounded-3xl p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="bg-background"
                    />
                  </div>
                  
                  <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <Send className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Find quick answers to common questions in our Help Center.
          </p>
          <Link to="/help">
            <Button className="btn-primary">
              Visit Help Center
            </Button>
          </Link>
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Contact;
