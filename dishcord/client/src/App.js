import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import CityProfilePage from "./pages/CityProfilePage";
import MapPage from "./pages/MapPage";
import RestaurantPage from "./pages/RestaurantPage";
import UserProfilePage from "./pages/UserProfilePage";
import LoginPage from "./pages/LoginPage";
import AuthCompletePage from "./pages/AuthCompletePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/city/:cityName" element={<CityProfilePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/restaurants" element={<RestaurantPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/auth-complete" element={<AuthCompletePage />} />
      </Routes>
    </Router>
  );
}

export default App;
