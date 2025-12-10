import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import config from "../config.json";
import PhotoDisplay from "../components/PhotoDisplay";

export default function CityProfilePage() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Data states
  const [cityStats, setCityStats] = useState(null);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [minRating, setMinRating] = useState("");
  const [minReviewCount, setMinReviewCount] = useState("");
  const [maxReviewCountGems, setMaxReviewCountGems] = useState("100");
  
  // Dialog states
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [minRatingGems, setMinRatingGems] = useState("4.0");
  
  const apiBase = `http://${config.server_host}:${config.server_port}`;
  const decodedCityName = cityName ? decodeURIComponent(cityName) : "";
  
  // Parse city and state from the cityName parameter
  // Format can be "City" or "City, State"
  const parseCityState = (cityStr) => {
    if (!cityStr) return { city: "", state: null };
    const parts = cityStr.split(',').map(p => p.trim());
    return {
      city: parts[0],
      state: parts.length > 1 ? parts[1] : null
    };
  };
  
  const { city, state } = parseCityState(decodedCityName);

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

  const fetchCityData = useCallback(async () => {
    if (!city) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with city and optional state
      const cityUrl = state 
        ? `${encodeURIComponent(city)}/${encodeURIComponent(state)}`
        : encodeURIComponent(city);
      
      // Fetch city stats
      const statsRes = await axios.get(`${apiBase}/city-stats/${cityUrl}`);
      setCityStats(statsRes.data);
      
      // Fetch top restaurants with filters
      const topParams = new URLSearchParams();
      if (minRating) topParams.append('min_rating', minRating);
      if (minReviewCount) topParams.append('min_review_count', minReviewCount);
      topParams.append('limit', '20');
      
      const topRes = await axios.get(
        `${apiBase}/city-top-restaurants/${cityUrl}?${topParams}`
      );
      setTopRestaurants(topRes.data);
      
      // Fetch hidden gems with filters
      const gemsParams = new URLSearchParams();
      if (minRatingGems) gemsParams.append('min_rating', minRatingGems);
      if (maxReviewCountGems) gemsParams.append('max_review_count', maxReviewCountGems);
      if (state) gemsParams.append('state', state);
      
      const gemsRes = await axios.get(
        `${apiBase}/hidden-gems/${encodeURIComponent(city)}?${gemsParams}`
      );
      // Filter to only show hidden gems
      const gems = gemsRes.data.filter(r => r.label === 'hidden_gem');
      setHiddenGems(gems);
      
    } catch (err) {
      console.error("Error fetching city data:", err);
      if (err.response && err.response.status === 404) {
        setError("City not found or has no restaurants in our database.");
      } else {
        setError("Failed to load city data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase, city, state, minRating, minReviewCount, minRatingGems, maxReviewCountGems]);

  useEffect(() => {
    // Only fetch data on initial mount or when city/state changes
    fetchCityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, state]);

  const handleApplyFilters = () => {
    fetchCityData();
  };

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRestaurant(null);
  };

  const formatMichelinBreakdown = (breakdown) => {
    if (!breakdown || Object.keys(breakdown).length === 0) {
      return "None";
    }
    return Object.entries(breakdown)
      .map(([award, count]) => `${count}x ${award}`)
      .join(", ");
  };

  if (loading) {
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
            <Button color="inherit" onClick={() => navigate("/explore-cities")}>
              Cities
            </Button>
            <Button color="inherit" onClick={() => navigate("/map")}>
              Map
            </Button>
            <Button color="inherit" onClick={() => navigate(userId ? `/user/${userId}` : "/user/1")}>
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
        <Container maxWidth="lg" sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  if (error) {
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
            <Button color="inherit" onClick={() => navigate("/explore-cities")}>
              Cities
            </Button>
            <Button color="inherit" onClick={() => navigate("/map")}>
              Map
            </Button>
            <Button color="inherit" onClick={() => navigate(userId ? `/user/${userId}` : "/user/1")}>
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
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dishcord
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/explore-cities")}>
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* City Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {decodedCityName}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Restaurant Profile & Statistics
          </Typography>
          
          {/* City Photo Gallery */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <PhotoDisplay city={city} autoLoad={true} />
          </Paper>
        </Box>

        {/* City Statistics Section */}
        {cityStats && (
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              City Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: "center", bgcolor: "#e3f2fd" }}>
                  <CardContent>
                    <StarIcon sx={{ fontSize: 40, color: "#1976d2", mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2" }}>
                      {cityStats.avg_yelp_rating ? Number(cityStats.avg_yelp_rating).toFixed(2) : "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Yelp Rating
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: "center", bgcolor: "#fff3e0" }}>
                  <CardContent>
                    <RestaurantIcon sx={{ fontSize: 40, color: "#f57c00", mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#f57c00" }}>
                      {cityStats.total_yelp_restaurants || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Yelp Restaurants
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: "center", bgcolor: "#fce4ec" }}>
                  <CardContent>
                    <EmojiEventsIcon sx={{ fontSize: 40, color: "#c2185b", mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#c2185b" }}>
                      {cityStats.total_michelin_restaurants || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Michelin Restaurants
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ textAlign: "center", bgcolor: "#f3e5f5" }}>
                  <CardContent>
                    <EmojiEventsIcon sx={{ fontSize: 40, color: "#7b1fa2", mb: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#7b1fa2", mt: 1 }}>
                      {formatMichelinBreakdown(cityStats.michelin_breakdown)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Michelin Breakdown
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Top Restaurants Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Top Restaurants
          </Typography>
          
          {/* Filters for Top Restaurants */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Min Rating"
                type="number"
                size="small"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                inputProps={{ min: 0, max: 5, step: 0.5 }}
                sx={{ width: { xs: "100%", sm: 150 } }}
              />
              <TextField
                label="Min Review Count"
                type="number"
                size="small"
                value={minReviewCount}
                onChange={(e) => setMinReviewCount(e.target.value)}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", sm: 150 } }}
              />
              <Button variant="contained" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Rating</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Reviews</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Michelin</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topRestaurants.length > 0 ? (
                  topRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.business_id} hover>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {restaurant.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {restaurant.address}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <StarIcon sx={{ color: "#ffc107", fontSize: 18 }} />
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {restaurant.stars ? Number(restaurant.stars).toFixed(1) : "N/A"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {restaurant.review_count ? restaurant.review_count.toLocaleString() : 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {restaurant.award ? (
                          <Chip 
                            label={restaurant.award} 
                            color="primary" 
                            size="small"
                            icon={<EmojiEventsIcon />}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleRestaurantClick(restaurant)}
                        >
                          View Restaurant
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No restaurants found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Hidden Gems Section */}
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Hidden Gems
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Underrated restaurants with high ratings but fewer reviews than average
          </Typography>
          
          {/* Filters for Hidden Gems */}
          <Box sx={{ mb: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Min Rating"
                type="number"
                size="small"
                value={minRatingGems}
                onChange={(e) => setMinRatingGems(e.target.value)}
                inputProps={{ min: 0, max: 5, step: 0.5 }}
                sx={{ width: { xs: "100%", sm: 150 } }}
              />
              <TextField
                label="Max Review Count"
                type="number"
                size="small"
                value={maxReviewCountGems}
                onChange={(e) => setMaxReviewCountGems(e.target.value)}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", sm: 150 } }}
              />
              <Button variant="contained" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={2}>
            {hiddenGems.length > 0 ? (
              hiddenGems.slice(0, 12).map((restaurant) => (
                <Grid item xs={12} sm={6} md={4} key={restaurant.business_id}>
                  <Card 
                    sx={{ 
                      height: "100%",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => handleRestaurantClick(restaurant.business_id)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {restaurant.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                        <StarIcon sx={{ color: "#ffc107", fontSize: 18 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {restaurant.yelp_stars ? Number(restaurant.yelp_stars).toFixed(1) : "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({restaurant.review_count || 0} reviews)
                        </Typography>
                      </Box>
                      <Chip 
                        label="Hidden Gem" 
                        color="success" 
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        View Details →
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" align="center">
                  No hidden gems found matching your criteria
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Container>

      {/* Restaurant Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedRestaurant && (
          <>
            <DialogTitle>{selectedRestaurant.name}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRestaurant.address || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Rating
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarIcon sx={{ color: "#ffc107", fontSize: 20 }} />
                    <Typography variant="body2">
                      {selectedRestaurant.stars ? Number(selectedRestaurant.stars).toFixed(1) : "N/A"} / 5
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Reviews
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRestaurant.review_count ? selectedRestaurant.review_count.toLocaleString() : 0} reviews
                  </Typography>
                </Box>
                {selectedRestaurant.award && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Michelin Award
                    </Typography>
                    <Chip 
                      label={selectedRestaurant.award} 
                      color="primary" 
                      size="small"
                      icon={<EmojiEventsIcon />}
                    />
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
