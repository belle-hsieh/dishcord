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
  CircularProgress,
  Paper,
  Rating,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import config from "../config.json";

export default function RestaurantCard({ businessId, inDialog = false, onFavoriteChange, onVisitedChange }) {
  const [restaurant, setRestaurant] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [visitedRating, setVisitedRating] = useState(null);
  const [userId, setUserId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoBlobs, setPhotoBlobs] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState({});
  const [showAllReviews, setShowAllReviews] = useState(false);
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

  // Fetch photos for the restaurant
  useEffect(() => {
    if (!businessId) return;

    const fetchPhotos = async () => {
      try {
        const res = await axios.get(`${apiBase}/photos/${businessId}`);
        const photoUrls = res.data || [];
        // Convert URLs to photo objects (like RestaurantDetailDialog expects)
        const photoObjects = photoUrls.slice(0, 6).map((awsUrl, idx) => ({
          photo_id: idx, // Use index as photo_id since we only have URLs
          aws_url: awsUrl,
          label: null,
          caption: null
        }));
        setPhotos(photoObjects);
      } catch (err) {
        console.error("Failed to fetch photos", err);
        setPhotos([]);
      }
    };

    fetchPhotos();
  }, [businessId, apiBase]);

  // Fetch image blobs for photos (same logic as RestaurantDetailDialog)
  useEffect(() => {
    if (photos.length === 0) return;

    const fetchImageBlobs = async () => {
      const photosToFetch = photos.slice(0, 6);
      
      for (const photo of photosToFetch) {
        if (!photo.aws_url || photoBlobs[photo.photo_id]) continue;
        
        setLoadingPhotos(prev => ({ ...prev, [photo.photo_id]: true }));
        
        try {
          const res = await axios.get(
            `${apiBase}/fetch-image`,
            {
              params: { aws_url: photo.aws_url },
              responseType: "blob"
            }
          );
          const blobUrl = URL.createObjectURL(res.data);
          setPhotoBlobs(prev => ({ ...prev, [photo.photo_id]: blobUrl }));
        } catch (err) {
          console.error(`Error loading photo ${photo.photo_id}:`, err);
        } finally {
          setLoadingPhotos(prev => ({ ...prev, [photo.photo_id]: false }));
        }
      }
    };

    fetchImageBlobs();

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(photoBlobs).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [photos, apiBase]);

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
        const visitedEntry = visitedRes.data.find(
          (r) => r.business_id === businessId
        );
        setIsVisited(!!visitedEntry);
        setVisitedRating(visitedEntry?.user_stars ?? visitedEntry?.stars ?? null);
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

  const handleVisitedRatingChange = async (_event, value) => {
    if (!userId || !businessId) return;
    if (!value || value < 1 || value > 5) return;

    setVisitedRating(value);

    try {
      await axios.post(`${apiBase}/users/${userId}/visited`, {
        business_id: businessId,
        stars: value,
      });
      setIsVisited(true);
      if (onVisitedChange) {
        onVisitedChange(businessId, true, value);
      }
    } catch (err) {
      console.error("Failed to set visited rating", err);
    }
  };

  const handleVisitedRemove = async () => {
    if (!userId || !businessId) return;
    try {
      await axios.delete(`${apiBase}/users/${userId}/visited/${businessId}`);
      setIsVisited(false);
      setVisitedRating(null);
      if (onVisitedChange) {
        onVisitedChange(businessId, false, null);
      }
    } catch (err) {
      console.error("Failed to remove visited", err);
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

          {photos.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                📸 Photos
              </Typography>
              <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
                {photos.slice(0, 6).map((photo, idx) => (
                  <Card key={idx} sx={{ minWidth: 200, maxWidth: 200, flexShrink: 0 }}>
                    <CardMedia
                      sx={{
                        height: 140,
                        bgcolor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative"
                      }}
                    >
                      {loadingPhotos[photo.photo_id] && (
                        <CircularProgress size={30} />
                      )}
                      {!loadingPhotos[photo.photo_id] && photoBlobs[photo.photo_id] && (
                        <img
                          src={photoBlobs[photo.photo_id]}
                          alt={photo.label || "Restaurant photo"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      )}
                      {!loadingPhotos[photo.photo_id] && !photoBlobs[photo.photo_id] && (
                        <Typography variant="caption" color="text.secondary">
                          {photo.label || "Food"}
                        </Typography>
                      )}
                    </CardMedia>
                    {photo.caption && (
                      <CardContent sx={{ p: 1 }}>
                        <Typography variant="caption" noWrap title={photo.caption}>
                          {photo.caption}
                        </Typography>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {restaurant.reviews && restaurant.reviews.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                💬 Reviews
              </Typography>
              {(showAllReviews ? restaurant.reviews : restaurant.reviews.slice(0, 2)).map((review, idx) => (
                <Paper key={idx} elevation={1} sx={{ p: 2, mb: 2, bgcolor: "#f9f9f9" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Rating value={review.stars} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {review.text && review.text.length > 300
                      ? `${review.text.substring(0, 300)}...`
                      : review.text}
                  </Typography>
                </Paper>
              ))}
              {restaurant.reviews.length > 2 && (
                <Button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  {showAllReviews ? "View Less" : `View More (${restaurant.reviews.length - 2} more)`}
                </Button>
              )}
            </Box>
          )}

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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                  Visited Rating
                </Typography>
                <Rating
                  name="visited-rating"
                  value={visitedRating}
                  onChange={handleVisitedRatingChange}
                  max={5}
                  precision={1}
                  icon={<StarIcon fontSize="inherit" />}
                  emptyIcon={<StarIcon fontSize="inherit" sx={{ opacity: 0.3 }} />}
                />
              </Box>
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
                onClick={isVisited ? handleVisitedRemove : () => handleVisitedRatingChange(null, visitedRating)}
                disabled={!isVisited && !visitedRating}
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
