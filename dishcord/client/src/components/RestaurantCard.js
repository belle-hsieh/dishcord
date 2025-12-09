import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PhotoDisplay from "./PhotoDisplay";
import config from "../config.json";

export default function RestaurantCard({ businessId, inDialog = false, onFavoriteChange, onVisitedChange }) {
  const [restaurant, setRestaurant] = useState(null);
  const [imageSrc] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [userId, setUserId] = useState(null);
  const apiBase = `http://${config.server_host}:${config.server_port}`;

  const fetchRestaurant = useCallback(async () => {
    try {
      const res = await axios.get(`${apiBase}/restaurant/${businessId}`);
      setRestaurant(res.data);
    } catch (err) {
      console.error("Failed to fetch restaurant", err);
    }
  }, [businessId, apiBase]);

  useEffect(() => {
    if (!businessId) return;
    fetchRestaurant();
    
    // Get userId from localStorage
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
  }, [businessId, fetchRestaurant]);

  // Check if restaurant is in favorites and visited
  useEffect(() => {
    if (!businessId || !userId) return;

    const checkStatus = async () => {
      try {
        // Check favorites
        const favoritesRes = await axios.get(`${apiBase}/users/${userId}/favorites`);
        const isInFavorites = favoritesRes.data.some(
          (r) => r.business_id === businessId
        );
        setIsFavorite(isInFavorites);

        // Check visited
        const visitedRes = await axios.get(`${apiBase}/users/${userId}/visited`);
        const isInVisited = visitedRes.data.some(
          (r) => r.business_id === businessId
        );
        setIsVisited(isInVisited);
      } catch (err) {
        console.error("Failed to check favorites/visited status", err);
      }
    };

    checkStatus();
  }, [businessId, userId, apiBase]);

  const handleFavoriteToggle = async () => {
    if (!userId || !businessId) return;

    try {
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(`${apiBase}/users/${userId}/favorites/${businessId}`);
        setIsFavorite(false);
        if (onFavoriteChange) {
          onFavoriteChange(businessId, false);
        }
      } else {
        // Add to favorites
        await axios.post(`${apiBase}/users/${userId}/favorites`, {
          business_id: businessId,
        });
        setIsFavorite(true);
        if (onFavoriteChange) {
          onFavoriteChange(businessId, true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const handleVisitedToggle = async () => {
    if (!userId || !businessId) return;

    try {
      if (isVisited) {
        // Remove from visited
        await axios.delete(`${apiBase}/users/${userId}/visited/${businessId}`);
        setIsVisited(false);
        if (onVisitedChange) {
          onVisitedChange(businessId, false);
        }
      } else {
        // Add to visited (using default 4 stars)
        await axios.post(`${apiBase}/users/${userId}/visited`, {
          business_id: businessId,
          stars: 4,
        });
        setIsVisited(true);
        if (onVisitedChange) {
          onVisitedChange(businessId, true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle visited", err);
    }
  };


  if (!restaurant) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        maxWidth: inDialog ? "100%" : 900, 
        mx: "auto", 
        mt: inDialog ? 0 : 4, 
        mb: inDialog ? 0 : 4,
        borderRadius: inDialog ? 0 : 3,
        boxShadow: inDialog ? 0 : 3,
        overflow: "hidden",
        border: inDialog ? "none" : "1px solid",
        borderColor: "divider"
      }}
    >
      {imageSrc && (
        <CardMedia
          component="img"
          height="320"
          image={imageSrc}
          alt={restaurant.name}
          sx={{ objectFit: "cover" }}
        />
      )}
      <CardContent sx={{ p: inDialog ? 3 : 4 }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            {restaurant.name}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
            <LocationOnIcon color="action" fontSize="medium" />
            <Typography variant="body1" color="text.secondary">
              {restaurant.address}
              {restaurant.city ? `, ${restaurant.city}` : ""}
              {restaurant.state ? `, ${restaurant.state}` : ""}
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 3,
              flexWrap: "wrap",
              py: 1.5,
              px: 2,
              bgcolor: "action.hover",
              borderRadius: 2
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <StarIcon sx={{ color: "#ffc107", fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {restaurant.stars ? Number(restaurant.stars).toFixed(1) : "N/A"}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {restaurant.review_count
                ? restaurant.review_count.toLocaleString()
                : 0}{" "}
              reviews
            </Typography>
            {restaurant.award && (
              <Chip
                label={`Michelin ${restaurant.award}`}
                color="primary"
                size="medium"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>

          {restaurant.categories && restaurant.categories.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", py: 1 }}>
              {restaurant.categories.map((c, i) => (
                <Chip 
                  key={i} 
                  label={c} 
                  size="medium" 
                  variant="outlined" 
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Box>
          )}

          <PhotoDisplay businessId={businessId} />

          <Divider sx={{ my: 1 }} />

          {userId && (
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                mt: 2,
                pt: 2,
                flexWrap: "wrap"
              }}
            >
              <Button
                variant={isFavorite ? "contained" : "outlined"}
                color={isFavorite ? "error" : "primary"}
                startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleFavoriteToggle}
                size="large"
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3
                }}
              >
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </Button>
              <Button
                variant={isVisited ? "contained" : "outlined"}
                color={isVisited ? "success" : "primary"}
                startIcon={isVisited ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                onClick={handleVisitedToggle}
                size="large"
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3
                }}
              >
                {isVisited ? "Remove from Visited" : "Add to Visited"}
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
