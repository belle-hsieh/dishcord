import React from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, Box } from "@mui/material";

export default function UserProfilePage() {
  const { id } = useParams();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Profile
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          User ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          User profile page - placeholder
        </Typography>
      </Box>
    </Container>
  );
}
