import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, User, Mail, Phone, MapPin, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/PhoneInput";
import { cn } from "@/lib/utils";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PartnerRequestForm = ({ open, onOpenChange }: Props) => {
  const [clubName, setClubName] = useState("");
  const [clubLocation, setClubLocation] = useState("");
  const [contactRole, setContactRole] = useState<"owner" | "manager">("owner");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    clubName.trim().length > 0 &&
    clubLocation.trim().length > 0 &&
    contactName.trim().length > 0 &&
    isValidEmail(email) &&
    phone.trim().length >= 4 &&
    description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const { error } = await supabase.from("partner_requests" as any).insert({
      club_name: clubName.trim(),
      club_location: clubLocation.trim(),
      contact_role: contactRole,
      contact_name: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      description: description.trim(),
      message: message.trim(),
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit request. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setClubName("");
      setClubLocation("");
      setContactRole("owner");
      setContactName("");
      setEmail("");
      setPhone("");
      setDescription("");
      setMessage("");
      setSubmitted(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
        {submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-12 text-center space-y-4"
          >
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground">Request Submitted!</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Thank you for your interest in partnering with us. Our team will review your request and get back to you shortly.
            </p>
            <Button onClick={handleClose} variant="outline" className="mt-4">
              Close
            </Button>
          </motion.div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Become a Partner
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fill out the form below and we'll get in touch with you.
              </p>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Club Name */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Club / Studio Name *
                </Label>
                <Input
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. Fitness Lab"
                  maxLength={100}
                  className="h-11 bg-secondary border-border"
                />
              </div>

              {/* Club Location */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Location *
                </Label>
                <Input
                  value={clubLocation}
                  onChange={(e) => setClubLocation(e.target.value)}
                  placeholder="e.g. Beirut, Hamra"
                  maxLength={200}
                  className="h-11 bg-secondary border-border"
                />
              </div>

              {/* Contact Role */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5">I am the *</Label>
                <div className="flex gap-2">
                  {(["owner", "manager"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setContactRole(role)}
                      className={cn(
                        "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-all",
                        contactRole === role
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Name */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name *
                </Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                  className="h-11 bg-secondary border-border"
                />
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email *
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  maxLength={255}
                  className="h-11 bg-secondary border-border"
                />
              </div>

              {/* Phone */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone Number *
                </Label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Describe Your Club / Studio *
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What activities do you offer? How many courts/studios? Tell us about your space..."
                  maxLength={1000}
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1.5">Additional Message (optional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Anything else you'd like us to know..."
                  maxLength={500}
                  rows={2}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full h-12 font-bold rounded-xl glow text-sm uppercase tracking-wider"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartnerRequestForm;
