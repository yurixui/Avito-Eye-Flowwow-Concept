import { useEffect, useRef, useState } from "react";

type CameraState = "idle" | "requesting" | "ready" | "denied" | "unsupported";

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

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
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
    }
  }, [state]);

  return { videoRef, state };
}
