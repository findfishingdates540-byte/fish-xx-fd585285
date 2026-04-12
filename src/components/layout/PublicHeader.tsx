import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/fishx-logo.png';

export function PublicHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { user, signOut } = useAuth();

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/dating', label: 'Dating' },
    { to: '/fishing', label: 'Fishing' },
    { to: '/challenges', label: 'Challenges' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/safety', label: 'Safety' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link to="/" className="-ml-2">
          <img src={logo} alt="FishX" className="h-16 w-auto" />
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
          {user ? (
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="text-foreground hover:bg-muted font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
