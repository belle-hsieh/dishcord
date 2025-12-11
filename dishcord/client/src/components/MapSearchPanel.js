import React from "react";
import { Paper, Typography, Box, TextField, Button, Chip, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const RADIUS_OPTIONS = [1, 5, 10, 20];

export default function MapSearchPanel({ 
  searchLocation, 
  setSearchLocation, 
  radius, 
  setRadius, 
  onSearch, 
  onClear, 
  loading, 
  showResults 
}) {
  const theme = useTheme();
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: "white"
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#FFFFFF" }}>
        🗺️ Discover Hidden Gems
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.95, color: "#FFFFFF" }}>
        Search by address, city, or zip code to find overrated and underrated restaurants near you
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="Location (Address, City, or Zip)"
          variant="filled"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          placeholder="e.g., New York, NY or 10001"
          onKeyPress={handleKeyPress}
          sx={{
            flex: "1 1 250px",
            bgcolor: "rgba(255,255,255,0.9)",
            borderRadius: 1
          }}
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
        />

        <TextField
          select
          label="Radius"
          variant="filled"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          sx={{
            flex: "0 0 120px",
            bgcolor: "rgba(255,255,255,0.9)",
            borderRadius: 1
          }}
          InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          SelectProps={{ native: true }}
        >
          {RADIUS_OPTIONS.map(val => (
            <option key={val} value={val}>{val} Mile{val > 1 ? 's' : ''}</option>
          ))}
        </TextField>

        <Button
          variant="contained"
          size="large"
          onClick={onSearch}
          disabled={loading}
          sx={{
            bgcolor: theme.palette.secondary.main,
            color: "#FFFFFF",
            "&:hover": { bgcolor: theme.palette.secondary.dark },
            fontWeight: "bold",
            px: 4
          }}
        >
          {loading ? <CircularProgress size={24} /> : "Search"}
        </Button>

        {showResults && (
          <Button
            variant="outlined"
            onClick={onClear}
            sx={{
              borderColor: "white",
              color: "white",
              "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" }
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {showResults && (
        <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip
            icon={<span style={{ fontSize: "20px" }}>🟢</span>}
            label="Hidden Gem"
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#FFFFFF", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.3)" }}
          />
          <Chip
            icon={<span style={{ fontSize: "20px" }}>🔴</span>}
            label="Overrated"
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#FFFFFF", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.3)" }}
          />
          <Chip
            icon={<span style={{ fontSize: "20px" }}>🟡</span>}
            label="Typical"
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#FFFFFF", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.3)" }}
          />
        </Box>
      )}
    </Paper>
  );
}
