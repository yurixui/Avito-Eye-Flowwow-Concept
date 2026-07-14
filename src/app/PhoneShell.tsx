import type { PropsWithChildren } from "react";
import styles from "./PhoneShell.module.css";

// Wraps every screen in a fixed 375x812 frame on desktop (mockup chrome);
// on real mobile viewports the frame fills the screen edge to edge instead
// (see CSS).
export function PhoneShell({ children }: PropsWithChildren) {
  return (
    <div className={styles.viewport}>
      <div className={styles.frame}>{children}</div>
    </div>
  );
}
