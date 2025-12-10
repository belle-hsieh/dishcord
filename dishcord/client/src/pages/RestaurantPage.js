import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Dialog,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import RestaurantCard from "../components/RestaurantCard";
import RestaurantDetailDialog from "../components/RestaurantDetailDialog";
import config from "../config.json";

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [citySearch, setCitySearch] = useState("");
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [michelinList, setMichelinList] = useState([]);
  const [michelinPage, setMichelinPage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
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

  const fetchMichelin = useCallback(async () => {
    try {
      const res = await axios.get(`${apiBase}/michelin-yelp-matches`);
      setMichelinList(res.data || []);
    } catch (err) {
      console.error("Error fetching michelin data:", err);
      setMichelinList([]);
    }
  }, [apiBase]);

  useEffect(() => {
    if (id) {

      return;
    }
    fetchMichelin();
  }, [id, fetchMichelin]);

  const fetchRestaurantById = useCallback(async (businessId) => {
    try {
      const res = await axios.get(`${apiBase}/restaurant/${businessId}`);
      const restaurant = res.data;
      // Map stars to yelp_stars for compatibility with RestaurantDetailDialog
      if (restaurant.stars && !restaurant.yelp_stars) {
        restaurant.yelp_stars = restaurant.stars;
      }
      return restaurant;
    } catch (err) {
      console.error("Failed to fetch restaurant", err);
      return null;
    }
  }, [apiBase]);

  const handleRestaurantClick = async (businessId) => {
    if (!businessId) return;
    
    const restaurant = await fetchRestaurantById(businessId);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRestaurant(null);
  };

  const handleViewFullPage = () => {
    if (selectedRestaurant?.business_id) {
      setIsDialogOpen(false);
      navigate(`/restaurant/${selectedRestaurant.business_id}`);
    }
  };

  useEffect(() => {
    // reset page when list changes
    setMichelinPage(0);
  }, [michelinList]);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, topRestaurants, michelinList]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!citySearch.trim()) return;
    try {
      const res = await axios.get(
        `${apiBase}/top-restaurants/${encodeURIComponent(citySearch.trim())}`
      );
      setTopRestaurants(res.data || []);
    } catch (err) {
      console.error("Error fetching top restaurants:", err);
      setTopRestaurants([]);
    }
  };

  const renderNav = () => (
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
  );

  // If there's an ID, show the full restaurant detail page
  if (id) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        {renderNav()}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <RestaurantCard businessId={id} />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {renderNav()}

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper id="top-restaurants" elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Top Restaurants
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Find the most reviewed restaurants in any city
          </Typography>

          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}
          >
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Enter city name"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
            <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
              Search
            </Button>
          </Box>

          {topRestaurants.length > 0 && (
            <List>
              {topRestaurants.map((r, idx) => (
                <ListItemButton
                  key={idx}
                  onClick={() => handleRestaurantClick(r.business_id)}
                  disabled={!r.business_id}
                >
                  <ListItemText
                    primary={r.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {r.address}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <StarIcon sx={{ color: "#ffc107", fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {r.stars ? Number(r.stars).toFixed(1) : "N/A"} •{" "}
                            {r.review_count?.toLocaleString?.() || 0} reviews
                          </Typography>
                        </Stack>
                      </Box>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        <Paper id="michelin" elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Michelin Guide
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Discover Michelin-starred restaurants
          </Typography>

          {michelinList.length > 0 ? (
            <List>
              {michelinList
                .slice(michelinPage * 7, michelinPage * 7 + 7)
                .map((r, idx) => (
                  <ListItemButton
                    key={`${michelinPage}-${idx}`}
                    onClick={() => handleRestaurantClick(r.business_id)}
                    disabled={!r.business_id}
                  >
                    <ListItemText
                      primary={r.yelp_name || r.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {r.yelp_address || r.address}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <StarIcon sx={{ color: "#ffc107", fontSize: 16 }} />
                            <Typography variant="body2" color="text.secondary">
                              {r.stars ? Number(r.stars).toFixed(1) : "N/A"} • Michelin{" "}
                              {r.award || "selected"}
                            </Typography>
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No Michelin restaurants found yet.
            </Typography>
          )}
          {michelinList.length > 7 && (
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center" justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                disabled={michelinPage === 0}
                onClick={() => setMichelinPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                Page {michelinPage + 1} / {Math.ceil(michelinList.length / 7)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={(michelinPage + 1) * 7 >= michelinList.length}
                onClick={() =>
                  setMichelinPage((p) =>
                    (p + 1) * 7 >= michelinList.length ? p : p + 1
                  )
                }
              >
                Next
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>

      <RestaurantDetailDialog
        open={isDialogOpen}
        restaurant={selectedRestaurant}
        onClose={handleCloseDialog}
        onViewRestaurant={handleViewFullPage}
      />
    </Box>
  );
}
