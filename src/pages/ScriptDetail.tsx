import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Monitor, Smartphone, KeyRound, ArrowLeft, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { recordScriptView, fetchScripts } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import NotFound from './NotFound';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  patched: { label: 'Patched', variant: 'secondary' },
  private: { label: 'Private', variant: 'outline' },
  archived: { label: 'Archived', variant: 'outline' }
};

const ScriptDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: scriptsData } = useQuery({
    queryKey: ['scripts'],
    queryFn: fetchScripts,
    staleTime: 1000 * 60 * 5
  });

  const script = useMemo(() => 
    scriptsData?.scripts?.find((item) => item.slug === slug), 
    [slug, scriptsData]
  );

  useEffect(() => {
    if (!script) {
      return;
    }
    recordScriptView(script.slug).catch(() => undefined);
  }, [script]);

  if (!script) {
    return <NotFound />;
  }

  const statusMeta = statusLabels[script.status] ?? statusLabels.active;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border backdrop-blur bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-foreground">
            <span className="text-primary">Profit</span>Cruiser
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/robux">Premium Robux</Link>
            </Button>
            <Button asChild>
              <Link to="/account">My Account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to homepage
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <article className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary">{script.category}</Badge>
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  {script.views !== undefined && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {script.views.toLocaleString('en-US')} Views
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">{script.title}</h1>
                <p className="text-muted-foreground text-base max-w-3xl">{script.short}</p>
              </div>

              <div className="rounded-3xl overflow-hidden border border-border/60">
                <img src={script.thumbnail} alt={script.title} className="w-full h-full object-cover" loading="lazy" />
              </div>

              <div className="flex flex-wrap gap-2">
                {script.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="uppercase tracking-[0.25em] text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <section className="prose prose-invert max-w-none">
              <ReactMarkdown>{script.description}</ReactMarkdown>
            </section>
          </article>

          <aside className="space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="space-y-5 pt-6">
                <div>
                  <p className="uppercase tracking-[0.25em] text-xs text-muted-foreground"></p>
                  <h2 className="text-2xl font-semibold text-foreground mt-2">PC Script Hub</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Get the script by pressing the "Get Script Button"
                  </p>
                </div>
                <Button asChild size="lg" className="w-full">
                  <a href={script.workink_url} target="_blank" rel="noopener noreferrer">
                    Get Script
                  </a>
                </Button>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span>PC Support: {script.compatibility.pc ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span>Made For Mobile: {script.compatibility.mobile ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span>Need Executor: {script.compatibility.executor_required ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ScriptDetail;
