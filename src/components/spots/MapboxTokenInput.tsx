import { useState, useEffect } from 'react';
import { Map, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MAPBOX_TOKEN_KEY = 'mapbox_public_token';

interface MapboxTokenInputProps {
  onTokenSet: (token: string) => void;
}

const MapboxTokenInput = ({ onTokenSet }: MapboxTokenInputProps) => {
  const [token, setToken] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
    if (savedToken) {
      onTokenSet(savedToken);
    }
  }, [onTokenSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.startsWith('pk.')) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, token);
      onTokenSet(token);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-foreground" />
          </div>
          <CardTitle>Connect Mapbox</CardTitle>
          <CardDescription>
            To view the fishing spots map, please enter your Mapbox public token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="pk.eyJ1IjoiLi..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your token is stored locally and never sent to our servers.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={!token.startsWith('pk.')}>
              Connect Map
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://account.mapbox.com/access-tokens/', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get Token from Mapbox
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapboxTokenInput;

export const getMapboxToken = (): string | null => {
  return localStorage.getItem(MAPBOX_TOKEN_KEY);
};
