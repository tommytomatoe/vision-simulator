import { useEffect, useRef, useState } from 'react';
import { VisionRenderer, RenderMode } from './render/VisionRenderer';
import { selectedEyes } from './engine/selectedEyes';
import { SCENES } from './sources/scenes';
import { startCamera, CameraHandle } from './sources/camera';
import { TOMMY_RX } from './optics/presets';
import { DEFAULT_BLUR_GAIN } from './optics/blur';
import { Prescription, EyeSelection } from './optics/types';
import { SourceKind } from './ui/types';
import { useLatestRef } from './ui/useLatestRef';
import { Photo, fetchPhotos } from './sources/openverse';
import { loadImage } from './sources/loadImage';
import { SourceSwitcher } from './ui/SourceSwitcher';
import { EyeToggle } from './ui/EyeToggle';
import { AttributionChip } from './ui/AttributionChip';
import { Toast } from './ui/Toast';
import { CorrectionControls } from './ui/CorrectionControls';
import { WipeHandle } from './ui/WipeHandle';
import { RxPanel } from './ui/RxPanel';

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
  const [gain] = useState(DEFAULT_BLUR_GAIN); // fixed calibration knob, no UI setter
  const [kind, setKind] = useState<SourceKind>('scene');
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [rxOpen, setRxOpen] = useState(false);

  const rxRef = useLatestRef(rx);
  const selRef = useLatestRef(selection);
  const modeRef = useLatestRef(mode);
  const wipeRef = useLatestRef(wipe);
  const gainRef = useLatestRef(gain);

  // set the active scene as the source
  useEffect(() => {
    if (kind !== 'scene') return;
    let cvs = sceneCache.current.get(sceneId);
    if (!cvs) {
      const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
      cvs = scene.render();
      sceneCache.current.set(sceneId, cvs);
    }
    sourceRef.current = { el: cvs, w: cvs.width, h: cvs.height };
  }, [kind, sceneId]);

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
        setToast('Camera unavailable — showing a scene instead.');
        setKind('scene');
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // load a batch of photos when entering photo mode or when the batch empties
  useEffect(() => {
    if (kind !== 'photo') return;
    if (photos.length > 0) return;
    let cancelled = false;
    fetchPhotos()
      .then((list) => {
        if (cancelled) return;
        if (list.length === 0) throw new Error('empty');
        setPhotos(list);
        setPhotoIndex(0);
      })
      .catch(() => {
        setToast('Could not load photos — showing a scene instead.');
        setKind('scene');
      });
    return () => {
      cancelled = true;
    };
  }, [kind, photos.length]);

  // set the current photo as the source
  useEffect(() => {
    if (kind !== 'photo') return;
    const photo = photos[photoIndex];
    if (!photo) return;
    let cancelled = false;
    loadImage(photo.url)
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
    } catch {
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
      const src = sourceRef.current;
      if (src && src.w > 0 && src.h > 0) {
        // keep camera dimensions fresh once metadata loads
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
    if (photoIndex + 1 >= photos.length) setPhotos([]); // triggers a fresh fetch
    else setPhotoIndex((i) => i + 1);
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
      {currentPhoto && <AttributionChip photo={currentPhoto} />}
      <Toast message={toast} />
      <div className="controls">
        <SourceSwitcher
          kind={kind}
          onKind={setKind}
          sceneId={sceneId}
          onScene={setSceneId}
          onShuffle={shuffle}
        />
        <div className="row">
          <EyeToggle value={selection} onChange={setSelection} />
          {selection === 'both' && (
            <span className="hint" data-testid="both-hint">
              “Both” is an approximate blend of the two eyes
            </span>
          )}
        </div>
        <div className="row">
          <CorrectionControls mode={mode} onMode={setMode} />
        </div>
        <RxPanel rx={rx} onRx={setRx} open={rxOpen} onToggle={() => setRxOpen((o) => !o)} />
      </div>
    </div>
  );
}
