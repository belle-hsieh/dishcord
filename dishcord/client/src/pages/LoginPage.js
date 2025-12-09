import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import RestaurantIcon from "@mui/icons-material/Restaurant";
import GoogleIcon from "@mui/icons-material/Google";

const API_BASE = "http://localhost:8080";
const GOOGLE_CLIENT_ID =
  "561876821532-jusvssgih5hebr5kqlr4n5j5p3fgpokd.apps.googleusercontent.com";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

        // Render the official Google button
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
   * MANUAL BUTTON CLICK → OPEN GOOGLE POPUP
   *******************************************/
  const handleGoogleButtonClick = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt(); // opens Google login popup
    }
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
      <AppBar position="static">
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dishcord
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
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
           
            {/* Google automatically replaces this div with the real button */}
            <div id="google-signin-button"></div>
          </Box>

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
