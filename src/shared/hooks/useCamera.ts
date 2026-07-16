import { useEffect, useRef, useState } from "react";

type CameraState = "idle" | "requesting" | "ready" | "denied" | "unsupported";

const HIGH_QUALITY_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 60, max: 60 },
};

const FALLBACK_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
};

function getVideoConstraints(facingMode: "environment" | "user", highQuality = true): MediaTrackConstraints {
  const baseConstraints = highQuality ? HIGH_QUALITY_VIDEO_CONSTRAINTS : FALLBACK_VIDEO_CONSTRAINTS;

  return {
    ...baseConstraints,
    facingMode: { ideal: facingMode },
  };
}

async function tuneCameraTrack(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track?.applyConstraints) return;

  try {
    const capabilities = track.getCapabilities?.();
    const frameRateMax = capabilities?.frameRate?.max;
    const widthMax = capabilities?.width?.max;
    const heightMax = capabilities?.height?.max;

    await track.applyConstraints({
      width: widthMax ? { ideal: Math.min(widthMax, 1920) } : { ideal: 1920 },
      height: heightMax ? { ideal: Math.min(heightMax, 1080) } : { ideal: 1080 },
      frameRate: frameRateMax ? { ideal: Math.min(frameRateMax, 60), max: Math.min(frameRateMax, 60) } : { ideal: 60, max: 60 },
    });
  } catch {
    try {
      await track.applyConstraints({
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      });
    } catch {
      // Browser-selected camera settings are still usable if tuning is rejected.
    }
  }
}

// Wraps getUserMedia: exposes permission state plus a <video> ref, and
// attaches the live stream to that video once it's actually in the DOM.
//
// The attach is split into its own effect ON PURPOSE. The <video> is only
// rendered when state === "ready", so assigning srcObject inside the
// getUserMedia .then() (when state is still "requesting") hit a null ref —
// the element didn't exist yet — and the feed silently never bound → black
// screen. Storing the stream and binding it in a state-keyed effect runs
// after React has committed the <video> to the DOM, so the ref is live.
export function useCamera(facingMode: "environment" | "user" = "environment") {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    let cancelled = false;
    setState("requesting");

    const openCamera = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(facingMode, true),
          audio: false,
        });
      } catch {
        return navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(facingMode, false),
          audio: false,
        });
      }
    };

    openCamera()
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        await tuneCameraTrack(s);
        streamRef.current = s;
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  // Bind the stream after the <video> is committed (state === "ready").
  useEffect(() => {
    if (state === "ready" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        // Autoplay can briefly reject while Safari is attaching the stream.
      });
    }
  }, [state]);

  return { videoRef, state };
}
