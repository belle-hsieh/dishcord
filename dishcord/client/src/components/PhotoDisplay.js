import { useState } from "react";
import axios from "axios";
import { Box, Button, CircularProgress } from "@mui/material";
import config from "../config.json";

export default function PhotoDisplay() {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiBase = `http://${config.server_host}:${config.server_port}`;

  const loadImage = async () => {
    setLoading(true);
    try {
      const awsUrl = "s3://dishcord-yelp-photos/uploaded-images/./-__4fB3-t0HUSOHb0lHZGA.jpg";

      const res = await axios.get(
        `${apiBase}/fetch-image`,
        {
          params: { aws_url: awsUrl },
          responseType: "blob"
        }
      );

      const blobUrl = URL.createObjectURL(res.data);
      setImageSrc(blobUrl);
    } catch (err) {
      console.error("Error loading image:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Button 
        variant="contained" 
        onClick={loadImage}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={20} /> : "Load Test Image"}
      </Button>

      {imageSrc && (
        <Box>
          <img
            src={imageSrc}
            alt="Fetched from AWS S3"
            style={{ 
              maxWidth: "100%", 
              height: "auto",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          />
        </Box>
      )}
    </Box>
  );
}
