import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Image, Plus, RefreshCw, MinusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuditAction } from '@/hooks/use-audit-logs';
import ExcelJS from 'exceljs';

interface ImportSpotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RowAction = 'insert' | 'update' | 'skip';

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
  action: RowAction;
  existingId?: string;
  existingName?: string;
  matchReason?: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
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
  const [classifying, setClassifying] = useState(false);
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
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await selectedFile.arrayBuffer());
    const worksheet = workbook.worksheets[0];
    const rows: string[][] = [];
    worksheet.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(String(cell.value ?? '').trim());
      });
      rows.push(cells);
    });
    return rows;
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
        action: 'insert' as RowAction,
      };
    }).filter(spot => spot.name);

    return spots;
  };

  // Parse KML file (Google Earth / Maps)
  const parseKML = async (selectedFile: File): Promise<ParsedSpot[]> => {
    const text = await selectedFile.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const placemarks = Array.from(doc.getElementsByTagName('Placemark'));
    const spots: ParsedSpot[] = [];
    for (const pm of placemarks) {
      const name = pm.getElementsByTagName('name')[0]?.textContent?.trim() || '';
      const description = pm.getElementsByTagName('description')[0]?.textContent?.trim() || undefined;
      const coordsEl = pm.getElementsByTagName('coordinates')[0];
      const coordsText = coordsEl?.textContent?.trim() || '';
      // Take first coordinate triplet (lng,lat,alt)
      const first = coordsText.split(/\s+/)[0] || '';
      const parts = first.split(',').map(p => parseFloat(p));
      const lng = parts[0];
      const lat = parts[1];
      if (!name || isNaN(lat) || isNaN(lng)) continue;
      spots.push({
        name,
        description,
        location_lat: lat,
        location_lng: lng,
        is_public: true,
        is_verified: true,
        area_type: 'saltwater',
        valid: true,
        errors: [],
        action: 'insert',
      });
    }
    return spots;
  };

  // Classify parsed spots against existing DB spots: insert/update/skip
  const classifySpots = async (spots: ParsedSpot[]): Promise<ParsedSpot[]> => {
    if (spots.length === 0) return spots;
    // Fetch existing spots in bounding box of import (single query, capped)
    const lats = spots.map(s => s.location_lat!).filter(n => typeof n === 'number');
    const lngs = spots.map(s => s.location_lng!).filter(n => typeof n === 'number');
    const minLat = Math.min(...lats) - 0.05;
    const maxLat = Math.max(...lats) + 0.05;
    const minLng = Math.min(...lngs) - 0.05;
    const maxLng = Math.max(...lngs) + 0.05;

    const { data: existing } = await supabase
      .from('fishing_spots')
      .select('id,name,location_lat,location_lng')
      .gte('location_lat', minLat)
      .lte('location_lat', maxLat)
      .gte('location_lng', minLng)
      .lte('location_lng', maxLng)
      .limit(5000);

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingList = (existing || []).map(e => ({
      id: e.id as string,
      name: e.name as string,
      key: norm(e.name as string),
      lat: Number(e.location_lat),
      lng: Number(e.location_lng),
    }));

    return spots.map(spot => {
      if (!spot.valid) return spot;
      const sKey = norm(spot.name);
      const sLat = spot.location_lat!;
      const sLng = spot.location_lng!;
      // Find by name keyword overlap + within ~0.05 deg, OR very close coords
      const match = existingList.find(e => {
        const dLat = Math.abs(e.lat - sLat);
        const dLng = Math.abs(e.lng - sLng);
        const close = dLat < 0.05 && dLng < 0.05;
        const veryClose = dLat < 0.005 && dLng < 0.005;
        const nameMatch = e.key === sKey || e.key.includes(sKey) || sKey.includes(e.key);
        return (close && nameMatch) || veryClose;
      });
      if (match) {
        return {
          ...spot,
          action: 'skip' as RowAction,
          existingId: match.id,
          existingName: match.name,
          matchReason: `Matches "${match.name}"`,
        };
      }
      return spot;
    });
  };

  const parseFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setClassifying(true);

    try {
      let spots: ParsedSpot[] = [];
      const isKML = selectedFile.name.match(/\.kml$/i);
      const isExcel = selectedFile.name.match(/\.xlsx?$/i);

      if (isKML) {
        spots = await parseKML(selectedFile);
        if (spots.length === 0) {
          toast.error('No placemarks found in KML file');
          return;
        }
      } else {
        let rows: string[][];
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
        spots = processRows(rows, rows[0]);
      }

      // Classify against existing DB
      const classified = await classifySpots(spots);
      setParsedSpots(classified);

      const insertCount = classified.filter(s => s.action === 'insert' && s.valid).length;
      const skipCount = classified.filter(s => s.action === 'skip').length;
      toast.success(`Parsed ${classified.length} spots: ${insertCount} new, ${skipCount} matched existing`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please check the format.');
    } finally {
      setClassifying(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(csv|txt|xlsx|xls|kml)$/i)) {
        toast.error('Please upload a CSV, Excel, or KML file');
        return;
      }
      parseFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(csv|txt|xlsx|xls|kml)$/i)) {
        toast.error('Please upload a CSV, Excel, or KML file');
        return;
      }
      parseFile(droppedFile);
    }
  };

  const handleImport = async () => {
    const inserts = parsedSpots.filter(s => s.valid && s.action === 'insert');
    const updates = parsedSpots.filter(s => s.valid && s.action === 'update' && s.existingId);
    const totalOps = inserts.length + updates.length;
    if (totalOps === 0) {
      toast.error('Nothing to commit (everything is set to skip)');
      return;
    }

    setImporting(true);
    setProgress(0);

    const results: ImportResult = {
      inserted: 0,
      updated: 0,
      skipped: parsedSpots.filter(s => s.action === 'skip').length,
      failed: 0,
      errors: [],
    };
    let done = 0;

    // Inserts in batches of 10
    const batchSize = 10;
    for (let i = 0; i < inserts.length; i += batchSize) {
      const batch = inserts.slice(i, i + batchSize);
      const payload = batch.map(spot => ({
        name: spot.name,
        description: spot.description || null,
        location_name: spot.location_name || null,
        location_lat: spot.location_lat || 25.7617,
        location_lng: spot.location_lng || -80.1918,
        species_available: null,
        is_public: spot.is_public ?? true,
        is_verified: spot.is_verified ?? false,
        area_type: spot.area_type || 'freshwater',
        photos: spot.photos || null,
      }));
      const { data, error } = await supabase.from('fishing_spots').insert(payload).select('id');
      if (error) {
        results.failed += batch.length;
        results.errors.push(`Insert batch: ${error.message}`);
      } else {
        results.inserted += data?.length || 0;
      }
      done += batch.length;
      setProgress(Math.round((done / totalOps) * 100));
    }

    // Updates one-by-one (only set fields that have values)
    for (const spot of updates) {
      const updatePayload: Record<string, unknown> = {};
      if (spot.description) updatePayload.description = spot.description;
      if (spot.location_name) updatePayload.location_name = spot.location_name;
      if (typeof spot.location_lat === 'number') updatePayload.location_lat = spot.location_lat;
      if (typeof spot.location_lng === 'number') updatePayload.location_lng = spot.location_lng;
      if (spot.area_type) updatePayload.area_type = spot.area_type;
      if (spot.photos && spot.photos.length > 0) updatePayload.photos = spot.photos;
      if (Object.keys(updatePayload).length === 0) {
        done += 1;
        setProgress(Math.round((done / totalOps) * 100));
        continue;
      }
      const { error } = await supabase.from('fishing_spots').update(updatePayload).eq('id', spot.existingId!);
      if (error) {
        results.failed += 1;
        results.errors.push(`Update "${spot.name}": ${error.message}`);
      } else {
        results.updated += 1;
      }
      done += 1;
      setProgress(Math.round((done / totalOps) * 100));
    }

    setResult(results);
    setImporting(false);

    if (results.inserted + results.updated > 0) {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(`Inserted ${results.inserted}, updated ${results.updated}`);
      await logAction('spots_bulk_import', 'spot', undefined, { 
        inserted: results.inserted,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
      });
    }

    if (results.failed > 0) {
      toast.error(`${results.failed} operation(s) failed`);
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

  const invalidCount = parsedSpots.filter(s => !s.valid).length;
  const insertCount = parsedSpots.filter(s => s.valid && s.action === 'insert').length;
  const updateCount = parsedSpots.filter(s => s.valid && s.action === 'update').length;
  const skipCount = parsedSpots.filter(s => s.action === 'skip').length;
  const matchedCount = parsedSpots.filter(s => !!s.existingId).length;

  const setActionFor = (idx: number, action: RowAction) => {
    setParsedSpots(prev => prev.map((s, i) => (i === idx ? { ...s, action } : s)));
  };

  const bulkSetMatched = (action: RowAction) => {
    setParsedSpots(prev => prev.map(s => (s.existingId ? { ...s, action } : s)));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Import Fishing Spots
          </DialogTitle>
          <DialogDescription className="text-slate-400">
          Upload a CSV, Excel, or KML file. Each row is matched against existing spots so you can preview which will be inserted, updated, or skipped before committing.
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
              <p className="text-slate-300 mb-2">Drag and drop your CSV, Excel, or KML file here</p>
              <p className="text-sm text-slate-500">Supports .csv, .xlsx, .xls, .kml files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xlsx,.xls,.kml"
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
                  <Plus className="w-3 h-3 mr-1" />
                  {insertCount} insert
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border-0">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {updateCount} update
                </Badge>
                <Badge className="bg-slate-500/20 text-slate-300 border-0">
                  <MinusCircle className="w-3 h-3 mr-1" />
                  {skipCount} skip
                </Badge>
                {invalidCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {invalidCount} invalid
                  </Badge>
                )}
                {classifying && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-0">
                    Matching against database…
                  </Badge>
                )}
              </div>

              {/* Bulk actions for matched rows */}
              {matchedCount > 0 && !importing && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 bg-slate-800/40 rounded-lg p-2">
                  <span>{matchedCount} row(s) matched existing spots:</span>
                  <Button size="sm" variant="outline" className="h-7 border-slate-600 text-slate-200" onClick={() => bulkSetMatched('skip')}>
                    Skip all matches
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-amber-500/40 text-amber-300" onClick={() => bulkSetMatched('update')}>
                    Update all matches
                  </Button>
                </div>
              )}

              {/* Preview */}
              <ScrollArea className="h-72 rounded-lg border border-slate-700">
                <div className="p-3 space-y-2">
                  {parsedSpots.slice(0, 100).map((spot, i) => {
                    const actionColor =
                      spot.action === 'insert'
                        ? 'border-green-500/40'
                        : spot.action === 'update'
                        ? 'border-amber-500/40'
                        : 'border-slate-600/40';
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded text-sm bg-slate-800/50 border ${actionColor} ${
                          !spot.valid ? 'bg-red-500/10 border-red-500/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-white truncate">{spot.name}</span>
                            {spot.photos && spot.photos.length > 0 && (
                              <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                                <Image className="w-3 h-3 mr-1" />
                                {spot.photos.length}
                              </Badge>
                            )}
                          </div>
                          <Select
                            value={spot.action}
                            onValueChange={(v) => setActionFor(i, v as RowAction)}
                            disabled={!spot.valid}
                          >
                            <SelectTrigger className="h-7 w-28 bg-slate-900 border-slate-600 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                              <SelectItem value="insert">Insert</SelectItem>
                              <SelectItem value="update" disabled={!spot.existingId}>
                                Update
                              </SelectItem>
                              <SelectItem value="skip">Skip</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {spot.matchReason && (
                          <p className="text-amber-300 text-xs mt-1">↺ {spot.matchReason}</p>
                        )}
                        {spot.location_lat !== undefined && spot.location_lng !== undefined && (
                          <p className="text-slate-500 text-xs mt-1">
                            {spot.location_lat.toFixed(4)}, {spot.location_lng.toFixed(4)}
                            {spot.location_name ? ` · ${spot.location_name}` : ''}
                          </p>
                        )}
                        {spot.errors.length > 0 && (
                          <p className="text-red-400 text-xs mt-1">{spot.errors.join(', ')}</p>
                        )}
                      </div>
                    );
                  })}
                  {parsedSpots.length > 100 && (
                    <p className="text-center text-slate-500 text-sm py-2">
                      +{parsedSpots.length - 100} more spots…
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
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">{result.inserted} inserted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-400">{result.updated} updated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-300">{result.skipped} skipped</span>
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
              disabled={importing || classifying || (insertCount + updateCount) === 0}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {importing
                ? 'Committing…'
                : `Commit ${insertCount} insert${insertCount === 1 ? '' : 's'} · ${updateCount} update${updateCount === 1 ? '' : 's'}`}
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
