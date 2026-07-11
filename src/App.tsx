import { useEffect, useRef, useState } from 'react';
import { VisionRenderer } from './render/VisionRenderer';
import type { RenderMode } from './render/VisionRenderer';
import { selectedEyes } from './engine/selectedEyes';
import { SCENES } from './sources/scenes';
import { startCamera } from './sources/camera';
import type { CameraHandle } from './sources/camera';
import { TOMMY_RX } from './optics/presets';
import { DEFAULT_BLUR_GAIN } from './optics/blur';
import { parseGainParam } from './ui/parseGainParam';
import type { Prescription, EyeSelection } from './optics/types';
import type { SourceKind } from './ui/types';
import { useLatestRef } from './ui/useLatestRef';
import { track } from './analytics';
import { shuffledPhotos } from './sources/photos';
import type { Photo } from './sources/photos';
import { loadImage } from './sources/loadImage';
import { AttributionChip } from './ui/AttributionChip';
import { Toast } from './ui/Toast';
import { CorrectionControls } from './ui/CorrectionControls';
import { WipeHandle } from './ui/WipeHandle';
import { SourceChip } from './ui/SourceChip';
import { IconButton } from './ui/IconButton';
import { NextButton } from './ui/NextButton';
import { SettingsSheet } from './ui/SettingsSheet';
import { SettingsIcon } from './ui/icons';

interface SourceFrame {
  el: TexImageSource;
  w: number;
  h: number;
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<VisionRenderer | null>(null);
  const sourceRef = useRef<SourceFrame | null>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const sceneCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [webglError, setWebglError] = useState(false);
  const [rx, setRx] = useState<Prescription>(TOMMY_RX);
  const [selection, setSelection] = useState<EyeSelection>('both');
  const [mode, setMode] = useState<RenderMode>('blurred');
  const [wipe, setWipe] = useState(0.5);
  const [gain] = useState(() => parseGainParam(window.location.search) ?? DEFAULT_BLUR_GAIN);
  const [kind, setKind] = useState<SourceKind>('scene');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rxRef = useLatestRef(rx);
  const selRef = useLatestRef(selection);
  const modeRef = useLatestRef(mode);
  const wipeRef = useLatestRef(wipe);
  const gainRef = useLatestRef(gain);

  // the Eye Test source renders the eye chart
  useEffect(() => {
    if (kind !== 'scene') return;
    const scene = SCENES[0];
    let cvs = sceneCache.current.get(scene.id);
    if (!cvs) {
      cvs = scene.render();
      sceneCache.current.set(scene.id, cvs);
    }
    sourceRef.current = { el: cvs, w: cvs.width, h: cvs.height };
  }, [kind]);

  // camera lifecycle
  useEffect(() => {
    if (kind !== 'camera') {
      cameraRef.current?.stop();
      cameraRef.current = null;
      return;
    }
    let cancelled = false;
    startCamera('environment')
      .then((handle) => {
        if (cancelled) {
          handle.stop();
          return;
        }
        cameraRef.current = handle;
        sourceRef.current = {
          el: handle.video,
          w: handle.video.videoWidth || 1280,
          h: handle.video.videoHeight || 720,
        };
      })
      .catch(() => {
        track('camera_denied');
        setToast('Camera unavailable — showing a scene instead.');
        setKind('scene');
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // shuffle the bundled photo set when entering photo mode
  useEffect(() => {
    if (kind !== 'photo') return;
    if (photos.length > 0) return;
    setPhotos(shuffledPhotos());
    setPhotoIndex(0);
  }, [kind, photos.length]);

  // set the current photo as the source
  useEffect(() => {
    if (kind !== 'photo') return;
    const photo = photos[photoIndex];
    if (!photo) return;
    let cancelled = false;
    loadImage(photo.src)
      .then((img) => {
        if (cancelled) return;
        sourceRef.current = { el: img, w: img.naturalWidth, h: img.naturalHeight };
      })
      .catch(() => setToast('That photo failed to load — try Next.'));
    return () => {
      cancelled = true;
    };
  }, [kind, photos, photoIndex]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // renderer + rAF loop + resize (mount once)
  useEffect(() => {
    const canvas = canvasRef.current!;
    let renderer: VisionRenderer;
    try {
      renderer = new VisionRenderer(canvas);
    } catch (err) {
      console.error('VisionRenderer init failed:', err);
      track('webgl_unsupported');
      setWebglError(true);
      return;
    }
    rendererRef.current = renderer;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ro = new ResizeObserver(() => {
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr));
    });
    ro.observe(canvas);
    canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr));

    let raf = 0;
    const loop = () => {
      try {
        const src = sourceRef.current;
        if (src && src.w > 0 && src.h > 0) {
          if (cameraRef.current && src.el === cameraRef.current.video) {
            src.w = cameraRef.current.video.videoWidth || src.w;
            src.h = cameraRef.current.video.videoHeight || src.h;
          }
          const eyes = selectedEyes(rxRef.current, selRef.current);
          renderer.render(src.el, src.w, src.h, eyes, {
            mode: modeRef.current,
            wipe: wipeRef.current,
            blurGain: gainRef.current,
          });
        }
      } catch {
        // skip this frame; a single bad frame shouldn't kill the render loop
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cameraRef.current?.stop();
      renderer.dispose();
    };
  }, [rxRef, selRef, modeRef, wipeRef, gainRef]);

  const currentPhoto = kind === 'photo' ? photos[photoIndex] : undefined;
  const shuffle = () => {
    if (photoIndex + 1 >= photos.length) {
      setPhotos(shuffledPhotos()); // reached the end — reshuffle for a fresh pass
      setPhotoIndex(0);
    } else {
      setPhotoIndex((i) => i + 1);
    }
  };
  // The "next" arrow advances photos in photo mode, and from the eye chart it
  // jumps straight into photo mode.
  const advance = (method: 'button' | 'arrow_key') => {
    if (kind === 'photo') {
      shuffle();
      track('photo_next', { method });
    } else {
      setKind('photo');
      track('source_change', { source: 'photo', trigger: 'next_arrow' });
    }
  };

  // Right arrow mirrors the next arrow (photo mode or the eye chart), but not
  // while the settings sheet is open so arrow keys can still drive sliders.
  const advanceRef = useLatestRef(advance);
  useEffect(() => {
    if (settingsOpen || (kind !== 'photo' && kind !== 'scene')) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advanceRef.current('arrow_key');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind, settingsOpen, advanceRef]);

  const openSettings = () => {
    setSettingsOpen(true);
    track('settings_open');
  };
  const changeMode = (m: RenderMode) => {
    setMode(m);
    track('correction_change', { mode: m });
  };
  const changeKind = (k: SourceKind) => {
    setKind(k);
    track('source_change', { source: k, trigger: 'settings' });
  };
  const changeSelection = (eye: EyeSelection) => {
    setSelection(eye);
    track('eye_change', { eye });
  };

  if (webglError) {
    return (
      <div className="notice" data-testid="webgl-error">
        <h1>See Through My Eyes</h1>
        <p>Your browser doesn't support WebGL2, which this simulator needs. Try a recent version of Chrome, Safari, Edge, or Firefox.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <canvas ref={canvasRef} className="stage" data-testid="stage" />
      {mode === 'wipe' && <WipeHandle value={wipe} onChange={setWipe} />}

      <div className="chrome-top">
        <SourceChip kind={kind} onOpen={openSettings} expanded={settingsOpen} />
        <IconButton label="Settings" onClick={openSettings} expanded={settingsOpen} hasPopup>
          <SettingsIcon />
        </IconButton>
      </div>

      {currentPhoto && <AttributionChip photo={currentPhoto} />}

      <div className={kind === 'camera' ? 'chrome-bottom' : 'chrome-bottom has-next'}>
        <CorrectionControls mode={mode} onMode={changeMode} />
      </div>
      {kind !== 'camera' && (
        <div className="next-slot">
          <NextButton onNext={() => advance('button')} />
        </div>
      )}

      <Toast message={toast} />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        kind={kind}
        onKind={changeKind}
        selection={selection}
        onSelection={changeSelection}
        rx={rx}
        onRx={setRx}
      />
    </div>
  );
}
