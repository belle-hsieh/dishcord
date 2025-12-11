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
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ImageIcon from "@mui/icons-material/Image";
import config from "../config.json";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [adventurousUser, setAdventurousUser] = useState(null);
  const [topInfluencers, setTopInfluencers] = useState([]);
  const [michelinStats, setMichelinStats] = useState(null);
  const [loadingAward, setLoadingAward] = useState(true);
  const [loadingInfluencers, setLoadingInfluencers] = useState(true);
  const [loadingMichelin, setLoadingMichelin] = useState(true);

  const apiBase = `http://${config.server_host}:${config.server_port}`;

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    const id = localStorage.getItem("userId");
    setIsLoggedIn(!!user);
    setUserId(id);
  }, []);

  useEffect(() => {
    // Fetch most adventurous user
    const fetchAdventurousUser = async () => {
      try {
        const res = await axios.get(`${apiBase}/most-adventurous-user`);
        setAdventurousUser(res.data);
      } catch (err) {
        console.error("Error fetching adventurous user:", err);
      } finally {
        setLoadingAward(false);
      }
    };

    // Fetch top influencers
    const fetchTopInfluencers = async () => {
      try {
        const res = await axios.get(`${apiBase}/top-influencers?limit=10`);
        setTopInfluencers(res.data);
      } catch (err) {
        console.error("Error fetching top influencers:", err);
      } finally {
        setLoadingInfluencers(false);
      }
    };

    // Fetch Michelin engagement stats
    const fetchMichelinStats = async () => {
      try {
        const res = await axios.get(`${apiBase}/michelin-engagement-stats`);
        setMichelinStats(res.data);
      } catch (err) {
        console.error("Error fetching Michelin stats:", err);
      } finally {
        setLoadingMichelin(false);
      }
    };

    fetchAdventurousUser();
    fetchTopInfluencers();
    fetchMichelinStats();
  }, [apiBase]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserId(null);
    navigate("/");
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ mr: 2, display: "flex", alignItems: "center", width: 40, height: 40 }}>
            <img src="/logo.png" alt="Dishcord" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: "#FFFFFF" }}>
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

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        {/* Page Title */}
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 700, mb: 2, fontSize: "3.5rem" }}>
            Leaderboard
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500 }}>
            Celebrating the most adventurous and influential restaurant reviewers
          </Typography>
        </Box>

        {/* Awards and Leaderboards Section */}
        <Grid container spacing={4}>
          {/* Most Adventurous User and Michelin Stats Row */}
          {/* Most Adventurous User */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: "100%",
                borderRadius: 2,
                border: `3px solid ${theme.palette.warning.main}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <EmojiEventsIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mr: 2 }} />
                <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                  Most Adventurous User
                </Typography>
              </Box>
              {loadingAward ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : adventurousUser && adventurousUser.user_name ? (
                <Box>
                  <Card
                    sx={{
                      backgroundColor: theme.palette.warning.light,
                      border: `2px solid ${theme.palette.warning.main}`,
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.warning.main,
                            width: 80,
                            height: 80,
                            mr: 3,
                          }}
                        >
                          <RestaurantIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            {adventurousUser.user_name}
                          </Typography>
                          <Chip
                            label={`${adventurousUser.num_cuisines} Cuisines Explored`}
                            size="medium"
                            sx={{
                              backgroundColor: theme.palette.warning.main,
                              color: "#FFFFFF",
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              padding: "20px 12px",
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        This exceptional user has explored the most diverse range of cuisines, reviewing{" "}
                        <strong>{adventurousUser.num_cuisines}</strong> different types of restaurants across Yelp!
                        Their adventurous palate and willingness to try new culinary experiences make them a true
                        food explorer.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Michelin Engagement Stats */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: "100%",
                borderRadius: 2,
                border: `3px solid ${theme.palette.secondary.main}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <ImageIcon sx={{ fontSize: 48, color: theme.palette.secondary.main, mr: 2 }} />
                <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                  Michelin Engagement
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                Compares photo-to-review ratios between Michelin and non-Michelin restaurants.
              </Typography>
              {loadingMichelin ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : michelinStats && michelinStats.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {michelinStats.map((stat, index) => (
                    <Card
                      key={index}
                      sx={{
                        backgroundColor:
                          stat.michelin_status === "Michelin"
                            ? theme.palette.secondary.light
                            : theme.palette.grey[100],
                        border:
                          stat.michelin_status === "Michelin"
                            ? `2px solid ${theme.palette.secondary.main}`
                            : `1px solid ${theme.palette.grey[300]}`,
                      }}
                    >
                      <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                          {stat.michelin_status}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Avg Photos per Review:</strong>{" "}
                            {stat.avg_photos_per_review 
                              ? Number(stat.avg_photos_per_review).toFixed(2) 
                              : "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Restaurants:</strong> {stat.restaurant_count}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block", fontStyle: "italic" }}>
                Higher photo-to-review ratios indicate more visual engagement from users.
              </Typography>
            </Paper>
          </Grid>

          {/* Top Influencers - Full Width */}
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 2,
                border: `3px solid ${theme.palette.info.main}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: theme.palette.info.main, mr: 2 }} />
                <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                  Top Influencers
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic", ml: 0.5 }}>
                Influence scores are calculated based on review volume, engagement (useful/funny/cool reactions), and the popularity of restaurants reviewed.
              </Typography>
              {loadingInfluencers ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : topInfluencers.length > 0 ? (
                <List sx={{ pt: 0 }}>
                  {topInfluencers.map((influencer, index) => (
                    <ListItem
                      key={influencer.user_id || index}
                      sx={{
                        backgroundColor:
                          index === 0
                            ? theme.palette.info.light
                            : index === 1
                            ? theme.palette.grey[100]
                            : "transparent",
                        borderRadius: 1,
                        mb: 1.5,
                        py: 2,
                        border:
                          index === 0
                            ? `2px solid ${theme.palette.info.main}`
                            : index === 1
                            ? `1px solid ${theme.palette.grey[300]}`
                            : "1px solid transparent",
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              index === 0
                                ? theme.palette.info.main
                                : index === 1
                                ? theme.palette.grey[500]
                                : theme.palette.grey[400],
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            width: 56,
                            height: 56,
                          }}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {influencer.user_name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Influence Score: <strong>{influencer.influence_score?.toFixed(2) || "N/A"}</strong>
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
