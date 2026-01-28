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
import * as XLSX from 'xlsx';

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
  area_type?: 'freshwater' | 'saltwater';
  photos?: string[];
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Convert Google Drive sharing links to embeddable thumbnail URLs
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return '';
  const trimmedUrl = url.trim();
  
  let fileId: string | null = null;
  
  // Match Google Drive file URLs: /file/d/{FILE_ID}/...
  const fileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    fileId = fileMatch[1];
  }
  
  // Match Google Drive open URLs: /open?id={FILE_ID}
  const openMatch = trimmedUrl.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) {
    fileId = openMatch[1];
  }
  
  // Match existing uc?export=view URLs
  const ucMatch = trimmedUrl.match(/drive\.google\.com\/uc\?export=view&id=([^&]+)/);
  if (ucMatch) {
    fileId = ucMatch[1];
  }
  
  // Convert to lh3.googleusercontent.com thumbnail URL
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }
  
  return trimmedUrl;
};

// Normalize header names for flexible matching
const normalizeHeader = (header: string): string => {
  return header.toLowerCase().trim().replace(/[\s_-]+/g, '');
};

// Map normalized headers to field names
const HEADER_MAPPINGS: Record<string, string> = {
  'name': 'name',
  'spotname': 'name',
  'spot_name': 'name',
  'description': 'description',
  'desc': 'description',
  'placedescription': 'description',
  'place_description': 'description',
  'location': 'location_name',
  'locationname': 'location_name',
  'location_name': 'location_name',
  'address': 'location_name',
  'latitude': 'latitude',
  'lat': 'latitude',
  'locationlat': 'latitude',
  'location_lat': 'latitude',
  'longitude': 'longitude',
  'lng': 'longitude',
  'lon': 'longitude',
  'locationlng': 'longitude',
  'location_lng': 'longitude',
  'species': 'species',
  'speciesavailable': 'species',
  'species_available': 'species',
  'fish': 'species',
  'specie': 'species',
  'public': 'is_public',
  'ispublic': 'is_public',
  'is_public': 'is_public',
  'publicspot': 'is_public',
  'public_spot': 'is_public',
  'verified': 'is_verified',
  'isverified': 'is_verified',
  'is_verified': 'is_verified',
  'verifiedspot': 'is_verified',
  'verified_spot': 'is_verified',
  'areatype': 'area_type',
  'area_type': 'area_type',
  'watertype': 'area_type',
  'water_type': 'area_type',
  'type': 'area_type',
};

// Detect if a header is an image column
const isImageHeader = (header: string): boolean => {
  const normalized = normalizeHeader(header);
  const imagePatterns = [
    'image', 'photo', 'picture', 'img', 'thumbnail',
    'imageurl', 'photourl', 'picurl', 'imgurl'
  ];
  
  return imagePatterns.some(pattern => 
    normalized === pattern || 
    normalized.startsWith(pattern) ||
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

  const parseExcel = async (selectedFile: File): Promise<string[][]> => {
    const buffer = await selectedFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' });
    return jsonData.map(row => row.map(cell => String(cell ?? '').trim()));
  };

  const processRows = (rows: string[][], headers: string[]): ParsedSpot[] => {
    // Normalize headers and create index mapping
    const headerMap: Record<string, number> = {};
    const imageColumnIndices: number[] = [];

    headers.forEach((header, idx) => {
      const normalized = normalizeHeader(header);
      const mappedField = HEADER_MAPPINGS[normalized];
      
      if (mappedField) {
        headerMap[mappedField] = idx;
      }
      
      if (isImageHeader(header)) {
        imageColumnIndices.push(idx);
      }
    });

    // Ensure we have a name column
    if (headerMap['name'] === undefined) {
      toast.error('File must have a "name" or "spot name" column');
      return [];
    }

    const spots: ParsedSpot[] = rows.slice(1).map((row, index) => {
      const errors: string[] = [];
      const getValue = (field: string): string | undefined => {
        const idx = headerMap[field];
        return idx !== undefined ? row[idx]?.trim() : undefined;
      };

      const name = getValue('name') || '';
      
      if (!name) {
        errors.push(`Row ${index + 2}: Name is required`);
      }

      // Parse coordinates
      let lat: number | undefined;
      let lng: number | undefined;

      const latStr = getValue('latitude');
      if (latStr) {
        lat = parseFloat(latStr);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          errors.push(`Row ${index + 2}: Invalid latitude`);
          lat = undefined;
        }
      }

      const lngStr = getValue('longitude');
      if (lngStr) {
        lng = parseFloat(lngStr);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          errors.push(`Row ${index + 2}: Invalid longitude`);
          lng = undefined;
        }
      }

      // Default to Miami if no coordinates
      if (!lat) lat = 25.7617;
      if (!lng) lng = -80.1918;

      // Parse species (comma, semicolon, or pipe separated)
      let species: string[] | undefined;
      const speciesStr = getValue('species');
      if (speciesStr) {
        species = speciesStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      }

      // Parse area type
      let areaType: 'freshwater' | 'saltwater' | undefined;
      const areaTypeStr = getValue('area_type')?.toLowerCase().trim();
      if (areaTypeStr) {
        if (areaTypeStr.includes('salt')) {
          areaType = 'saltwater';
        } else if (areaTypeStr.includes('fresh')) {
          areaType = 'freshwater';
        }
      }

      // Parse photos from all image columns
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
        description: getValue('description'),
        location_name: getValue('location_name'),
        location_lat: lat,
        location_lng: lng,
        species_available: species,
        is_public: getValue('is_public') ? parseBoolean(getValue('is_public')) : true,
        is_verified: getValue('is_verified') ? parseBoolean(getValue('is_verified')) : false,
        area_type: areaType || 'freshwater',
        photos: photos.length > 0 ? photos : undefined,
        valid: errors.length === 0 && !!name,
        errors,
      };
    }).filter(spot => spot.name);

    return spots;
  };

  const parseFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);

    try {
      let rows: string[][];
      const isExcel = selectedFile.name.match(/\.xlsx?$/i);

      if (isExcel) {
        rows = await parseExcel(selectedFile);
      } else {
        const text = await selectedFile.text();
        rows = parseCSV(text);
      }

      if (rows.length < 2) {
        toast.error('File must have a header row and at least one data row');
        return;
      }

      const headers = rows[0];
      const spots = processRows(rows, headers);
      
      setParsedSpots(spots);

      // Show summary
      const totalPhotos = spots.reduce((sum, s) => sum + (s.photos?.length || 0), 0);
      const saltwaterCount = spots.filter(s => s.area_type === 'saltwater').length;
      const freshwaterCount = spots.filter(s => s.area_type === 'freshwater').length;

      toast.success(
        `Parsed ${spots.length} spots: ${saltwaterCount} saltwater, ${freshwaterCount} freshwater, ${totalPhotos} photos`
      );
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please check the format.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(csv|txt|xlsx|xls)$/i)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      parseFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(csv|txt|xlsx|xls)$/i)) {
        toast.error('Please upload a CSV or Excel file');
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
        species_available: null, // Species are UUIDs, will need to be set separately
        is_public: spot.is_public ?? true,
        is_verified: spot.is_verified ?? false,
        area_type: spot.area_type || 'freshwater',
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
    const template = `Spot Name,Place Description,Location Name,Latitude,Longitude,Specie (Seperate with comma),Public spot,Verified Spot,Image Url 1,Image Url 2,Image Url 3,Area Type
"Bass Lake","Great bass fishing spot","Lake Road, Florida",28.5383,-81.3792,"Largemouth Bass,Bluegill",TRUE,FALSE,"https://example.com/bass-lake.jpg","","",Fresh Water
"Sunset Pier","Ocean fishing pier","Miami Beach, FL",25.7906,-80.1300,"Snapper,Grouper,Mahi-mahi",TRUE,TRUE,"https://drive.google.com/file/d/abc123/view","https://example.com/pier2.jpg","",Salt Water`;
    
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
  const saltwaterCount = parsedSpots.filter(s => s.area_type === 'saltwater').length;
  const freshwaterCount = parsedSpots.filter(s => s.area_type === 'freshwater').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Import Fishing Spots
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a CSV or Excel file to bulk import fishing spots. Supports image URLs including Google Drive links.
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
              <p className="text-slate-300 mb-2">Drag and drop your CSV or Excel file here</p>
              <p className="text-sm text-slate-500">Supports .csv, .xlsx, .xls files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
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
                {saltwaterCount > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0">
                    🌊 {saltwaterCount} saltwater
                  </Badge>
                )}
                {freshwaterCount > 0 && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    🏞️ {freshwaterCount} freshwater
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
                          <Badge variant="outline" className={`text-xs ${
                            spot.area_type === 'saltwater' 
                              ? 'border-blue-500/50 text-blue-400' 
                              : 'border-emerald-500/50 text-emerald-400'
                          }`}>
                            {spot.area_type === 'saltwater' ? '🌊' : '🏞️'}
                          </Badge>
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
                      {spot.species_available && spot.species_available.length > 0 && (
                        <p className="text-cyan-400 text-xs mt-1">
                          🐟 {spot.species_available.slice(0, 3).join(', ')}
                          {spot.species_available.length > 3 && ` +${spot.species_available.length - 3} more`}
                        </p>
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
