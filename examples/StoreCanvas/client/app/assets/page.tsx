'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { CloudUpload, Edit3, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const { data: uploads, isFetching } = useQuery({
    queryKey: ['uploads'],
    queryFn: () => apiClient.listUploads(),
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 h-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Assets</p>
            <h1 className="text-3xl font-bold">All uploads</h1>
            <p className="text-muted-foreground">Browse everything you have uploaded. Jump into editing instantly.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/editing')}>
              <Edit3 className="h-4 w-4 mr-2" />
              Go to Editing
            </Button>
          </div>
        </div>

        <Card className="h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your assets</CardTitle>
            <Badge variant="outline">{uploads?.length ?? 0} items</Badge>
          </CardHeader>
          <CardContent className="h-full">
            {isFetching ? (
              <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading assets...
              </div>
            ) : uploads && uploads.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {uploads.map((upload) => (
                    <Card key={upload.id} className="overflow-hidden">
                      <div className="h-40 bg-muted overflow-hidden">
                        <img src={upload.url} alt="Asset" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <CardContent className="space-y-2 pt-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{upload.name || 'Asset'}</p>
                          <Badge variant="outline" className="capitalize">
                            {upload.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {upload.width && upload.height ? `${upload.width}×${upload.height}` : 'Size unknown'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Added {formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/editing?assetId=${upload.id}`)}>
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => window.open(upload.url, '_blank')}>
                            <CloudUpload className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p>No assets yet. Upload from the Editing workspace.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
