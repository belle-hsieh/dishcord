/**
 * Displays a horizontal gallery of restaurant photos for a given city.
 * 
 * Features:
 * - Fetches city restaurant photos from the API
 * - Auto-load functionality: Automatically loads photos when city and autoLoad are provided
 * - Photo gallery: Horizontal scrolling card-based gallery with hover effects
 * - Loading states: Shows loading indicators while fetching photos
 * - Error handling: Displays error messages if photo loading fails
 * - Blob URL management: Converts AWS URLs to blob URLs and handles cleanup on unmount
 * - Progressive loading: Photos load individually with per-photo loading states
 */

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Card,
  CardMedia 
} from "@mui/material";
import config from "../config.json";

export default function PhotoDisplay({ city, autoLoad = false }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [photoBlobs, setPhotoBlobs] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState({});
  const [error, setError] = useState(null);
  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
    if (city && autoLoad) {
      loadCityPhotos();
    }
    
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      Object.values(photoBlobs).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [city, autoLoad]);

  const loadCityPhotos = async () => {
    if (!city) return;
    
    setLoading(true);
    setError(null);
    try {
      const photoRes = await axios.get(`${apiBase}/city-photo/${encodeURIComponent(city)}`);
      
      if (photoRes.data && photoRes.data.photo_urls && photoRes.data.photo_urls.length > 0) {
        const photoUrls = photoRes.data.photo_urls;
        
        // Fetch all photos
        photoUrls.forEach(async (awsUrl, index) => {
          setLoadingPhotos(prev => ({ ...prev, [index]: true }));
          
          try {
            const imageRes = await axios.get(
              `${apiBase}/fetch-image`,
              {
                params: { aws_url: awsUrl },
                responseType: "blob"
              }
            );

            const blobUrl = URL.createObjectURL(imageRes.data);
            setPhotoBlobs(prev => ({ ...prev, [index]: blobUrl }));
          } catch (err) {
            console.error(`Error loading photo ${index}:`, err);
          } finally {
            setLoadingPhotos(prev => ({ ...prev, [index]: false }));
          }
        });
      } else {
        setError("No photos found for this city");
      }
    } catch (err) {
      console.error("Error loading city photos:", err);
      setError(err.response?.data?.error || "Failed to load city photos");
    } finally {
      setLoading(false);
    }
  };

  if (city && autoLoad) {
    const photoCount = Object.keys(photoBlobs).length;
    const isLoading = loading || Object.values(loadingPhotos).some(loading => loading);
    
    return (
      <Box sx={{ width: "100%" }}>
        {isLoading && photoCount === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && !isLoading && (
          <Typography variant="body2" color="error" sx={{ py: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}
        
        {photoCount > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              Restaurant Photos from {city}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                overflowY: "hidden",
                pb: 2,
                "&::-webkit-scrollbar": {
                  height: 8,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1",
                  borderRadius: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#888",
                  borderRadius: 4,
                  "&:hover": {
                    backgroundColor: "#555",
                  },
                },
              }}
            >
              {Object.entries(photoBlobs).map(([index, blobUrl]) => (
                <Card
                  key={index}
                  sx={{
                    minWidth: 300,
                    maxWidth: 300,
                    flexShrink: 0,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={blobUrl}
                    alt={`Restaurant photo ${parseInt(index) + 1} from ${city}`}
                    sx={{
                      height: 250,
                      objectFit: "cover",
                    }}
                  />
                </Card>
              ))}
            </Box>
            {isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  Loading more photos...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }
}