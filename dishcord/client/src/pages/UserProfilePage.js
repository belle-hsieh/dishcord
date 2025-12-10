import React, { useState, useEffect, useRef } from "react";
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
  CircularProgress,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Divider,
  Dialog,
  IconButton,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PersonIcon from "@mui/icons-material/Person";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantCard from "../components/RestaurantCard";
import config from "../config.json";

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [visited, setVisited] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingVisited, setLoadingVisited] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const previousUserIdRef = useRef(null);

  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
    const checkLoginStatus = () => {
      const storedUser = localStorage.getItem("user");
      const storedId = localStorage.getItem("userId");
      const wasLoggedIn = isLoggedIn;
      setIsLoggedIn(!!storedUser);
      setUserId(storedId);
      

      if (storedId) {
        previousUserIdRef.current = storedId;
      }
      
      if (wasLoggedIn && !storedUser && id && previousUserIdRef.current && id.toString() === previousUserIdRef.current.toString()) {
        setUser(null);
        previousUserIdRef.current = null;
      } else if (!storedUser && id && previousUserIdRef.current && id.toString() === previousUserIdRef.current.toString()) {
        setUser(null);
        previousUserIdRef.current = null;
      }
    };
    
    checkLoginStatus();
    
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, userId, isLoggedIn]);

  const handleLogout = () => {
    const currentUserId = userId;
    // Store the userId in ref BEFORE clearing, so fetchUser can check it
    if (currentUserId) {
      previousUserIdRef.current = currentUserId;
    }
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserId(null);
    if (id && currentUserId && (id.toString() === currentUserId.toString() || id === currentUserId)) {
      setUser(null);
      setError("");
    }
    setTimeout(() => {
      navigate("/");
    }, 0);
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      const storedId = localStorage.getItem("userId");
      
      // If logged out and viewing what was our own profile, don't fetch
      if (!storedId && previousUserIdRef.current && id.toString() === previousUserIdRef.current.toString()) {
        setUser(null);
        setError("");
        setLoading(false);
        return;
      }

      // Only fetch if we're logged in OR viewing someone else's profile
      try {
        setLoading(true);
        const res = await axios.get(`${apiBase}/users/${id}`);
        if (res.data && res.data.user_id) {
          // Don't set user if we're logged out and this was our own profile
          if (storedId || res.data.user_id.toString() !== previousUserIdRef.current?.toString()) {
            setUser(res.data);
          }
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, apiBase, userId]);
  useEffect(() => {
    if (!id) return;

    const fetchFavorites = async () => {
      try {
        setLoadingFavorites(true);
        const res = await axios.get(`${apiBase}/users/${id}/favorites`);
        setFavorites(res.data || []);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    const fetchVisited = async () => {
      try {
        setLoadingVisited(true);
        const res = await axios.get(`${apiBase}/users/${id}/visited`);
        setVisited(res.data || []);
      } catch (err) {
        console.error("Error fetching visited:", err);
        setVisited([]);
      } finally {
        setLoadingVisited(false);
      }
    };

    fetchFavorites();
    fetchVisited();
  }, [id, apiBase]);

  const handleRestaurantClick = (businessId) => {
    if (businessId) {
      setSelectedRestaurantId(businessId);
      setIsCardOpen(true);
    }
  };

  const handleCloseCard = () => {
    setIsCardOpen(false);
    setSelectedRestaurantId(null);
  };

  const handleFavoriteChange = (businessId, isAdded) => {
    if (isAdded) {
      const fetchFavorites = async () => {
        try {
          const res = await axios.get(`${apiBase}/users/${id}/favorites`);
          setFavorites(res.data || []);
        } catch (err) {
          console.error("Error fetching favorites:", err);
        }
      };
      fetchFavorites();
    } else {
      setFavorites(prev => prev.filter(r => r.business_id !== businessId));
    }
  };

  const handleVisitedChange = (businessId, isAdded) => {
    if (isAdded) {
      const fetchVisited = async () => {
        try {
          const res = await axios.get(`${apiBase}/users/${id}/visited`);
          setVisited(res.data || []);
        } catch (err) {
          console.error("Error fetching visited:", err);
        }
      };
      fetchVisited();
    } else {
      setVisited(prev => prev.filter(r => r.business_id !== businessId));
    }
  };

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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : user ? (
          <>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <PersonIcon sx={{ fontSize: 48, mr: 2, color: "primary.main" }} />
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {user.name || "User"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                {user.email && (
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {user.email}
                  </Typography>
                )}
                {(user.city || user.state) && (
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Location:</strong>{" "}
                    {[user.city, user.state].filter(Boolean).join(", ") || "Not set"}
                  </Typography>
                )}
                {user.time_created && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Member since: {new Date(user.time_created).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* Favorites Section */}
          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <FavoriteIcon sx={{ fontSize: 32, mr: 2, color: "error.main" }} />
              <Typography variant="h5" component="h2">
                Favorites
              </Typography>
            </Box>
            {loadingFavorites ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : favorites.length > 0 ? (
              <List>
                {favorites.map((restaurant, idx) => (
                  <React.Fragment key={restaurant.business_id || idx}>
                    <ListItemButton
                      onClick={() => handleRestaurantClick(restaurant.business_id)}
                      disabled={!restaurant.business_id}
                    >
                      <ListItemText
                        primary={restaurant.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {restaurant.address}
                              {restaurant.city ? `, ${restaurant.city}` : ""}
                              {restaurant.state ? `, ${restaurant.state}` : ""}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <StarIcon sx={{ color: "#ffc107", fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {restaurant.stars ? Number(restaurant.stars).toFixed(1) : "N/A"} •{" "}
                                {restaurant.review_count?.toLocaleString?.() || 0} reviews
                              </Typography>
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {idx < favorites.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No favorite restaurants yet.
              </Typography>
            )}
          </Paper>

          {/* Visited Section */}
          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 32, mr: 2, color: "success.main" }} />
              <Typography variant="h5" component="h2">
                Visited
              </Typography>
            </Box>
            {loadingVisited ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : visited.length > 0 ? (
              <List>
                {visited.map((restaurant, idx) => (
                  <React.Fragment key={restaurant.business_id || idx}>
                    <ListItemButton
                      onClick={() => handleRestaurantClick(restaurant.business_id)}
                      disabled={!restaurant.business_id}
                    >
                      <ListItemText
                        primary={restaurant.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {restaurant.address}
                              {restaurant.city ? `, ${restaurant.city}` : ""}
                              {restaurant.state ? `, ${restaurant.state}` : ""}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <StarIcon sx={{ color: "#ffc107", fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {restaurant.stars ? Number(restaurant.stars).toFixed(1) : "N/A"} •{" "}
                                {restaurant.review_count?.toLocaleString?.() || 0} reviews
                              </Typography>
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {idx < visited.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No visited restaurants yet.
              </Typography>
            )}
          </Paper>
          </>
        ) : (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <PersonIcon sx={{ fontSize: 48, mr: 2, color: "text.secondary" }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Guest
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please log in to view your profile
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Container>

      <Dialog
        open={isCardOpen}
        onClose={handleCloseCard}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            onClick={handleCloseCard}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 1,
              bgcolor: "background.paper",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedRestaurantId && (
            <RestaurantCard 
              businessId={selectedRestaurantId} 
              inDialog={true}
              onFavoriteChange={handleFavoriteChange}
              onVisitedChange={handleVisitedChange}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
