import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function MapPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Map
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          Map page - placeholder
        </Typography>
      </Box>
    </Container>
  );
}
