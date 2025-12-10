import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import config from "../config.json";

// Capitalize first letter of each word
const capitalizeCityName = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function CityCard({ cityName }) {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(null);

  const apiBase = `http://${config.server_host}:${config.server_port}`;

  const fetchCityPhoto = async () => {
    try {
      const response = await fetch(
        `${apiBase}/city-photo/${encodeURIComponent(cityName)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPhotoUrl(data.photo_url);
      } else {
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error(`Error fetching photo for ${cityName}:`, err);
      setPhotoUrl(null);
    }
  };

  useEffect(() => {
    fetchCityPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName]);

  const handleViewCity = () => {
    navigate(`/city/${encodeURIComponent(cityName)}`);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      {/* Photo or Placeholder */}
      {photoUrl ? (
        <CardMedia
          component="img"
          height="200"
          image={photoUrl}
          alt={cityName}
          sx={{
            objectFit: "cover",
            backgroundColor: "#f5f5f5",
          }}
          onError={() => setPhotoUrl(null)}
        />
      ) : (
        <div
          style={{
            height: "200px",
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RestaurantIcon sx={{ fontSize: 60, color: "#cccccc" }} />
        </div>
      )}

      <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 2 }}>
        {/* City Name */}
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          {capitalizeCityName(cityName)}
        </Typography>

        {/* Subtitle */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Explore restaurants in this city
        </Typography>
      </CardContent>

      {/* Action Button */}
      <CardActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleViewCity}
          sx={{ textTransform: "none" }}
        >
          View Profile →
        </Button>
      </CardActions>
    </Card>
  );
}
