import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Fish, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export default function AddSpot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location_name: "",
    location_lat: "",
    location_lng: "",
    species_available: "",
    is_public: true,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limit to 5 images
    const remaining = 5 - selectedImages.length;
    const newFiles = files.slice(0, remaining);
    
    if (files.length > remaining) {
      toast.error(`You can only add ${remaining} more image(s)`);
    }
    
    setSelectedImages(prev => [...prev, ...newFiles]);
    
    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    for (const file of selectedImages) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('spot-photos')
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('spot-photos')
        .getPublicUrl(fileName);
      
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    
    setUploading(false);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to add a spot");
      return;
    }

    if (!formData.name || !formData.location_lat || !formData.location_lng) {
      toast.error("Please fill in the required fields");
      return;
    }

    setLoading(true);
    
    try {
      // Upload images first
      const photoUrls = await uploadImages();
      
      const { error } = await supabase.from("fishing_spots").insert({
        name: formData.name,
        description: formData.description || null,
        location_name: formData.location_name || null,
        location_lat: parseFloat(formData.location_lat),
        location_lng: parseFloat(formData.location_lng),
        species_available: formData.species_available 
          ? formData.species_available.split(",").map(s => s.trim()) 
          : null,
        is_public: formData.is_public,
        created_by: user.id,
        photos: photoUrls.length > 0 ? photoUrls : null,
      });

      if (error) throw error;

      toast.success("Spot added successfully!");
      navigate("/app/spots");
    } catch (err) {
      console.error("Error adding spot:", err);
      toast.error("Failed to add spot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location_lat: position.coords.latitude.toString(),
            location_lng: position.coords.longitude.toString(),
          }));
          toast.success("Location captured!");
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not get your location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/spots")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Spot</h1>
            <p className="text-muted-foreground text-sm">
              Share your favorite fishing location
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5" />
              Spot Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Spot Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lake Johnson Pier"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label>Spot Photos</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add up to 5 photos of this fishing spot
                </p>
                
                {/* Image previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add photo button */}
                {selectedImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors"
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to add photos ({selectedImages.length}/5)
                    </span>
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell others about this spot..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Location Name */}
              <div className="space-y-2">
                <Label htmlFor="location_name">Location Name</Label>
                <Input
                  id="location_name"
                  placeholder="e.g., Lake Johnson, Raleigh NC"
                  value={formData.location_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                />
              </div>

              {/* Coordinates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Coordinates *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetCurrentLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Location
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Latitude"
                      value={formData.location_lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_lat: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Longitude"
                      value={formData.location_lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_lng: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Species */}
              <div className="space-y-2">
                <Label htmlFor="species">Fish Species Available</Label>
                <Input
                  id="species"
                  placeholder="e.g., Bass, Trout, Catfish (comma separated)"
                  value={formData.species_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, species_available: e.target.value }))}
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_public">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other anglers to discover this spot
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/app/spots")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Spot"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
