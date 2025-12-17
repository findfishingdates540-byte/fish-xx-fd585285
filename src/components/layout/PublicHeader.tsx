import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.jpg';

export function PublicHeader() {
  const location = useLocation();
  const pathname = location.pathname;

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/dating', label: 'Dating' },
    { to: '/fishing', label: 'Fishing' },
    { to: '/safety', label: 'Safety' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-6 py-1 max-w-7xl mx-auto">
        <Link to="/">
          <img src={logo} alt="Find Fishing Dates" className="h-24 w-auto" />
        </Link>
        
        <div className="hidden md:flex items-center gap-10 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-foreground transition-opacity ${
                pathname === link.to ? 'font-semibold' : 'hover:opacity-60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-foreground hover:bg-muted font-medium">
              Log in
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button className="btn-primary">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
