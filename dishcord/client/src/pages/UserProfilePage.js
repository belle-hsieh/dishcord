import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PersonIcon from "@mui/icons-material/Person";
import config from "../config.json";

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = () => {
      const storedUser = localStorage.getItem("user");
      const storedId = localStorage.getItem("userId");
      const wasLoggedIn = isLoggedIn;
      setIsLoggedIn(!!storedUser);
      setUserId(storedId);
      
      // If user just logged out and was viewing their own profile, clear user data
      if (wasLoggedIn && !storedUser && id && storedId && id === storedId.toString()) {
        setUser(null);
      } else if (!storedUser && id && userId && id === userId.toString()) {
        // User is logged out and viewing their own profile
        setUser(null);
      }
    };
    
    checkLoginStatus();
    
    // Listen for storage changes (when logout happens on another tab/window)
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, userId, isLoggedIn]);

  const handleLogout = () => {
    const currentUserId = userId; // Store before clearing
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserId(null);
    // Always clear user data when logging out (especially if viewing own profile)
    if (id && currentUserId && (id.toString() === currentUserId.toString() || id === currentUserId)) {
      setUser(null);
      setError("");
    }
    // Small delay to ensure state updates before navigation
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

      // Check if user is logged out and was viewing their own profile
      const storedId = localStorage.getItem("userId");
      const wasOwnProfile = userId && id && (id.toString() === userId.toString() || id === userId);
      
      if (!storedId && wasOwnProfile) {
        // User logged out while viewing their own profile - don't fetch, clear data
        setUser(null);
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`${apiBase}/users/${id}`);
        if (res.data && res.data.user_id) {
          setUser(res.data);
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
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <PersonIcon sx={{ fontSize: 48, mr: 2, color: "primary.main" }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {user.name || "User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  User ID: {user.user_id}
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
        ) : null}
      </Container>
    </Box>
  );
}
