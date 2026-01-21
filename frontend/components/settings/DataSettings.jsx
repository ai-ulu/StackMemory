'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Data Management Settings
 * - Export memories (JSON/CSV)
 * - Import memories
 * - Clear all memories
 */

export default function DataSettings() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState('merge');
  const [lastExport, setLastExport] = useState(null);
  const [lastImport, setLastImport] = useState(null);
  const fileInputRef = useRef(null);

  async function handleExport(format = 'json') {
    setExporting(true);
    try {
      const includeVersions = format === 'json';
      const response = await fetch(
        `/api/memories/export?format=${format}&includeVersions=${includeVersions}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from header or generate
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `ai-ulu-memories.${format}`;

      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastExport(new Date().toISOString());
      toast.success(`Memories exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      // Read file
      const text = await file.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file');
      }

      // Validate structure
      if (!data.memories && Array.isArray(data)) {
        data = { memories: data };
      }

      if (!data.memories || !Array.isArray(data.memories)) {
        throw new Error('Invalid format. Expected { memories: [...] }');
      }

      // Confirm if replace mode
      if (importMode === 'replace') {
        const confirmed = window.confirm(
          `⚠️ REPLACE MODE: This will DELETE all existing memories and import ${data.memories.length} new ones. Continue?`
        );
        if (!confirmed) {
          setImporting(false);
          return;
        }
      }

      // Send to API
      const response = await fetch('/api/memories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memories: data.memories,
          mode: importMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setLastImport({
        date: new Date().toISOString(),
        summary: result.summary,
      });

      toast.success(
        `Imported ${result.summary.imported} memories (${result.summary.skipped} skipped)`
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleClearAll() {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL your memories. This cannot be undone. Are you sure?'
    );
    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE ALL" to confirm:',
      ''
    );
    if (doubleConfirm !== 'DELETE ALL') {
      toast.error('Deletion cancelled');
      return;
    }

    try {
      const response = await fetch('/api/memories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memories: [],
          mode: 'replace',
        }),
      });

      if (response.ok) {
        toast.success('All memories deleted');
      } else {
        throw new Error('Failed to delete memories');
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Data Management</h3>
        <p className="text-sm text-gray-400">Export, import, or manage your memory data</p>
      </div>

      {/* Export Section */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h4 className="font-medium text-white mb-3">📤 Export Memories</h4>
        <p className="text-sm text-gray-400 mb-4">
          Download all your memories for backup or migration.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {lastExport && (
          <p className="text-xs text-gray-500 mt-2">
            Last export: {new Date(lastExport).toLocaleString()}
          </p>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h4 className="font-medium text-white mb-3">📥 Import Memories</h4>
        <p className="text-sm text-gray-400 mb-4">
          Restore memories from a previously exported JSON file.
        </p>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Import Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={(e) => setImportMode(e.target.value)}
                className="text-purple-500"
              />
              <span className="text-gray-300">Merge</span>
              <span className="text-xs text-gray-500">(skip duplicates)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={(e) => setImportMode(e.target.value)}
                className="text-red-500"
              />
              <span className="text-gray-300">Replace</span>
              <span className="text-xs text-red-400">(delete existing)</span>
            </label>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
          id="import-file"
        />
        <label
          htmlFor="import-file"
          className={`inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg cursor-pointer ${
            importing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {importing ? 'Importing...' : 'Select JSON File'}
        </label>

        {lastImport && (
          <div className="mt-3 text-sm">
            <p className="text-gray-500">
              Last import: {new Date(lastImport.date).toLocaleString()}
            </p>
            <p className="text-gray-400">
              Imported: {lastImport.summary.imported} | 
              Skipped: {lastImport.summary.skipped} | 
              Errors: {lastImport.summary.errors}
            </p>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
        <h4 className="font-medium text-red-400 mb-3">⚠️ Danger Zone</h4>
        <p className="text-sm text-gray-400 mb-4">
          Permanently delete all your memories. This action cannot be undone.
        </p>
        
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
        >
          Delete All Memories
        </button>
      </div>
    </div>
  );
}
