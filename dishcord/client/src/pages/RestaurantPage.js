import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Grid,
  Pagination,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import RestaurantCard from "../components/RestaurantCard";
import RestaurantDetailDialog from "../components/RestaurantDetailDialog";
import config from "../config.json";

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();

  const [searchName, setSearchName] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const searchPageSize = 20;
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [lastSearchType, setLastSearchType] = useState(null); // "name" | "zip"
  const [lastSearchValue, setLastSearchValue] = useState("");
  const [michelinList, setMichelinList] = useState([]);
  const [michelinPage, setMichelinPage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
    const user = localStorage.getItem("user");
    const id = localStorage.getItem("userId");
    setIsLoggedIn(!!user);
    setUserId(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserId(null);
    navigate("/");
  };

  const fetchMichelin = useCallback(async () => {
    try {
      const res = await axios.get(`${apiBase}/michelin-yelp-matches`);
      setMichelinList(res.data || []);
    } catch (err) {
      console.error("Error fetching michelin data:", err);
      setMichelinList([]);
    }
  }, [apiBase]);

  useEffect(() => {
    if (!id) {
      fetchMichelin();
    }
  }, [id, fetchMichelin]);

  const fetchRestaurantById = useCallback(async (businessId) => {
    try {
      const res = await axios.get(`${apiBase}/restaurant/${businessId}`);
      const restaurant = res.data;
      // Map stars to yelp_stars for compatibility with RestaurantDetailDialog
      if (restaurant.stars && !restaurant.yelp_stars) {
        restaurant.yelp_stars = restaurant.stars;
      }
      return restaurant;
    } catch (err) {
      console.error("Failed to fetch restaurant", err);
      return null;
    }
  }, [apiBase]);

  const handleRestaurantClick = async (businessId) => {
    if (!businessId) return;
    
    const restaurant = await fetchRestaurantById(businessId);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRestaurant(null);
  };

  const handleViewFullPage = () => {
    if (selectedRestaurant?.business_id) {
      setIsDialogOpen(false);
      navigate(`/restaurant/${selectedRestaurant.business_id}`);
    }
  };

  useEffect(() => {
    // reset page when list changes
    setMichelinPage(0);
  }, [michelinList]);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, searchResults, michelinList]);

  const runSearch = useCallback(async (pageToFetch = 1, type, value) => {
    if (!type || !value) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      let url = "";
      if (type === "name") {
        url = `${apiBase}/search-restaurants?name=${encodeURIComponent(value)}&page=${pageToFetch}&page_size=${searchPageSize}`;
      } else if (type === "zip") {
        url = `${apiBase}/restaurants-by-zip?zip_code=${encodeURIComponent(value)}&page=${pageToFetch}&page_size=${searchPageSize}`;
      }

      const res = await axios.get(url);
      const rows = res.data || [];
      setSearchResults(rows);
      const total = rows.length > 0 && rows[0].total_count ? Number(rows[0].total_count) : 0;
      setSearchTotal(total);
      setSearchPage(pageToFetch);
      setLastSearchType(type);
      setLastSearchValue(value);
    } catch (err) {
      console.error("Error searching restaurants:", err);
      setSearchResults([]);
      setSearchTotal(0);
      setSearchError("Failed to load restaurants. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }, [apiBase]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const name = searchName.trim();
    const zip = searchZip.trim();
    const type = name ? "name" : zip ? "zip" : null;
    const value = name || zip;
    if (!type) return;
    setSearchPage(1);
    runSearch(1, type, value);
  };

  const handleSearchPageChange = (_event, pageValue) => {
    if (!lastSearchType || !lastSearchValue) return;
    runSearch(pageValue, lastSearchType, lastSearchValue);
  };

  const renderNav = () => (
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
  );

  // If there's an ID, show the full restaurant detail page
  if (id) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        {renderNav()}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <RestaurantCard businessId={id} />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {renderNav()}

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper id="search-restaurants" elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Search Restaurants
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Search by name or by ZIP code (20 results per page).
          </Typography>

          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}
          >
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Restaurant name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="ZIP code"
              value={searchZip}
              onChange={(e) => setSearchZip(e.target.value)}
            />
            <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
              Search
            </Button>
          </Box>

          {searchLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {searchError && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {searchError}
            </Typography>
          )}

          {!searchLoading && searchResults.length === 0 && !searchError && (
            <Typography variant="body2" color="text.secondary">
              No results yet. Try searching by restaurant name or ZIP code.
            </Typography>
          )}

          {searchResults.length > 0 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {searchResults.map((r) => (
                  <Grid item xs={12} sm={6} md={4} key={r.business_id || r.name}>
                    <RestaurantCard businessId={r.business_id} />
                  </Grid>
                ))}
              </Grid>
              {searchTotal > searchPageSize && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Pagination
                    count={Math.ceil(searchTotal / searchPageSize)}
                    page={searchPage}
                    onChange={handleSearchPageChange}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          )}
        </Paper>

        <Paper id="michelin" elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Michelin & Yelp Matches
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Discover restaurants that appear in both Yelp and the Michelin Guide
          </Typography>

          {michelinList.length > 0 ? (
            <List>
              {michelinList
                .slice(michelinPage * 7, michelinPage * 7 + 7)
                .map((r, idx) => (
                  <ListItemButton
                    key={`${michelinPage}-${idx}`}
                    onClick={() => handleRestaurantClick(r.business_id)}
                    disabled={!r.business_id}
                  >
                    <ListItemText
                      primary={r.yelp_name || r.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {r.yelp_address || r.address}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <StarIcon sx={{ color: "#ffc107", fontSize: 16 }} />
                            <Typography variant="body2" color="text.secondary">
                              {r.stars ? Number(r.stars).toFixed(1) : "N/A"} • Michelin{" "}
                              {r.award || "selected"}
                            </Typography>
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No Michelin restaurants found yet.
            </Typography>
          )}
          {michelinList.length > 7 && (
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center" justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                disabled={michelinPage === 0}
                onClick={() => setMichelinPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                Page {michelinPage + 1} / {Math.ceil(michelinList.length / 7)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={(michelinPage + 1) * 7 >= michelinList.length}
                onClick={() =>
                  setMichelinPage((p) =>
                    (p + 1) * 7 >= michelinList.length ? p : p + 1
                  )
                }
              >
                Next
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>

      <RestaurantDetailDialog
        open={isDialogOpen}
        restaurant={selectedRestaurant}
        onClose={handleCloseDialog}
        onViewRestaurant={handleViewFullPage}
      />
    </Box>
  );
}
