import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuditAction } from '@/hooks/use-audit-logs';

interface ImportSpotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedSpot {
  name: string;
  description?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  species_available?: string[];
  is_public?: boolean;
  is_verified?: boolean;
  photos?: string[];
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Convert Google Drive sharing links to direct image URLs
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return '';
  const trimmedUrl = url.trim();
  
  // Match Google Drive file URLs: /file/d/{FILE_ID}/...
  const fileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }
  
  // Match Google Drive open URLs: /open?id={FILE_ID}
  const openMatch = trimmedUrl.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  }
  
  // Return as-is if not a Google Drive link
  return trimmedUrl;
};

// Detect if a header is an image column
const isImageHeader = (header: string): boolean => {
  const normalized = header.toLowerCase().trim();
  const imagePatterns = [
    'image', 'photo', 'picture', 'img', 'thumbnail',
    'image_url', 'photo_url', 'image url', 'photo url',
    'imageurl', 'photourl', 'pic', 'pics'
  ];
  
  // Check for exact matches or patterns with numbers (image_url_1, image 1, etc.)
  return imagePatterns.some(pattern => 
    normalized === pattern || 
    normalized.startsWith(pattern + ' ') ||
    normalized.startsWith(pattern + '_') ||
    normalized.includes(pattern)
  );
};

export function ImportSpotsDialog({ open, onOpenChange }: ImportSpotsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedSpots, setParsedSpots] = useState<ParsedSpot[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  const resetState = () => {
    setFile(null);
    setParsedSpots([]);
    setProgress(0);
    setResult(null);
  };

  const handleClose = () => {
    if (!importing) {
      resetState();
      onOpenChange(false);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const parseFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);

    const text = await selectedFile.text();
    const rows = parseCSV(text);
    
    if (rows.length < 2) {
      toast.error('File must have a header row and at least one data row');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'spot name' || h === 'spot_name');
    const descIdx = headers.findIndex(h => h === 'description' || h === 'desc');
    const locationIdx = headers.findIndex(h => h === 'location' || h === 'location_name' || h === 'address');
    const latIdx = headers.findIndex(h => h === 'latitude' || h === 'lat' || h === 'location_lat');
    const lngIdx = headers.findIndex(h => h === 'longitude' || h === 'lng' || h === 'lon' || h === 'location_lng');
    const speciesIdx = headers.findIndex(h => h === 'species' || h === 'species_available' || h === 'fish');
    const publicIdx = headers.findIndex(h => h === 'public' || h === 'is_public');
    const verifiedIdx = headers.findIndex(h => h === 'verified' || h === 'is_verified');

    // Find all image columns
    const imageColumnIndices: number[] = [];
    headers.forEach((header, idx) => {
      if (isImageHeader(header)) {
        imageColumnIndices.push(idx);
      }
    });

    if (nameIdx === -1) {
      toast.error('CSV must have a "name" column');
      return;
    }

    const spots: ParsedSpot[] = rows.slice(1).map((row, index) => {
      const errors: string[] = [];
      const name = row[nameIdx]?.trim() || '';
      
      if (!name) {
        errors.push(`Row ${index + 2}: Name is required`);
      }

      let lat: number | undefined;
      let lng: number | undefined;

      if (latIdx !== -1 && row[latIdx]) {
        lat = parseFloat(row[latIdx]);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          errors.push(`Row ${index + 2}: Invalid latitude`);
          lat = undefined;
        }
      }

      if (lngIdx !== -1 && row[lngIdx]) {
        lng = parseFloat(row[lngIdx]);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          errors.push(`Row ${index + 2}: Invalid longitude`);
          lng = undefined;
        }
      }

      // Default to Miami if no coordinates
      if (!lat) lat = 25.7617;
      if (!lng) lng = -80.1918;

      let species: string[] | undefined;
      if (speciesIdx !== -1 && row[speciesIdx]) {
        species = row[speciesIdx].split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      }

      // Parse photos from image columns
      const photos: string[] = [];
      imageColumnIndices.forEach(imgIdx => {
        const rawUrl = row[imgIdx]?.trim();
        if (rawUrl) {
          const convertedUrl = convertGoogleDriveUrl(rawUrl);
          if (convertedUrl) {
            photos.push(convertedUrl);
          }
        }
      });

      const parseBoolean = (val?: string): boolean => {
        if (!val) return false;
        return ['true', 'yes', '1', 'y'].includes(val.toLowerCase().trim());
      };

      return {
        name,
        description: descIdx !== -1 ? row[descIdx]?.trim() : undefined,
        location_name: locationIdx !== -1 ? row[locationIdx]?.trim() : undefined,
        location_lat: lat,
        location_lng: lng,
        species_available: species,
        is_public: publicIdx !== -1 ? parseBoolean(row[publicIdx]) : true,
        is_verified: verifiedIdx !== -1 ? parseBoolean(row[verifiedIdx]) : false,
        photos: photos.length > 0 ? photos : undefined,
        valid: errors.length === 0 && !!name,
        errors,
      };
    }).filter(spot => spot.name); // Filter out empty rows

    setParsedSpots(spots);
    
    // Show info about detected image columns
    if (imageColumnIndices.length > 0) {
      const totalPhotos = spots.reduce((sum, s) => sum + (s.photos?.length || 0), 0);
      toast.success(`Detected ${imageColumnIndices.length} image column(s) with ${totalPhotos} total photos`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(csv|txt)$/i)) {
        toast.error('Please upload a CSV file');
        return;
      }
      parseFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(csv|txt)$/i)) {
        toast.error('Please upload a CSV file');
        return;
      }
      parseFile(droppedFile);
    }
  };

  const handleImport = async () => {
    const validSpots = parsedSpots.filter(s => s.valid);
    if (validSpots.length === 0) {
      toast.error('No valid spots to import');
      return;
    }

    setImporting(true);
    setProgress(0);

    const results: ImportResult = { success: 0, failed: 0, errors: [] };
    const batchSize = 10;
    const batches = Math.ceil(validSpots.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = validSpots.slice(i * batchSize, (i + 1) * batchSize);
      
      const spotsToInsert = batch.map(spot => ({
        name: spot.name,
        description: spot.description || null,
        location_name: spot.location_name || null,
        location_lat: spot.location_lat || 25.7617,
        location_lng: spot.location_lng || -80.1918,
        species_available: spot.species_available || null,
        is_public: spot.is_public ?? true,
        is_verified: spot.is_verified ?? false,
        photos: spot.photos || null,
      }));

      const { data, error } = await supabase
        .from('fishing_spots')
        .insert(spotsToInsert)
        .select('id');

      if (error) {
        results.failed += batch.length;
        results.errors.push(`Batch ${i + 1}: ${error.message}`);
      } else {
        results.success += data?.length || 0;
      }

      setProgress(Math.round(((i + 1) / batches) * 100));
    }

    setResult(results);
    setImporting(false);

    if (results.success > 0) {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(`Successfully imported ${results.success} spots`);
      await logAction('spots_bulk_import', 'spot', undefined, { 
        imported: results.success, 
        failed: results.failed 
      });
    }

    if (results.failed > 0) {
      toast.error(`Failed to import ${results.failed} spots`);
    }
  };

  const downloadTemplate = () => {
    const template = `name,description,location,latitude,longitude,species,public,verified,image_url_1,image_url_2,image_url_3
"Bass Lake","Great bass fishing spot","Lake Road, Florida",28.5383,-81.3792,"Largemouth Bass,Bluegill",true,false,"https://example.com/bass-lake.jpg","",""
"Sunset Pier","Ocean fishing pier","Miami Beach, FL",25.7906,-80.1300,"Snapper,Grouper,Mahi-mahi",true,true,"https://drive.google.com/file/d/abc123/view","https://example.com/pier2.jpg",""`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fishing_spots_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validCount = parsedSpots.filter(s => s.valid).length;
  const invalidCount = parsedSpots.filter(s => !s.valid).length;
  const totalPhotos = parsedSpots.reduce((sum, s) => sum + (s.photos?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Import Fishing Spots
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a CSV file to bulk import fishing spots. Supports image URLs including Google Drive links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File Upload Area */}
          {!file && (
            <div
              className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-300 mb-2">Drag and drop your CSV file here</p>
              <p className="text-sm text-slate-500">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected */}
          {file && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-slate-400">
                      {parsedSpots.length} spots found
                    </p>
                  </div>
                </div>
                {!importing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetState}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Validation Summary */}
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-green-500/20 text-green-400 border-0">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {validCount} valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {invalidCount} invalid
                  </Badge>
                )}
                {totalPhotos > 0 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-0">
                    <Image className="w-3 h-3 mr-1" />
                    {totalPhotos} photos
                  </Badge>
                )}
              </div>

              {/* Preview */}
              <ScrollArea className="h-48 rounded-lg border border-slate-700">
                <div className="p-3 space-y-2">
                  {parsedSpots.slice(0, 20).map((spot, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-sm ${
                        spot.valid 
                          ? 'bg-slate-800/50' 
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{spot.name}</span>
                          {spot.photos && spot.photos.length > 0 && (
                            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                              <Image className="w-3 h-3 mr-1" />
                              {spot.photos.length}
                            </Badge>
                          )}
                        </div>
                        {spot.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      {spot.location_name && (
                        <p className="text-slate-400 text-xs mt-1">{spot.location_name}</p>
                      )}
                      {spot.errors.length > 0 && (
                        <p className="text-red-400 text-xs mt-1">{spot.errors.join(', ')}</p>
                      )}
                    </div>
                  ))}
                  {parsedSpots.length > 20 && (
                    <p className="text-center text-slate-500 text-sm py-2">
                      +{parsedSpots.length - 20} more spots...
                    </p>
                  )}
                </div>
              </ScrollArea>

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-slate-400 text-center">
                    Importing... {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800 space-y-3">
                <h4 className="font-medium text-white">Import Complete</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">{result.success} imported</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{result.failed} failed</span>
                    </div>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="text-sm text-red-400 space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={importing}
            className="border-slate-600 text-slate-300"
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && file && (
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {importing ? 'Importing...' : `Import ${validCount} Spots`}
            </Button>
          )}
          {result && (
            <Button
              onClick={resetState}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Import More
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
