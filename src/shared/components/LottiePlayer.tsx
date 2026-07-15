import { useEffect, useRef } from "react";
import lottie from "lottie-web";

interface LottiePlayerProps {
  className?: string;
  path: string;
}

export function LottiePlayer({ className, path }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path,
    });

    return () => animation.destroy();
  }, [path]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
