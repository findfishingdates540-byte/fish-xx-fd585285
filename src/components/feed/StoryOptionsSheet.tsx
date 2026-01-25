import { FC } from 'react';
import { Share2, Camera, Trash2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  isOwnStory?: boolean;
  ownerName?: string;
}

export const StoryOptionsSheet: FC<StoryOptionsSheetProps> = ({
  isOpen,
  onClose,
  onCreateStory,
  onShare,
  onDelete,
  onReport,
  isOwnStory = false,
  ownerName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100000]"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[100001] bg-card rounded-t-2xl overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Options */}
            <div className="px-4 pb-8 space-y-1">
              {/* Create story from this */}
              {!isOwnStory && (
                <button
                  onClick={() => {
                    onCreateStory?.();
                    onClose();
                  }}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Create Story</p>
                    <p className="text-sm text-muted-foreground">
                      Respond to {ownerName}'s story
                    </p>
                  </div>
                </button>
              )}

              {/* Share story */}
              <button
                onClick={() => {
                  onShare?.();
                  onClose();
                }}
                className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Share Story</p>
                  <p className="text-sm text-muted-foreground">
                    Send to friends or share link
                  </p>
                </div>
              </button>

              {/* Delete (own story only) */}
              {isOwnStory && (
                <button
                  onClick={() => {
                    onDelete?.();
                    onClose();
                  }}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-destructive">Delete Story</p>
                    <p className="text-sm text-muted-foreground">
                      Remove this story permanently
                    </p>
                  </div>
                </button>
              )}

              {/* Report (other's story only) */}
              {!isOwnStory && (
                <button
                  onClick={() => {
                    onReport?.();
                    onClose();
                  }}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Report Story</p>
                    <p className="text-sm text-muted-foreground">
                      Report inappropriate content
                    </p>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
