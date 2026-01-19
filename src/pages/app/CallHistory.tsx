import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CallHistoryList } from '@/components/call/CallHistoryList';
import { useNavigate } from 'react-router-dom';

export default function CallHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <motion.div 
      className="flex flex-col h-[100dvh] bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <header className="h-14 px-4 border-b border-border flex items-center gap-3 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Call History</h1>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-1.5">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-y-auto mt-4">
          <CallHistoryList filter="all" />
        </TabsContent>
        
        <TabsContent value="voice" className="flex-1 overflow-y-auto mt-4">
          <CallHistoryList filter="voice" />
        </TabsContent>
        
        <TabsContent value="video" className="flex-1 overflow-y-auto mt-4">
          <CallHistoryList filter="video" />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
