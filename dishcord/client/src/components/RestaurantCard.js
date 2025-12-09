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
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import config from "../config.json";

export default function RestaurantCard({ businessId }) {
  const [restaurant, setRestaurant] = useState(null);
  const [imageSrc] = useState(null);
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
  }, [businessId, fetchRestaurant]);


  if (!restaurant) {
    return null;
  }

  return (
    <Card sx={{ maxWidth: 900, mx: "auto", mt: 4, mb: 4 }}>
      {imageSrc && (
        <CardMedia
          component="img"
          height="320"
          image={imageSrc}
          alt={restaurant.name}
        />
      )}
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h5" component="h1">
            {restaurant.name}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOnIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {restaurant.address}
              {restaurant.city ? `, ${restaurant.city}` : ""}
              {restaurant.state ? `, ${restaurant.state}` : ""}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <StarIcon sx={{ color: "#ffc107", fontSize: 20 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {restaurant.stars ? Number(restaurant.stars).toFixed(1) : "N/A"}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {restaurant.review_count
                ? restaurant.review_count.toLocaleString()
                : 0}{" "}
              reviews
            </Typography>
            {restaurant.award && (
              <Chip
                label={`Michelin ${restaurant.award}`}
                color="primary"
                size="small"
              />
            )}
          </Box>

          {restaurant.categories && restaurant.categories.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {restaurant.categories.map((c, i) => (
                <Chip key={i} label={c} size="small" variant="outlined" />
              ))}
            </Box>
          )}

          {(restaurant.latitude || restaurant.longitude) && (
            <Typography variant="body2" color="text.secondary">
              Photos
            </Typography>
          )}

          <Divider />
        </Stack>
      </CardContent>
    </Card>
  );
}
