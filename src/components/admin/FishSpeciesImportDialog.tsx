import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateFishSpecies, useFishSpecies } from '@/hooks/use-fish-species';
import { toast } from 'sonner';

interface ImportRow {
  name: string;
  scientific_name?: string;
  description?: string;
  image_url?: string;
  status: 'pending' | 'success' | 'error' | 'duplicate';
  error?: string;
}

interface FishSpeciesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FishSpeciesImportDialog({ open, onOpenChange }: FishSpeciesImportDialogProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingSpecies } = useFishSpecies();
  const { mutateAsync: createSpecies } = useCreateFishSpecies();

  const resetState = () => {
    setRows([]);
    setIsImporting(false);
    setImportProgress(0);
    setImportComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const existingNames = new Set(
        existingSpecies?.map(s => s.name.toLowerCase().trim()) || []
      );

      const parsedRows: ImportRow[] = (jsonData as Record<string, unknown>[]).map((row) => {
        // Map common column variations
        const name = (row['Fish Species'] || row['Name'] || row['Species'] || row['name'] || '') as string;
        const scientific_name = (row['Scientific Name'] || row['scientific_name'] || row['Scientific'] || '') as string;
        const description = (row['Description'] || row['description'] || '') as string;
        const image_url = (row['Image URL'] || row['image_url'] || row['Image'] || row['URL'] || '') as string;

        const trimmedName = name.toString().trim();
        const isDuplicate = existingNames.has(trimmedName.toLowerCase());

        return {
          name: trimmedName,
          scientific_name: scientific_name?.toString().trim() || undefined,
          description: description?.toString().trim() || undefined,
          image_url: image_url?.toString().trim() || undefined,
          status: (isDuplicate ? 'duplicate' : 'pending') as ImportRow['status'],
          error: isDuplicate ? 'Already exists' : undefined,
        };
      }).filter((row) => row.name); // Filter out empty rows

      setRows(parsedRows);
      setImportComplete(false);
    } catch (error) {
      toast.error('Failed to parse Excel file');
      console.error('Parse error:', error);
    }
  };

  const handleImport = async () => {
    const pendingRows = rows.filter(r => r.status === 'pending');
    if (pendingRows.length === 0) {
      toast.error('No new species to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status !== 'pending') {
        continue;
      }

      try {
        await createSpecies({
          name: row.name,
          scientific_name: row.scientific_name,
          description: row.description,
          image_url: row.image_url,
        });

        setRows(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'success' } : r
        ));
        successCount++;
      } catch (error: any) {
        setRows(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error', error: error.message } : r
        ));
        errorCount++;
      }

      setImportProgress(((i + 1) / rows.length) * 100);
    }

    setIsImporting(false);
    setImportComplete(true);

    if (successCount > 0) {
      toast.success(`Imported ${successCount} species successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} species`);
    }
  };

  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const duplicateCount = rows.filter(r => r.status === 'duplicate').length;
  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isImporting) { onOpenChange(o); if (!o) resetState(); } }}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Import Fish Species
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload an Excel file (.xlsx) with columns: Fish Species, Scientific Name, Description, Image URL
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* File Input */}
          {rows.length === 0 && (
            <div 
              className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium mb-1">Click to upload Excel file</p>
              <p className="text-sm text-slate-500">Supports .xlsx files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview Table */}
          {rows.length > 0 && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">Total: {rows.length}</span>
                {pendingCount > 0 && (
                  <span className="text-blue-400">Ready: {pendingCount}</span>
                )}
                {duplicateCount > 0 && (
                  <span className="text-yellow-400">Duplicates: {duplicateCount}</span>
                )}
                {successCount > 0 && (
                  <span className="text-emerald-400">Imported: {successCount}</span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-400">Errors: {errorCount}</span>
                )}
              </div>

              {/* Progress */}
              {isImporting && (
                <Progress value={importProgress} className="h-2" />
              )}

              {/* Table */}
              <ScrollArea className="flex-1 border border-slate-700 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Species Name</TableHead>
                      <TableHead className="text-slate-400">Scientific Name</TableHead>
                      <TableHead className="text-slate-400">Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} className="border-slate-700">
                        <TableCell>
                          {row.status === 'pending' && (
                            <span className="text-blue-400 text-xs">Ready</span>
                          )}
                          {row.status === 'duplicate' && (
                            <span className="text-yellow-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Duplicate
                            </span>
                          )}
                          {row.status === 'success' && (
                            <span className="text-emerald-400 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span className="text-red-400 text-xs flex items-center gap-1" title={row.error}>
                              <X className="w-3 h-3" /> Error
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-white font-medium">{row.name}</TableCell>
                        <TableCell className="text-slate-400 italic text-sm">{row.scientific_name || '-'}</TableCell>
                        <TableCell>
                          {row.image_url ? (
                            <img 
                              src={row.image_url} 
                              alt={row.name}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-slate-500 text-xs">No image</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          {rows.length > 0 && !importComplete && (
            <Button
              variant="outline"
              onClick={resetState}
              disabled={isImporting}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => { onOpenChange(false); resetState(); }}
            disabled={isImporting}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            {importComplete ? 'Close' : 'Cancel'}
          </Button>
          {rows.length > 0 && pendingCount > 0 && !importComplete && (
            <Button
              onClick={handleImport}
              disabled={isImporting || pendingCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isImporting ? 'Importing...' : `Import ${pendingCount} Species`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
