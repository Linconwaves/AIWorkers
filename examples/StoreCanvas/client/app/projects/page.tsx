'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.listProjects(),
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  const handleDelete = (id: string) => {
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm('Delete this project? This cannot be undone.')
        : true;
    if (!confirmed) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-['Libertinus_Sans_Regular']">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your app projects and brand kits
            </p>
          </div>
          <Link href="/projects/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:border-primary transition-colors h-full flex flex-col">
                <CardHeader>
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
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: project.brandKit?.primaryColor || '#666' }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: project.brandKit?.secondaryColor || '#999' }}
                    />
                    <span className="text-xs text-muted-foreground ml-auto">Brand Colors</span>
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
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
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
    </AppShell>
  );
}
