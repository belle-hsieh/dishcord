/**

 * Landing page and main entry point for the Dishcord application.
 * 
 * Features:
 * - Hero section with welcome message and branding
 * - City search functionality to navigate to city pages
 * - Quick navigation cards to key features:
 *   - Explore Cities: Discover restaurants and statistics across cities
 *   - Explore Restaurants: Browse and discover individual restaurants
 *   - View Map: Find restaurants near you on an interactive map
 *   - Leaderboard: View top restaurants and influential users
 *   - Your Profile: Manage favorites and visited restaurants
 * - Handles login/logout state and navigation
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
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
import MapIcon from "@mui/icons-material/Map";
import PersonIcon from "@mui/icons-material/Person";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";

export default function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();
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
      icon: <RoomServiceIcon sx={{ fontSize: 48, color: "#FFFFFF" }} />,
      onClick: () => navigate("/explore-cities"),
      bgColor: theme.palette.primary.main,
    },
    {
      title: "Explore Restaurants",
      description: "Browse and discover individual restaurants",
      icon: <RestaurantIcon sx={{ fontSize: 48, color: "#FFFFFF" }} />,
      onClick: () => navigate("/restaurant"),
      bgColor: theme.palette.warning.main,
    },
    {
      title: "View Map",
      description: "Find restaurants near you on an interactive map",
      icon: <MapIcon sx={{ fontSize: 48, color: "#FFFFFF" }} />,
      onClick: () => navigate("/map"),
      bgColor: theme.palette.success.main,
    },
    {
      title: "Leaderboard",
      description: "View top restaurants and influential users",
      icon: <LeaderboardIcon sx={{ fontSize: 48, color: "#FFFFFF" }} />,
      onClick: () => navigate("/leaderboard"),
      bgColor: theme.palette.info.main,
    },
    {
      title: "Your Profile",
      description: "Manage your favorites and visited restaurants",
      icon: <PersonIcon sx={{ fontSize: 48, color: "#FFFFFF" }} />,
      onClick: () => navigate(userId ? `/user/${userId}` : "/user/1"),
      bgColor: theme.palette.secondary.main,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      {/* Navigation Bar */}
      <AppBar position="static">
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

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        {/* Logo Above Hero */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center", width: "100%", height: 200 }}>
          <img src="/logo.png" alt="Dishcord" style={{ width: 200, height: 200, objectFit: "contain" }} />
        </Box>

        {/* Hero Section */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            mb: 6,
            backgroundColor: theme.palette.primary.main,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: "#FFFFFF",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, color: "#FFFFFF", mb: 2 }}
          >
            Welcome to Dishcord
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.95,
              color: "#FFFFFF",
              maxWidth: "700px",
              mx: "auto",
              fontWeight: 400,
            }}
          >
            Discover exceptional restaurants by combining crowd insights with Michelin-starred culinary excellence
          </Typography>

          {/* City Search */}
          <Box component="form" onSubmit={handleCitySearch} sx={{ mt: 4, display: "flex", gap: 1, maxWidth: "600px", mx: "auto" }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for a city..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              sx={{
                backgroundColor: "#FFFFFF",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.divider,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    sx={{ ml: 1, textTransform: "capitalize" }}
                  >
                    Search
                  </Button>
                ),
              }}
            />
          </Box>
        </Paper>

        {/* Featured Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3, color: theme.palette.text.primary }}
          >
            Start Exploring
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
                  transition: "all 0.3s ease-in-out",
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: `0px 12px 32px rgba(0, 0, 0, 0.15)`,
                  },
                }}
                onClick={link.onClick}
              >
                <CardContent
                  sx={{
                    flexGrow: 0,
                    textAlign: "center",
                    pt: 4,
                    pb: 3,
                    backgroundColor: link.bgColor,
                    color: "#FFFFFF",
                  }}
                >
                  <Box sx={{ color: "#FFFFFF", mb: 2 }}>{link.icon}</Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 700, color: "#FFFFFF" }}
                  >
                    {link.title}
                  </Typography>
                </CardContent>
                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 2, pb: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {link.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                  <Button
                    size="medium"
                    sx={{
                      color: "#FFFFFF",
                      backgroundColor: link.bgColor,
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: link.bgColor,
                        opacity: 0.9,
                      },
                    }}
                  >
                    Explore →
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}