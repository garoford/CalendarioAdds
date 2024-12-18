import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Calendario } from "./presentation/page/Calendario";

export const RoutesItems = () => {
  return (
    <BrowserRouter basename="/calendar">
      <Routes>
        <Route path="/:id" element={<Calendario />} />
        <Route path="/" element={<Navigate to="/calendario/:id" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
