import { useState } from 'react';
import { PageMeta } from '@/components/seo/PageMeta';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { contactFormSchema } from '@/lib/validation';
import { canPerformAction } from '@/lib/rate-limit';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, Copy, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import contactHero from '@/assets/contact-hero.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Client-side validation
    const result = contactFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    // Client-side rate limiting
    if (!canPerformAction('contact-form', 10000)) {
      toast({
        title: "Please wait",
        description: "You can submit another ticket in a few seconds.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('submit-support-ticket', {
        body: formData
      });

      if (error) throw error;

      setSubmittedTicket(data.ticketNumber);
      toast({
        title: "Ticket submitted!",
        description: `Your ticket ${data.ticketNumber} has been created. Check your email for confirmation.`,
      });
      setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
    } catch (error: any) {
      toast({
        title: "Failed to submit",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicketNumber = () => {
    if (submittedTicket) {
      navigator.clipboard.writeText(submittedTicket);
      toast({ title: "Copied!", description: "Ticket number copied to clipboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Contact FishX — Get in Touch"
        description="Reach the FishX team for support, partnerships, press, or feedback. We typically reply within one business day."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "FishX",
          url: "https://fish-x.com",
          email: "support@fish-x.com",
          telephone: "1-800-FISHX-APP",
          address: {
            "@type": "PostalAddress",
            streetAddress: "123 Fishing Lane",
            addressLocality: "Lake City",
            addressRegion: "FL",
            postalCode: "32055",
            addressCountry: "US",
          },
          openingHours: "Mo-Su 00:00-23:59",
        }}
      />
      <PublicHeader />

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div className="space-y-8" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Contact Us</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">Get in Touch</h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">Have questions, feedback, or need assistance? We're here to help.</p>
            </motion.div>
            <motion.div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <img src={contactHero} alt="Contact support team" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Contact Methods */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
            {[
              { icon: Mail, title: 'Email Us', content: 'support@fish-x.com' },
              { icon: Phone, title: 'Call Us', content: '1-800-FISHX-APP' },
              { icon: MapPin, title: 'Location', content: '123 Fishing Lane\nLake City, FL 32055' },
              { icon: Clock, title: 'Hours', content: '24/7 Support\nAlways available' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <motion.div className="bg-background rounded-3xl p-8 space-y-4 border border-border text-center h-full" whileHover={{ y: -8 }}>
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <item.icon className="w-7 h-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{item.content}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            <ScrollReveal direction="left" className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Send Us a Message</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">Fill out the form and our team will get back to you within 24 hours.</p>
              <div className="space-y-6">
                {['General Inquiries', 'Technical Support', 'Partnership Opportunities'].map((title, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <MessageSquare className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground">{title}</h4>
                      <p className="text-muted-foreground">{['Questions about our platform', 'Help with account issues or bugs', 'Business collaborations'][i]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right" delay={0.2}>
              <div className="bg-muted rounded-3xl p-8 md:p-12">
                {submittedTicket ? (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Ticket Submitted!</h3>
                    <p className="text-muted-foreground">Your ticket number is:</p>
                    <div className="flex items-center justify-center gap-2 bg-background rounded-lg p-4">
                      <code className="text-lg font-mono text-primary">{submittedTicket}</code>
                      <Button variant="ghost" size="icon" onClick={copyTicketNumber}><Copy className="w-4 h-4" /></Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Check your email for confirmation. We'll respond within 24-48 hours.</p>
                    <Button onClick={() => setSubmittedTicket(null)}>Submit Another Request</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required maxLength={100} className="bg-background" />
                      {validationErrors.name && <p className="text-sm text-destructive">{validationErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required maxLength={255} className="bg-background" />
                      {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="safety">Safety Concern</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="How can we help?" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required maxLength={200} className="bg-background" />
                      {validationErrors.subject && <p className="text-sm text-destructive">{validationErrors.subject}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message <span className="text-muted-foreground text-xs">({formData.message.length}/5000)</span></Label>
                      <Textarea id="message" placeholder="Tell us more..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={6} maxLength={5000} className="bg-background" />
                      {validationErrors.message && <p className="text-sm text-destructive">{validationErrors.message}</p>}
                    </div>
                    <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Ticket'}<Send className="ml-2 w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground mb-8">Find quick answers in our Help Center.</p>
          <Link to="/help"><Button className="btn-primary">Visit Help Center</Button></Link>
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Contact;
