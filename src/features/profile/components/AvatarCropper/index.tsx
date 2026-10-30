import type { FC } from 'react';
import { useId, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

import { Button } from '@/components/common/Button';

import styles from './avatar_cropper.module.scss';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const START_POSITION: Point = { x: 0, y: 0 };

type AvatarCropperProps = {
  imageUrl: string;
  onBack: () => void;
  onConfirm: (area: Area) => void;
};

const AvatarCropper: FC<AvatarCropperProps> = ({
  imageUrl,
  onBack,
  onConfirm,
}) => {
  const zoomId = useId();
  const [position, setPosition] = useState(START_POSITION);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area | null>(null);

  return (
    <div className={styles.cropper}>
      <div className={styles.cropper__area}>
        <Cropper
          image={imageUrl}
          crop={position}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape="round"
          showGrid
          disableAutomaticStylesInjection
          onCropChange={setPosition}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>
      <label className={styles.cropper__zoom} htmlFor={zoomId}>
        Zoom
        <input
          id={zoomId}
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      <p className={styles.cropper__hint}>
        Drag to reposition. Saved as a 512 × 512 image, location data removed.
      </p>
      <div className={styles.cropper__actions}>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button
          size="sm"
          disabled={!area}
          onClick={() => {
            if (area) onConfirm(area);
          }}
        >
          Use photo
        </Button>
      </div>
    </div>
  );
};

export { AvatarCropper };
