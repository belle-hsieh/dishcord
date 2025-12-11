import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Rating,
  CircularProgress
} from "@mui/material";
import config from "../config.json";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import ReviewsIcon from "@mui/icons-material/Reviews";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import { getStatusBadge, getStatusDescription } from "../utils/mapUtils";

export default function RestaurantDetailDialog({ 
  open, 
  restaurant, 
  onClose, 
  onViewRestaurant 
}) {
  const [photoBlobs, setPhotoBlobs] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState({});
  const apiBase = `http://${config.server_host}:${config.server_port}`;

  // Fetch photos when restaurant changes
  useEffect(() => {
    if (!restaurant || !restaurant.photos || restaurant.photos.length === 0) {
      return;
    }

    const fetchPhotos = async () => {
      const photosToFetch = restaurant.photos.slice(0, 3);
      
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

    fetchPhotos();

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(photoBlobs).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [restaurant]);

  if (!restaurant) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: "#667eea", color: "white", position: "relative" }}>
        <Box sx={{ pr: 6 }}>
          <Typography variant="h5" fontWeight="bold">
            {restaurant.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {restaurant.address}, {restaurant.city}, {restaurant.state}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white"
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '40px !important', px: 3, pb: 3 }}>
        {restaurant.dishcord_status && (
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Chip
              label={`🎯 ${restaurant.dishcord_status}`}
              sx={{
                ...getStatusBadge(restaurant.dishcord_status),
                fontSize: "1.1rem",
                py: 2.5,
                px: 2,
                fontWeight: "bold"
              }}
            />
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              {getStatusDescription(restaurant.dishcord_status)}
            </Typography>
          </Box>
        )}

        {restaurant.michelin && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "#FFF3E0", borderRadius: 2, border: "2px solid #FFB300" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 1 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#F57C00" }}>
                ⭐ Michelin: {restaurant.michelin.award}
              </Typography>
              {restaurant.michelin.price && (
                <Chip
                  label={`Price: ${restaurant.michelin.price}`}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {restaurant.michelin.greenStar && (
                <Chip
                  label="🌿 Green Star"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            {restaurant.michelin.description && (
              <Typography variant="body2" sx={{ fontStyle: "italic", mt: 1 }}>
                "{restaurant.michelin.description}"
              </Typography>
            )}
          </Box>
        )}

        {restaurant.dishcord_status && <Divider sx={{ mb: 3 }} />}

        <Box sx={{ display: "flex", gap: 3, mb: 3, justifyContent: "center", flexWrap: "wrap" }}>
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
              <StarIcon sx={{ color: "#FFC107" }} />
              <Typography variant="h6" fontWeight="bold">
                {restaurant.yelp_stars}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Rating
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
              <ReviewsIcon sx={{ color: "#667eea" }} />
              <Typography variant="h6" fontWeight="bold">
                {restaurant.review_count}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Reviews
            </Typography>
          </Box>
        </Box>

        {restaurant.categories && restaurant.categories.length > 0 && (
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
              <LocalDiningIcon sx={{ color: "#667eea" }} />
              <Typography variant="h6" fontWeight="bold">
                Relevant Tags
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
              {restaurant.categories.slice(0, 5).map((category, idx) => (
                <Chip
                  key={idx}
                  label={category}
                  size="small"
                  sx={{ bgcolor: "#f0f0f0" }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {restaurant.photos && restaurant.photos.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              📸 Photos
            </Typography>
            <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
              {restaurant.photos.slice(0, 3).map((photo, idx) => (
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
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Top Reviews
            </Typography>
            {restaurant.reviews.slice(0, 2).map((review, idx) => (
              <Paper key={idx} elevation={1} sx={{ p: 2, mb: 2, bgcolor: "#f9f9f9" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Rating value={review.stars} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {review.text && review.text.length > 200
                    ? `${review.text.substring(0, 200)}...`
                    : review.text}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onViewRestaurant}
            sx={{
              bgcolor: "#667eea",
              "&:hover": { bgcolor: "#5568d3" },
              px: 4
            }}
          >
            View Full Restaurant Page
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
