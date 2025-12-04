import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="glass-card border border-border/60 rounded-3xl p-10 text-center space-y-6 max-w-lg">
      <div>
        <p className="uppercase tracking-[0.4em] text-xs text-muted-foreground">404</p>
        <h1 className="text-3xl font-bold text-foreground mt-2">Fant ikke siden</h1>
        <p className="text-sm text-muted-foreground mt-2">
        The link you followed may have been moved or deleted. Go back to the homepage to continue exploring ProfitCruiser.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link to="/">Home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/robux">Premium Robux</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default NotFound;
