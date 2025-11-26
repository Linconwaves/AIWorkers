'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { SIZE_PRESETS } from '@/lib/presets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileImage, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ExportsPage({ params }: { params: { designId: string } }) {
  const queryClient = useQueryClient();
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  const { data: design } = useQuery({
    queryKey: ['design', params.designId],
    queryFn: () => apiClient.getDesign(params.designId),
  });

  const { data: exports, isLoading } = useQuery({
    queryKey: ['exports', params.designId],
    queryFn: () => apiClient.listExports(params.designId),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      apiClient.exportDesign(params.designId, {
        presets: selectedPresets,
        format: exportFormat,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports', params.designId] });
      setSelectedPresets([]);
    },
  });

  const handlePresetToggle = (presetCode: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetCode)
        ? prev.filter((p) => p !== presetCode)
        : [...prev, presetCode]
    );
  };

  const handleExport = () => {
    if (selectedPresets.length > 0) {
      exportMutation.mutate();
    }
  };

  const availablePresets = design?.presets || [];
  const presetDetails = availablePresets
    .map((code) => SIZE_PRESETS.find((p) => p.code === code))
    .filter(Boolean);

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/designs/${params.designId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 block"
            >
              ← Back to Editor
            </Link>
            <h1 className="text-3xl font-bold font-['Libertinus_Sans_Regular']">
              Export {design?.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate assets for different store sizes
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Export Presets</CardTitle>
                <CardDescription>
                  Choose which sizes to generate from your design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {presetDetails.map((preset) => {
                    if (!preset) return null;
                    return (
                      <div key={preset.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={preset.code}
                          checked={selectedPresets.includes(preset.code)}
                          onCheckedChange={() => handlePresetToggle(preset.code)}
                          disabled={exportMutation.isPending}
                        />
                        <Label htmlFor={preset.code} className="font-normal cursor-pointer flex-1">
                          <div className="flex items-center justify-between">
                            <span>
                              {preset.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {preset.width} × {preset.height}
                            </span>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-border">
                  <Label className="mb-3 block">Export Format</Label>
                  <RadioGroup
                    value={exportFormat}
                    onValueChange={(value: 'png' | 'jpeg') => setExportFormat(value)}
                    disabled={exportMutation.isPending}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="png" id="png" />
                        <Label htmlFor="png" className="font-normal cursor-pointer">
                          PNG (recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="jpeg" id="jpeg" />
                        <Label htmlFor="jpeg" className="font-normal cursor-pointer">
                          JPEG
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleExport}
                  disabled={selectedPresets.length === 0 || exportMutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export {selectedPresets.length} Preset{selectedPresets.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
                <CardDescription>
                  {exports?.length || 0} export{exports?.length !== 1 ? 's' : ''} generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading exports...
                  </div>
                ) : exports && exports.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {exports.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 rounded-lg border border-border bg-secondary/30"
                      >
                        <div className="flex items-start gap-3">
                          <FileImage className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {SIZE_PRESETS.find((p) => p.code === exp.presetCode)?.name ||
                                exp.presetCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exp.width} × {exp.height} • {exp.format.toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(exp.createdAt), 'MMM d, h:mm a')}
                            </p>
                            {exp.status === 'done' && exp.outputUrl && (
                              <a
                                href={exp.outputUrl}
                                download
                                className="text-xs text-primary hover:underline mt-2 inline-block"
                              >
                                Download
                              </a>
                            )}
                            {exp.status !== 'done' && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {exp.status}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No exports yet. Select presets and export to generate assets.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
