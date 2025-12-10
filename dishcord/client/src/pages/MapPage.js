import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container, Box, Alert } from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";
import config from "../config.json";
import MapSearchPanel from "../components/MapSearchPanel";
import RestaurantMapView from "../components/RestaurantMapView";
import RestaurantDetailDialog from "../components/RestaurantDetailDialog";
import { geocodeAddress } from "../utils/mapUtils";

const DEFAULT_CENTER = { lat: 43.622879, lng: -116.240469 };
const GOOGLE_MAPS_API_KEY = "AIzaSyBed2vHtWoi0SlRf78shBVZnrNdirgBrJI";

export default function MapPage() {
  const navigate = useNavigate();
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
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <AppBar position="static">
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dishcord
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/city/New York")}>
            Cities
          </Button>
          <Button color="inherit" onClick={() => navigate("/map")}>
            Map
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
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
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