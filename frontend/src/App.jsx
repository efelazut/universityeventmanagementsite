import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { ClubDetailPage } from "./pages/ClubDetailPage";
import { RoomsPage } from "./pages/RoomsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { ClubFormPage } from "./pages/ClubFormPage";
import { RoomFormPage } from "./pages/RoomFormPage";
import { EventFormPage } from "./pages/EventFormPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CalendarPage } from "./pages/CalendarPage";
import { HomePage } from "./pages/HomePage";
import { ClubsPage } from "./pages/ClubsPage";
import { OverlayShortcutPage } from "./pages/OverlayShortcutPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["Admin", "ClubManager"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/clubs/:id" element={<ClubDetailPage />} />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute roles={["Admin", "ClubManager"]}>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <OverlayShortcutPage type="notifications" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <OverlayShortcutPage type="messages" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute roles={["Admin", "ClubManager"]}>
              <EventFormPage mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute roles={["Admin", "ClubManager"]}>
              <EventFormPage mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs/new"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <ClubFormPage mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs/:id/edit"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <ClubFormPage mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/new"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <RoomFormPage mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/:id/edit"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <RoomFormPage mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute roles={["Admin", "ClubManager"]}>
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
}
