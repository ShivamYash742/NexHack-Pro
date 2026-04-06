import React, { forwardRef } from 'react';
import { useLiveAvatarSession } from '../logic';
import { LiveAvatarSessionState } from '../logic';
import { Button } from '../ui/button';
import { Cross } from 'lucide-react';

export const AvatarVideo = forwardRef<HTMLVideoElement>((_, ref) => {
  const { sessionState, stop } = useLiveAvatarSession();

  const isLoaded = sessionState === LiveAvatarSessionState.CONNECTED;

  return (
    <>
      {isLoaded && (
        <Button onClick={stop} className="absolute top-4 right-4 z-10 w-fit h-fit p-2">
          <Cross className="w-5 h-5" />
        </Button>
      )}
      <video
        ref={ref}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      >
        <track kind="captions" />
      </video>
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center absolute top-0 left-0">
          Loading Avatar...
        </div>
      )}
    </>
  );
});

AvatarVideo.displayName = 'AvatarVideo';
