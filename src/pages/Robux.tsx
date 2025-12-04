import { Link } from 'react-router-dom';
import { BuyRobuxSection } from '@/components/BuyRobuxSection';
import { Button } from '@/components/ui/button';

const Robux = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border backdrop-blur bg-background/80 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-foreground">
          <span className="text-primary">Profit</span>Cruiser
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">Home</Link>
          </Button>
          <Button asChild>
            <Link to="/account">My Account</Link>
          </Button>
        </div>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12">
      <BuyRobuxSection />
    </main>
  </div>
);

export default Robux;
