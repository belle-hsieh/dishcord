import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  Paper,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import config from "../config.json";
import CityCard from "../components/CityCard";

export default function ExploreCitiesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const apiBase = `http://${config.server_host}:${config.server_port}`;
  const citiesPerPage = 20;

  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/all-cities`);
      const cityList = response.data || [];
      const sortedCities = cityList
        .filter((c) => c.city)
        .sort((a, b) => {
          const cityCompare = a.city.localeCompare(b.city);
          return cityCompare !== 0 ? cityCompare : (a.state || "").localeCompare(b.state || "");
        });
      setCities(sortedCities);
      setFilteredCities(sortedCities);
      setError(null);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Failed to load cities. Please try again later.");
      setCities([]);
      setFilteredCities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    const id = localStorage.getItem("userId");
    setIsLoggedIn(!!user);
    setUserId(id);
  }, []);

  useEffect(() => {
    fetchCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserId(null);
    navigate("/");
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = cities.filter(({ city, state }) => {
      const label = `${city || ""} ${state || ""}`.toLowerCase();
      return label.includes(value);
    });
    setFilteredCities(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilteredCities(cities);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    // Scroll to top of city grid
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredCities.length / citiesPerPage);
  const startIndex = (currentPage - 1) * citiesPerPage;
  const endIndex = startIndex + citiesPerPage;
  const paginatedCities = filteredCities.slice(startIndex, endIndex);

  if (error && !loading) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
          <Toolbar>
            <Box sx={{ mr: 2, display: "flex", alignItems: "center", width: 40, height: 40 }}>
              <img src="/logo.png" alt="Dishcord" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#FFFFFF" }}>
              Dishcord
            </Typography>
            <Button color="inherit" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button color="inherit" onClick={() => navigate("/explore-cities")}>
              Cities
            </Button>
            <Button color="inherit" onClick={() => navigate("/restaurant")}>
              Restaurants
            </Button>
            <Button color="inherit" onClick={() => navigate("/map")}>
              Map
            </Button>
            <Button color="inherit" onClick={() => navigate(userId ? `/user/${userId}` : "/login")}>
              Profile
            </Button>
            {isLoggedIn ? (
              <Button color="inherit" onClick={handleLogout}>
                Log out
              </Button>
            ) : (
              <Button color="inherit" onClick={() => navigate("/login")}>
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={fetchCities}
          >
            Try Again
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar>
          <Box sx={{ mr: 2, display: "flex", alignItems: "center", width: 40, height: 40 }}>
            <img src="/logo.png" alt="Dishcord" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#FFFFFF" }}>
            Dishcord
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/explore-cities")}>
            Cities
          </Button>
          <Button color="inherit" onClick={() => navigate("/restaurant")}>
            Restaurants
          </Button>
          <Button color="inherit" onClick={() => navigate("/map")}>
            Map
          </Button>
          <Button color="inherit" onClick={() => navigate("/leaderboard")}>
            Leaderboard
          </Button>
          <Button color="inherit" onClick={() => navigate(userId ? `/user/${userId}` : "/login")}>
            Profile
          </Button>
          {isLoggedIn ? (
            <Button color="inherit" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Explore Cities
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover restaurants and statistics for cities around the world
          </Typography>
        </Box>

        {/* Search Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: "white" }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Search Cities
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Enter a city name..."
              value={searchTerm}
              onChange={handleSearch}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{ whiteSpace: "nowrap" }}
            >
              Reset
            </Button>
          </Stack>
        </Paper>

        {/* Cities Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredCities.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {paginatedCities.map((cityObj, idx) => (
                <Grid item xs={12} sm={6} md={4} key={`${cityObj.city}-${cityObj.state}-${idx}`}>
                  <CityCard
                    city={cityObj}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Pagination Controls */}
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 6, mb: 2 }}>
              <Stack spacing={2} sx={{ alignItems: "center" }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
                <Typography variant="body2" color="text.secondary">
                  Page {currentPage} of {totalPages} • Showing {Math.min(citiesPerPage, filteredCities.length - startIndex)} of {filteredCities.length} cities
                </Typography>
              </Stack>
            </Box>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#f5f5f5" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No cities found matching "{searchTerm}"
            </Typography>
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ mt: 2 }}
            >
              Clear Search
            </Button>
          </Paper>
        )}

        {/* Results Summary */}
        {!loading && filteredCities.length > 0 && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Total: {filteredCities.length} of {cities.length} cities
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
