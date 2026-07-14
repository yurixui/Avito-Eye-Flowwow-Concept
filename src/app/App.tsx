import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PhoneShell } from "./PhoneShell";
import { ROUTES } from "./router";
import { StartScreen } from "@/screens/start/StartScreen";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { CameraScreen } from "@/screens/camera/CameraScreen";
import { useAppHeight } from "@/shared/hooks/useAppHeight";

export default function App() {
  useAppHeight();

  return (
    <BrowserRouter>
      <PhoneShell>
        <Routes>
          <Route path={ROUTES.start} element={<StartScreen />} />
          <Route path={ROUTES.home} element={<HomeScreen />} />
          <Route path={ROUTES.camera} element={<CameraScreen />} />
        </Routes>
      </PhoneShell>
    </BrowserRouter>
  );
}
