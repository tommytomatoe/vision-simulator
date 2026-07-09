export interface CameraHandle {
  video: HTMLVideoElement;
  stop: () => void;
}

export async function startCamera(
  facingMode: 'environment' | 'user' = 'environment',
): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.srcObject = stream;
  await video.play();
  return {
    video,
    stop: () => stream.getTracks().forEach((t) => t.stop()),
  };
}
