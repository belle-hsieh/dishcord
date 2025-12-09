import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
          <Button color="inherit" onClick={() => navigate("/user/1")}>
            Profile
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Restaurant Details
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          Restaurant ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Restaurant page - placeholder
        </Typography>
      </Box>
      </Container>
    </Box>
  );
}
