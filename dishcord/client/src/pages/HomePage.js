import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  TextField,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MapIcon from "@mui/icons-material/Map";
import PersonIcon from "@mui/icons-material/Person";

export default function HomePage() {
  const navigate = useNavigate();
  const [citySearch, setCitySearch] = useState("");
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

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (citySearch.trim()) {
      navigate(`/city/${encodeURIComponent(citySearch.trim())}`);
    }
  };

  const quickLinks = [
    {
      title: "Explore Cities",
      description: "Discover restaurants and statistics across cities",
      icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate("/explore-cities"),
      color: "#d32f2f",
    },
    {
      title: "View Map",
      description: "Find restaurants near you on an interactive map",
      icon: <MapIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate("/map"),
      color: "#2e7d32",
    },
    {
      title: "User Profile",
      description: "Manage your favorites and visited restaurants",
      icon: <PersonIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate(userId ? `/user/${userId}` : "/user/1"),
      color: "#ed6c02",
    },
  ];

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

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Hero Section */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 2,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Dishcord
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Discover the best restaurants, explore Michelin-starred dining, and
            track your culinary adventures
          </Typography>

          {/* City Search */}
          <Box component="form" onSubmit={handleCitySearch} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for a city (e.g., New York, San Francisco, Chicago)"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              sx={{
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    sx={{ ml: 1 }}
                  >
                    Search
                  </Button>
                ),
              }}
            />
          </Box>
        </Paper>

        {/* Quick Links */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Quick Links
        </Typography>
        <Grid container spacing={3}>
          {quickLinks.map((link, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
                onClick={link.onClick}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 3 }}>
                  <Box sx={{ color: link.color, mb: 2 }}>{link.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {link.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {link.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                  <Button size="small" sx={{ color: link.color }}>
                    Explore →
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Featured Section */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Features
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate("/restaurants")}
              >
                <Typography variant="h6">Top Restaurants</Typography>
                <Typography variant="body2" color="text.secondary">
                  Find the most reviewed restaurants in any city
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate("/restaurants#michelin")}
              >
                <Typography variant="h6">Michelin Guide</Typography>
                <Typography variant="body2" color="text.secondary">
                  Discover Michelin-starred restaurants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6">Nearby Search</Typography>
                <Typography variant="body2" color="text.secondary">
                  Find highly-rated restaurants near you
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6">Track Visits</Typography>
                <Typography variant="body2" color="text.secondary">
                  Save favorites and rate your visits
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
  
}
