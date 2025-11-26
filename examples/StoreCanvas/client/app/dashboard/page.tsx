'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderOpen, Plus, Palette, Trash2, Sparkles, Layers, Smartphone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState } from 'react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.listProjects(),
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeletingId(null);
      setConfirmId(null);
      setConfirmOpen(false);
    },
    onError: () => {
      setDeletingId(null);
      setConfirmOpen(false);
    },
  });

  const handleDelete = (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!confirmId) return;
    setDeletingId(confirmId);
    deleteMutation.mutate(confirmId);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Dashboard
            </p>
            <h1 className="text-3xl font-bold font-['Libertinus_Sans_Regular']">Design, ship, repeat</h1>
            <p className="text-muted-foreground">
              Keep your projects in sync across platforms and export store-ready assets.
            </p>
          </div>
          <Link href="/projects/new" className="sm:self-end">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
              <Layers className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platforms</CardTitle>
              <Smartphone className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {projects?.reduce((acc, p) => acc + (p.platforms?.length || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Configured targets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exports status</CardTitle>
              <Palette className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Ready</div>
              <p className="text-xs text-muted-foreground mt-1">Brand kit linked</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Projects</h2>
            <Link href="/projects" className="sm:self-end">
              <Button variant="outline" className="w-full sm:w-auto">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {projects.slice(0, 6).map((project) => (
                <Card key={project.id} className="hover:border-primary transition-colors h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>
                            Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        aria-label="Delete project"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    <div
                      className="rounded-xl border overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${project.brandKit?.primaryColor || '#6366f1'} 0%, ${project.brandKit?.secondaryColor || '#a855f7'} 100%)`
                      }}
                    >
                      <div className="p-3 text-white bg-black/20">
                        <div className="text-xs uppercase opacity-80">Brand</div>
                        <div className="font-semibold">{project.name}</div>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-white/20 text-white">
                        <div className="p-3 flex items-center gap-2">
                          <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: project.brandKit?.primaryColor || '#6366f1' }} />
                          <span className="text-xs">Primary</span>
                        </div>
                        <div className="p-3 flex items-center gap-2">
                          <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: project.brandKit?.secondaryColor || '#a855f7' }} />
                          <span className="text-xs">Secondary</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.platforms?.map((platform) => (
                        <span key={platform} className="text-xs px-2 py-1 rounded-full bg-secondary">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start generating store assets
                </p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              This will remove the project and its metadata. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
