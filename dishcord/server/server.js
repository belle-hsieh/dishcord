const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
}));

// User Profile Routes
app.post('/users', routes.create_user);
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

// Michelin/Yelp Routes
app.get('/michelin-yelp-matches', routes.michelin_yelp_matches);
app.get('/top-restaurants/:city', routes.top_restaurants_by_city);
app.get('/nearby-restaurants', routes.nearby_restaurants);
app.get('/michelin-vs-yelp-stats', routes.michelin_vs_yelp_stats);
app.get('/restaurants-by-zip', routes.restaurants_by_zip);
app.get('/michelin-yelp-rating-comparison', routes.michelin_yelp_rating_comparison);
app.get('/hidden-gems/:city', routes.hidden_gems);
app.get('/restaurant-ratings-over-time/:city', routes.restaurant_ratings_over_time);
app.get('/cuisine-ratings/:city', routes.cuisine_ratings);
app.get('/photos/:business_id', routes.list_business_photos);
app.get("/fetch-image", routes.fetch_image);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
