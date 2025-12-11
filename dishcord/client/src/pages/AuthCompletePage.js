/*


*/

import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography, Container } from "@mui/material";
import axios from "axios";
import config from "../config.json";

export default function AuthCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
    const completeAuth = async () => {
      if (userId) {
        try {
          // Fetch full user data
          const res = await axios.get(`${apiBase}/users/${userId}`);
          if (res.data && res.data.user_id) {
            // Store full user object so navigation can detect login
            localStorage.setItem("user", JSON.stringify(res.data));
            localStorage.setItem("userId", userId);
            navigate(`/user/${userId}`);
          } else {
            navigate("/login");
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    completeAuth();
  }, [userId, navigate, apiBase]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">
        {userId ? "Authentication successful! Redirecting..." : "Authentication failed. Redirecting to login..."}
      </Typography>
    </Container>
  );
}
