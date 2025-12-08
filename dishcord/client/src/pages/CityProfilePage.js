import React from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, Box } from "@mui/material";

export default function CityProfilePage() {
  const { cityName } = useParams();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {cityName ? decodeURIComponent(cityName) : "City Profile"}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          City profile page - placeholder
        </Typography>
      </Box>
    </Container>
  );
}
