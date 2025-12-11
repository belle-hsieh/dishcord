/**
 
 * Interactive map interface for discovering restaurants near a location.
 * 
 * Features:
 * - Search restaurants by address/location with configurable radius (default 5 miles)
 * - Google Maps integration with restaurant markers
 * - Interactive map markers with hover and click functionality
 * - Restaurant detail dialog for quick preview
 * - Navigation to full restaurant detail page
 */

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { AppBar, Toolbar, Typography, Button, Container, Box, Alert } from "@mui/material";
import { useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";
import config from "../config.json";
import MapSearchPanel from "../components/MapSearchPanel";
import RestaurantMapView from "../components/RestaurantMapView";
import RestaurantDetailDialog from "../components/RestaurantDetailDialog";
import { geocodeAddress } from "../utils/mapUtils";

const DEFAULT_CENTER = { lat: 40.004379, lng: -75.218198 };
const GOOGLE_MAPS_API_KEY = "AIzaSyBed2vHtWoi0SlRf78shBVZnrNdirgBrJI";

export default function MapPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchLocation, setSearchLocation] = useState("");
  const [radius, setRadius] = useState(5);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(12);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const onMapLoad = useCallback((map) => setMap(map), []);
  const onMapUnmount = useCallback(() => setMap(null), []);

  const handleSearch = async () => {
    if (!searchLocation.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = await geocodeAddress(searchLocation);
      
      setMapCenter(coords);
      setMapZoom(13);
      
      if (map) {
        map.panTo(coords);
        map.setZoom(13);
      }

      const response = await axios.get(
        `http://${config.server_host}:${config.server_port}/map-restaurants`,
        { params: { latitude: coords.lat, longitude: coords.lng, radius } }
      );

      setRestaurants(response.data);

      if (response.data.length === 0) {
        setError("No restaurants found within this radius");
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError(err.message || "Could not find location or fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRestaurants([]);
    setSearchLocation("");
  };

  const handleMarkerClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRestaurant(null);
  };

  const handleViewRestaurant = () => {
    if (selectedRestaurant) {
      navigate(`/restaurant/${selectedRestaurant.business_id}`);
    }
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    const id = localStorage.getItem("userId");
    setIsLoggedIn(!!user);
    setUserId(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserId(null);
    navigate("/");
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar>
          <Box sx={{ mr: 2, display: "flex", alignItems: "center", width: 40, height: 40 }}>
            <img src="/logo.png" alt="Dishcord" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: "#FFFFFF" }}>
            Dishcord
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/explore-cities")}>
            Cities
          </Button>
          <Button color="inherit" onClick={() => navigate("/restaurant")}>
            Restaurants
          </Button>
          <Button color="inherit" onClick={() => navigate("/map")}>
            Map
          </Button>
          <Button color="inherit" onClick={() => navigate("/leaderboard")}>
            Leaderboard
          </Button>
          <Button color="inherit" onClick={() => navigate(userId ? `/user/${userId}` : "/login")}>
            Profile
          </Button>
          {isLoggedIn ? (
            <Button color="inherit" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <MapSearchPanel
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          radius={radius}
          setRadius={setRadius}
          onSearch={handleSearch}
          onClear={handleClear}
          loading={loading}
          showResults={restaurants.length > 0}
        />

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {restaurants.length > 0 && (
          <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.primary }}>
            Found {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}
          </Typography>
        )}

        <RestaurantMapView
          isLoaded={isLoaded}
          center={mapCenter}
          zoom={mapZoom}
          restaurants={restaurants}
          hoveredRestaurant={hoveredMarker}
          onMarkerClick={handleMarkerClick}
          onMarkerHover={setHoveredMarker}
          onMapLoad={onMapLoad}
          onMapUnmount={onMapUnmount}
        />
      </Container>

      <RestaurantDetailDialog
        open={dialogOpen}
        restaurant={selectedRestaurant}
        onClose={handleCloseDialog}
        onViewRestaurant={handleViewRestaurant}
      />
    </Box>
  );
}