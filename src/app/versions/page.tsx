// src/app/versions/page.tsx
'use client';

import { useVersions } from '@/hooks/use-versions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { RotateCcw, Download } from 'lucide-react';

export default function VersionsPage() {
  const { data: versions = [], isLoading, rollbackVersion } = useVersions();

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Version History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" role="status" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map(version => {
                const totalChanges = Object.values(version.changes).reduce(
                  (a, b) => a + b,
                  0
                );
                const isLatest = version.version === versions[0]?.version;

                return (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          Version {version.version}
                        </h3>
                        {isLatest && <Badge>Latest</Badge>}
                        <Badge variant="secondary">
                          {totalChanges}{' '}
                          {totalChanges === 1 ? 'change' : 'changes'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {version.published_at && format(new Date(version.published_at), 'PPP pp')}
                      </p>
                      {totalChanges > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(version.changes).map(
                            ([key, value]) =>
                              value > 0 ? (
                                <Badge key={key} variant="outline">
                                  {key.replace('_', ' ')}: {value}
                                </Badge>
                              ) : null
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Download', version.file_url);
                          window.open(version.file_url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {!isLatest && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            rollbackVersion.mutate(version.version)
                          }
                          disabled={rollbackVersion.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
