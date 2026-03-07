import { useState, useRef } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SendNotificationDialog = ({ open, onOpenChange }: Props) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and text are required"); return; }
    setSending(true);

    let image_url: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("notification-images")
        .upload(path, imageFile);
      if (uploadErr) { toast.error("Image upload failed"); setSending(false); return; }
      const { data: urlData } = supabase.storage.from("notification-images").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("customer_notifications").insert({
      title: title.trim(),
      body: body.trim(),
      image_url,
    } as any);

    setSending(false);
    if (error) { toast.error("Failed to send: " + error.message); return; }

    toast.success("Notification sent to all customers!");
    setTitle("");
    setBody("");
    clearImage();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Send Push Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="notif-title">Title</Label>
            <Input id="notif-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New class available!" className="mt-1.5 bg-secondary border-border" />
          </div>
          <div>
            <Label htmlFor="notif-body">Message</Label>
            <Textarea id="notif-body" value={body} onChange={e => setBody(e.target.value)} placeholder="Write your notification message..." rows={3} className="mt-1.5 bg-secondary border-border" />
          </div>
          <div>
            <Label>Image (optional)</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative mt-1.5 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background" onClick={clearImage}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="mt-1.5 gap-2 w-full" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> Add Image
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="gap-2">
            <Send className="h-3.5 w-3.5" /> {sending ? "Sending..." : "Send to All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendNotificationDialog;
