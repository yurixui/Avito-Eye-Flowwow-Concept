import { useEffect, useRef, useState } from "react";

type CameraState = "idle" | "requesting" | "ready" | "denied" | "unsupported";

// Wraps getUserMedia: attaches the live stream to a <video> ref and exposes
// permission state so the UI can show a fallback when access is denied/unsupported.
export function useCamera(facingMode: "environment" | "user" = "environment") {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    let stream: MediaStream | undefined;
    setState("requesting");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setState("ready");
      })
      .catch(() => setState("denied"));

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  return { videoRef, state };
}
