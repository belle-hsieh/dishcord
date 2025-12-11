const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: '*',
}));

// User Profile Routes
app.get('/users/:id', routes.get_user);
app.put('/users/:id/name', routes.update_user_name);
app.put('/users/:id/email', routes.update_user_email);
app.put('/users/:id/home_city', routes.update_user_home_city);
app.put('/users/:id/home_state', routes.update_user_home_state);
app.post('/users/:id/favorites', routes.add_favorite);
app.delete('/users/:id/favorites/:business_id', routes.remove_favorite);
app.get('/users/:id/favorites', routes.list_favorites);
app.post('/users/:id/visited', routes.add_visited);
app.delete('/users/:id/visited/:business_id', routes.remove_visited);
app.get('/users/:id/visited', routes.list_visited);

// Auth Routes
app.post('/auth/signup', routes.create_user_auth);
app.post('/auth/login', routes.login_local);
app.post('/auth/google', routes.login_google);
app.get('/auth/github/start', routes.github_start);
app.get('/auth/github/callback', routes.github_callback);

// Leaderboard Routes
app.get('/michelin-engagement-stats', routes.michelin_engagement_stats);
app.get('/most-adventurous-user', routes.most_adventurous_user);
app.get('/top-influencers', routes.top_influencers);

// City Insights
app.get('/city-stats/:city/:state?', routes.city_stats);
app.get('/city-top-restaurants/:city/:state?', routes.city_top_restaurants);
app.get('/hidden-gems/:city', routes.hidden_gems);

// Search/Browse
app.get('/search-restaurants', routes.search_restaurants_by_name);
app.get('/restaurants-by-zip', routes.restaurants_by_zip);

// Restaurants & Maps
app.get('/restaurant/:business_id', routes.get_restaurant);
app.get('/map-restaurants', routes.map_restaurants);
app.get('/michelin-yelp-matches', routes.michelin_yelp_matches);

// Media
app.get('/photos/:business_id', routes.list_business_photos);
app.get('/fetch-image', routes.fetch_image);
app.get('/all-cities', routes.all_cities);
app.get('/city-photo/:city', routes.city_photo);

// Removed unused/legacy routes

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
