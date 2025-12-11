import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  AppBar,
  Toolbar,
} from "@mui/material";

const API_BASE = "http://localhost:8080";
const GOOGLE_CLIENT_ID =
  "561876821532-jusvssgih5hebr5kqlr4n5j5p3fgpokd.apps.googleusercontent.com";

export default function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  // Check if user is logged in
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

  /*******************************************
   * GOOGLE SIGN-IN CALLBACK
   *******************************************/
  const handleGoogleSignIn = useCallback(
    async (response) => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.post(`${API_BASE}/auth/google`, {
          idToken: response.credential,
        });

        if (res.data && res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("userId", res.data.user.user_id);

          navigate(`/user/${res.data.user.user_id}`);
        }
      } catch (err) {
        console.error("Google sign-in error:", err);
        setError(
          err.response?.data?.error ||
            "Failed to sign in with Google. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  /*******************************************
   * LOAD GOOGLE IDENTITY SERVICES
   *******************************************/
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });
 
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
          }
        );
      }
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [handleGoogleSignIn]);


  /*******************************************
   * GITHUB LOGIN
   *******************************************/
  const handleGithubLogin = () => {
    window.location.href = "http://localhost:8080/auth/github/start";
  };
  
  /*******************************************
   * LOCAL LOGIN / SIGNUP
   *******************************************/
  const handleLocalAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
    if (isSignup) {
      const res = await axios.post(`${API_BASE}/auth/signup`, {
        name,
        email,
        password,
      });

      if (res.data && res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("userId", res.data.user.user_id);
        navigate(`/user/${res.data.user.user_id}`);
      }
    } else {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });

      if (res.data && res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("userId", res.data.user.user_id);
        navigate(`/user/${res.data.user.user_id}`);
      }
    }
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        err.response?.data?.error || "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar>
          <Box sx={{ mr: 2, display: "flex", alignItems: "center", width: 40, height: 40 }}>
            <img src="/logo.png" alt="Dishcord" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#FFFFFF" }}>
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

      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {isSignup ? "Create Account" : "Sign In"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            {isSignup
              ? "Create a new account to start tracking your favorite restaurants"
              : "Sign in to access your profile and saved restaurants"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* GOOGLE LOGIN */}
          <Box sx={{ mb: 3 }}>
           
            <div id="google-signin-button"></div>
          </Box>

          {/* GITHUB LOGIN */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGithubLogin}
            disabled={loading}
            sx={{ mb: 2, py: 1.5 }}
          >
            {loading ? "Processing..." : "Continue with GitHub"}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* LOCAL SIGNIN / SIGNUP */}
          <Box component="form" onSubmit={handleLocalAuth}>
            {isSignup && (
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
              />
            )}
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </Button>
          </Box>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
                setEmail("");
                setPassword("");
                setName("");
              }}
              size="small"
            >
              {isSignup
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
