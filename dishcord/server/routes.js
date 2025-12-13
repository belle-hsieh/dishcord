// This is the Dishcord routes file

const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));




/************************
 * LEADERBOARD ROUTES   *
 ************************/

// Route: GET /michelin-engagement-stats
// Description: Compare customer engagement (photos/reviews ratio) between Michelin and non-Michelin restaurants
// Where it's used: the LeaderBoard Page, specifically the Michelin Engagement section
// pretty simple query, just using the materialized view we made
const michelin_engagement_stats = async function(req, res) {
  connection.query(
    `
    SELECT
      CASE WHEN is_michelin THEN 'Michelin' ELSE 'Non-Michelin' END AS michelin_status,
      AVG(
        CASE WHEN num_reviews > 0 THEN num_photos::decimal / num_reviews ELSE 0 END
      ) AS avg_photos_per_review,
      COUNT(*) AS restaurant_count
    FROM mv_restaurant_photo_stats
    GROUP BY is_michelin
    `,
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

// Route: GET /city-stats/:city/:state?
// Description: Get statistics for a city, bridging Yelp and Michelin via Coordinates
// WHere it's used: The city insights page, specifically the city stats section
// this one's kinda complex - had to figure out how to match michelin and yelp data by coordinates
const city_stats = async function(req, res) {
  const city = req.params.city;
  const state = req.params.state; // Optional (might be null for Int'l cities)

  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }

  connection.query(

    `
    -- first grab all restaurants in the city
    WITH city_restaurants AS (
      SELECT
        r.business_id,
        r.name,
        r.stars,
        r.review_count,
        l.latitude,
        l.longitude
      FROM yelprestaurantinfo r
      LEFT JOIN yelplocationinfo l 
        ON r.address = l.address 
        AND r.city = l.city 
        AND r.state = l.state
        AND r.postal_code = l.postal_code
      WHERE LOWER(TRIM(r.city)) = LOWER(TRIM($1))
          AND ($2::VARCHAR IS NULL OR LOWER(TRIM(r.state)) = LOWER(TRIM($2)))
    ),
    -- then try to match them with michelin data using lat/long
    -- using 0.0005 threshold seems to work well
    michelin_matches AS (
      SELECT DISTINCT
        cr.business_id,
        mri.award
      FROM city_restaurants cr
      JOIN michelinrestaurantinfo mri 
        ON LOWER(TRIM(cr.name)) = LOWER(TRIM(mri.name))
      JOIN michelinlocationinfo mli 
        ON mri.address = mli.address
      WHERE 
        cr.latitude IS NOT NULL
        AND cr.longitude IS NOT NULL
        AND mli.latitude IS NOT NULL
        AND mli.longitude IS NOT NULL
        AND ABS(mli.latitude - cr.latitude) < 0.0005
        AND ABS(mli.longitude - cr.longitude) < 0.0005
    ),
    -- Gets the number of restaurants in the city that have each Michelin award (group by award)
    michelin_award_counts AS (
      SELECT
        award,
        COUNT(*) as count
      FROM michelin_matches
      GROUP BY award
    )
    -- Selects the average Yelp rating, total Yelp restaurants, total Michelin restaurants,
    -- and the breakdown of Michelin awards.
    SELECT
      COALESCE(AVG(cr.stars), 0) AS avg_yelp_rating,
      COUNT(cr.business_id) AS total_yelp_restaurants,
      COALESCE((SELECT COUNT(DISTINCT business_id) FROM michelin_matches), 0) AS total_michelin_restaurants,
      COALESCE(
        (SELECT json_object_agg(award, count) FROM michelin_award_counts),
        '{}'::json
      ) AS michelin_breakdown
    FROM city_restaurants cr
    `,
    [city, state || null],
    (err, data) => {
      if (err) {
        console.error("City Stats Error:", err);
        res.status(500).json({});
      } else {
        const result = data.rows[0];
        // Handle case where city exists in DB but has no restaurants (returns 0s)
        if (!result || result.total_yelp_restaurants === 0) {
          return res.status(404).json({ 
            error: 'City not found or has no restaurants',
            avg_yelp_rating: 0, 
            total_yelp_restaurants: 0, 
             total_michelin_restaurants: 0, 
             michelin_breakdown: {} 
           });
        } else {
           res.json(result);
        }
      }
    }
  );
};

// Route: GET /city-top-restaurants/:city/:state?
// Description: Get top restaurants in a city with optional filtering by rating and review count
// Where it's used: The city insights page, specifically the top restaurants section
const city_top_restaurants = async function(req, res) {
  const city = req.params.city;
  const state = req.params.state;
  const minRating = parseFloat(req.query.min_rating) || 0;
  const minReviewCount = parseInt(req.query.min_review_count) || 0;
  const limit = parseInt(req.query.limit) || 20;
  
  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }
  
  connection.query(
    `
    -- Selects the top restaurants in the city (and optionally state) from Yelp data joined 
    -- with Michelin Data, filtered by rating and review count, and ordered by rating and review count.
    SELECT
      r.business_id,
      r.name,
      r.address,
      r.city,
      r.state,
      r.stars,
      r.review_count,
      mri.award
    FROM yelprestaurantinfo r
    LEFT JOIN michelinrestaurantinfo mri
      ON LOWER(r.name) = LOWER(mri.name)
    WHERE r.city = $1
      AND ($2::VARCHAR IS NULL OR r.state = $2)
      AND r.stars >= $3
      AND r.review_count >= $4
    ORDER BY r.stars DESC, r.review_count DESC
    LIMIT $5
    `,
    [city, state || null, minRating, minReviewCount, limit],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

// Route: GET /hidden-gems/:city
// Description: Find underrated restaurants (high rating, low review count) vs peers in a city
/* Where it's used: The city insights page, specifically the hidden gems section
also in the restaurants lists, and map page. */

// this query is cool cuz it labels restaurants as hidden gems, overhyped, or typical
// based on how they compare to the city average
const hidden_gems = async function(req, res) {
  const city = req.params.city;
  const state = req.query.state;
  const category = req.query.category || req.body.category;
  const minRating = parseFloat(req.query.min_rating) || 0;
  const maxReviewCount = parseInt(req.query.max_review_count) || 999999;
  
  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }
  
  connection.query(
    `
    -- Filters yelp restaurants by city, optional state, yelp starr, and review count, and optional category
    WITH group_restaurants AS (
      SELECT
        r.business_id,
        r.name,
        r.city,
        r.stars AS yelp_stars,
        r.review_count
      FROM yelprestaurantinfo r
      WHERE r.city = $1
        AND ($2::VARCHAR IS NULL OR r.state = $2)
        AND r.stars >= $3
        AND r.review_count <= $4
        AND (
          $5::VARCHAR IS NULL
          OR EXISTS (
            SELECT 1
            FROM yelprestaurantcategories c2
            WHERE c2.business_id = r.business_id
              AND LOWER(c2.category) LIKE '%' || LOWER($5::VARCHAR) || '%'
          )
        )
    ),
    -- computes the averadge rating and reviews from the group_restaurants CTE
    peer_stats AS (
        SELECT
            AVG(yelp_stars) AS avg_rating,
            AVG(review_count) AS avg_reviews
        FROM group_restaurants
    )
    -- Selects the restaurants that are hidden gems, overhyped, or typical based on the average rating and review count
    -- and the label is determined by the comparison of the yelp stars and the average rating and review count.
    -- The label is used to color the restaurant on the map and list page.
    SELECT
        g.business_id,
        g.name,
        g.yelp_stars,
        g.review_count,
        ps.avg_rating,
        ps.avg_reviews,
        CASE
            WHEN g.yelp_stars > ps.avg_rating
             AND g.review_count < ps.avg_reviews
                THEN 'hidden_gem'
            WHEN g.yelp_stars < ps.avg_rating
             AND g.review_count > ps.avg_reviews
                THEN 'overhyped'
            ELSE 'typical'
        END AS label
    FROM group_restaurants g
    CROSS JOIN peer_stats ps
    ORDER BY label DESC, g.yelp_stars DESC
    `,
    [city, state || null, minRating, maxReviewCount, category],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

// Route: GET /most-adventurous-user
// Description: Find the user who has reviewed the highest number of distinct cuisines
// leaderboard page - another materialized view
const most_adventurous_user = async function(req, res) {
  connection.query(
    `SELECT * FROM mv_most_adventurous_user`,
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({});
      } else {
        res.json(data.rows[0] || {});
      }
    }
  );
};

// Route: GET /top-influencers
// Description: Find the most influential users based on reviews, reactions, and restaurant popularity
const top_influencers = async function(req, res) {
  const limit = req.query.limit || 20;

  connection.query(
    `
    SELECT
      user_id,
      user_name,
      influence_score
    FROM mv_user_influence_scores
    ORDER BY influence_score DESC
    LIMIT $1
    `,
    [limit],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};



/***********************
 * USER PROFILE ROUTES *
 ***********************/
// all the user stuff - pretty straightforward CRUD operations mostly

// Route: GET /users/:id
// Description: Retrieves all information about a user by their user_id
const get_user = async function(req, res) {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: id' });
    }

    connection.query(
        `
        SELECT user_id, name, email, city, state, time_created
        FROM users
        WHERE user_id = $1
        `,
        [userId],
        (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({});
        } else {
            res.json(data.rows[0] || {});
        }
        }
    );
};

// Route: PUT /users/:id/name
// Description: Updates user's name
const update_user_name = async function(req, res) {
    const userId = req.params.id;
    const { name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'Missing required parameters: id, name' });
    }

    connection.query(
      `
      UPDATE users
      SET name = $1
      WHERE user_id = $2
      `,
      [name, userId],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json({
            user_id: userId,
            updated_field: "name",
            status: "success"
          });
        }
      }
    );
};

// Route: PUT /users/:id/email
// Description: Updates user's email
const update_user_email = async function(req, res) {
    const userId = req.params.id;
    const { email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required parameters: id, email' });
    }

    connection.query(
      `
      UPDATE users
      SET email = $1
      WHERE user_id = $2
      `,
      [email, userId],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json({
            user_id: userId,
            updated_field: "email",
            status: "success"
          });
        }
      }
    );
};

// Route: PUT /users/:id/home_city
// Description: Updates user's city
const update_user_home_city = async function(req, res) {
    const userId = req.params.id;
    const city = req.body.city;

    if (!userId || !city) {
      return res.status(400).json({ error: 'Missing required parameters: id, city' });
    }

    connection.query(
      `
      UPDATE users
      SET city = $1
      WHERE user_id = $2
      `,
      [city, userId],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json({
            user_id: userId,
            updated_field: "city",
            status: "success"
          });
        }
      }
    );
};

// Route: PUT /users/:id/home_city
// Description: Updates user's state
const update_user_home_state = async function(req, res) {
    const userId = req.params.id;
    const state = req.body.state;

    if (!userId || !state) {
      return res.status(400).json({ error: 'Missing required parameters: id, state' });
    }

    connection.query(
      `
      UPDATE users
      SET state = $1
      WHERE user_id = $2
      `,
      [state, userId],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json({
            user_id: userId,
            updated_field: "state",
            status: "success"
          });
        }
      }
    );
};

// Route: PUT /users/:id/favorites
// Description: Updates user's favorite restaurants
// ON CONFLICT DO NOTHING is nice here so no errors if someone tries to favorite twice
const add_favorite = async function(req, res) {
    const userId = req.params.id;
    const businessId = req.body.business_id;

    if (!userId || !businessId) {
      return res.status(400).json({ error: 'Missing required parameters: id, business_id' });
    }

    connection.query(
      `
      INSERT INTO favorites (user_id, business_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [userId, businessId],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json({
            user_id: userId,
            business_id: businessId,
            status: "added",
          });
        }
      }
    );
  };

// Route: DELETE /users/:id/favorites
// Description: Deletes one of user's favorite restaurants
  const remove_favorite = async function(req, res) {
    const { id, business_id } = req.params;
  
    connection.query(
      `
      DELETE FROM favorites
      WHERE user_id = $1 AND business_id = $2
      `,
      [id, business_id],
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json({
            user_id: id,
            business_id: business_id,
            status: "removed",
          });
        }
      }
    );
  };

// Route: GET /users/:id/favorites
// Description: Lists all of a user's favorites and includes the user's own rating if visited
const list_favorites = async function(req, res) {
    connection.query(
      `
      SELECT 
        r.*,
        v.stars AS user_stars
      FROM favorites f
      JOIN yelprestaurantinfo r
        ON r.business_id = f.business_id
      LEFT JOIN visited v
        ON v.user_id = f.user_id AND v.business_id = f.business_id
      WHERE f.user_id = $1
      ORDER BY r.stars DESC
      `,
      [req.params.id],
      (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  };

// Route: PUT /users/:id/visited
// Description: Updates user's visited restaurants
const add_visited = async function(req, res) {
    const userId = req.params.id;
    const businessId = req.body.business_id;
    const { stars } = req.body;

    if (!userId || !businessId || stars === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: id, business_id, stars' });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }

    connection.query(
      `
      INSERT INTO visited (user_id, business_id, stars)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, business_id) DO UPDATE SET stars = EXCLUDED.stars
      `,
      [userId, businessId, stars],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json({
            user_id: userId,
            business_id: businessId,
            stars: stars,
            status: "added",
          });
        }
      }
    );
  };

// Route: DELETE /users/:id/visited
// Description: Deletes one of user's visited restaurants
const remove_visited = async function(req, res) {
    const { id, business_id } = req.params;
  
    connection.query(
      `
      DELETE FROM visited
      WHERE user_id = $1 AND business_id = $2
      `,
      [id, business_id],
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json({
            user_id: id,
            business_id: business_id,
            status: "removed",
          });
        }
      }
    );
  };

// Route: GET /users/:id/visited
// Description: Lists all of a user's visited restaurants ordered by their rating
const list_visited = async function(req, res) {
    connection.query(
      `
      SELECT 
        r.*,
        v.stars AS user_stars
      FROM visited v
      JOIN yelprestaurantinfo r
        ON r.business_id = v.business_id
      WHERE v.user_id = $1
      ORDER BY v.stars DESC
      `,
      [req.params.id],
      (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  };

/************************
 * MICHELIN/YELP ROUTES *
 ************************/

// Route: GET /michelin-yelp-matches
// Description: Get matched Michelin and Yelp restaurants with all Michelin details
// joins michelin and yelp by name + coordinate proximity
// one of our main challenges we had to figure out
const michelin_yelp_matches = async function(req, res) {
  connection.query(
    `
    SELECT
        yri.business_id,
        yri.name AS yelp_name,
        yri.address AS yelp_address,
        yri.city,
        yri.state,
        yri.stars,
        yri.review_count,
        mri.award,
        mri.price,
        mri.greenstar,
        mri.description AS michelinDescription
  FROM michelinrestaurantinfo mri
  JOIN michelinlocationinfo mli
        ON mri.address = mli.address
  JOIN yelprestaurantinfo yri
        ON yri.name = mri.name
  JOIN yelplocationinfo yli
        ON yri.address = yli.address
       AND yri.city = yli.city
       AND yri.state = yli.state
       AND yri.postal_code = yli.postal_code
    WHERE 
        ABS(mli.latitude  - yli.latitude)  < 0.0005
    AND ABS(mli.longitude - yli.longitude) < 0.0005
    ORDER BY yelp_name ASC
    `,
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};


// Route: GET /search-restaurants
// Description: Search restaurants by partial name with pagination
// used in the search bar on homepage
const search_restaurants_by_name = async function(req, res) {
  const name = req.query.name || req.body?.name;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.page_size, 10) || 7;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Missing required parameter: name" });
  }

  const offset = (page - 1) * pageSize;

  connection.query(
    `
    WITH filtered AS (
      SELECT
        r.business_id,
        r.name,
        r.address,
        r.city,
        r.state,
        r.stars,
        r.review_count
      FROM yelprestaurantinfo r
      WHERE LOWER(TRIM(r.name)) LIKE '%' || LOWER(TRIM($1)) || '%'
    ),
    counted AS (
      SELECT *, COUNT(*) OVER() AS total_count FROM filtered
    )
    SELECT
      business_id,
      name,
      address,
      city,
      state,
      stars,
      review_count,
      total_count
    FROM counted
    ORDER BY review_count DESC NULLS LAST
    LIMIT $2 OFFSET $3
    `,
    [name, pageSize, offset],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};



// Route: GET /restaurants-by-zip
// Description: Get restaurants in a ZIP code with optional category filter and pagination
const restaurants_by_zip = async function(req, res) {
  const zip_code = req.query.zip_code || req.body.zip_code;
  const category = req.query.category || req.body.category;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.page_size, 10) || 7;
  
  if (!zip_code) {
    return res.status(400).json({ error: 'Missing required parameter: zip_code' });
  }

  const offset = (page - 1) * pageSize;
  
  connection.query(
    `
    WITH filtered AS (
      SELECT DISTINCT
          r.business_id,
          r.name,
          r.address,
          r.city,
          r.state,
          r.stars,
          r.review_count,
          l.latitude,
          l.longitude
      FROM yelprestaurantinfo r
      JOIN yelplocationinfo l
          ON r.address = l.address
         AND r.city = l.city
         AND r.state = l.state
         AND r.postal_code = l.postal_code
      LEFT JOIN yelprestaurantcategories c
          ON r.business_id = c.business_id
      WHERE l.postal_code = $1
        AND (
              $2::text IS NULL
              OR EXISTS (
                  SELECT 1
                  FROM yelprestaurantcategories c2
                  WHERE c2.business_id = r.business_id
                    AND LOWER(c2.category) LIKE '%' || LOWER($2) || '%'
              )
            )
    ),
    counted AS (
      SELECT *, COUNT(*) OVER() AS total_count FROM filtered
    )
    SELECT
      business_id,
      name,
      address,
      city,
      state,
      stars,
      review_count,
      latitude,
      longitude,
      total_count
    FROM counted
    ORDER BY review_count DESC NULLS LAST
    LIMIT $3 OFFSET $4
    `,
    [zip_code, category, pageSize, offset],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};


// Route: GET /restaurant/:business_id
// Description: Get a single restaurant by business_id with all details including Michelin award, categories, and location
const get_restaurant = async function(req, res) {
  const businessId = req.params.business_id;

  if (!businessId) {
    return res.status(400).json({ error: "Missing required parameter: business_id" });
  }

  // Get restaurant info from Yelp data
  connection.query(
    `
    SELECT 
      r.*,
      l.latitude,
      l.longitude
    FROM yelprestaurantinfo r
    LEFT JOIN yelplocationinfo l
      ON r.address = l.address
      AND r.city = l.city
      AND r.state = l.state
      AND r.postal_code = l.postal_code
    WHERE r.business_id = $1
    `,
    [businessId],
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to fetch restaurant" });
      }
      
      if (data.rows.length === 0) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const restaurant = data.rows[0];

      // Get Michelin data if applicable (optional)
      connection.query(
        `
        SELECT DISTINCT 
          mri.award,
          mri.price,
          mri.greenstar,
          mri.description
        FROM michelinrestaurantinfo mri
        JOIN michelinlocationinfo mli ON mri.address = mli.address
        JOIN yelprestaurantinfo yri ON yri.name = mri.name
        JOIN yelplocationinfo yli
          ON yri.address = yli.address
          AND yri.city = yli.city
          AND yri.state = yli.state
          AND yri.postal_code = yli.postal_code
        WHERE yri.business_id = $1
          AND ABS(mli.latitude - yli.latitude) < 0.0005
          AND ABS(mli.longitude - yli.longitude) < 0.0005
        LIMIT 1
        `,
        [businessId],
        (err, michelinData) => {
          if (!err && michelinData.rows.length > 0) {
            const michelin = michelinData.rows[0];
            restaurant.michelin = {
              award: michelin.award,
              price: michelin.price,
              greenStar: michelin.greenstar,
              description: michelin.description
            };
          }

          // Get categories
          connection.query(
            `
            SELECT DISTINCT TRIM(category) AS category
            FROM yelprestaurantcategories
            WHERE business_id = $1
            ORDER BY category
            `,
            [businessId],
            (err, catData) => {
              if (err) {
                console.log(err);
                restaurant.categories = [];
              } else {
                restaurant.categories = catData.rows.map(row => row.category);
              }

              // Get reviews (top 10 by usefulness)
              connection.query(
                `
                SELECT DISTINCT ON (review_id)
                  review_id,
                  stars,
                  text,
                  date,
                  useful
                FROM yelpreviewinfo
                WHERE business_id = $1
                ORDER BY review_id, useful DESC
                LIMIT 10
                `,
                [businessId],
                (err, reviewData) => {
                  if (err) {
                    console.log(err);
                    restaurant.reviews = [];
                  } else {
                    restaurant.reviews = reviewData.rows.map(row => ({
                      review_id: row.review_id,
                      stars: row.stars,
                      text: row.text,
                      date: row.date
                    }));
                  }

                  res.json(restaurant);
                }
              );
            }
          );
        }
      );
    }
  );
};

// MAP ROUTE


// Route: GET /map-restaurants
// Description: Get restaurants for map within certain radius of addy w/ rating status, photos, reviews, and categories
// this is probably the most complex query in the whole app lol
// returns everything the map needs like restaurants, photos, reviews, categories, michelin data
// had to optimize this a bunch bc it was slow at first
// used indices and getting rid of unecessary distincts because we realized pkey handles distinct alr
const map_restaurants = async function(req, res) {
  const start = Date.now();
  const user_lat = parseFloat(req.query.latitude);
  const user_long = parseFloat(req.query.longitude);
  const radius = parseFloat(req.query.radius) || 5; // Default 5 miles
  
  // Fail if invalid loc
  if (isNaN(user_lat) || isNaN(user_long)) {
    return res.status(400).json({ error: 'Missing or invalid latitude/longitude' });
  }

  // Pre-compute bounding box
  // 69 miles per degree of latitude, adjust longitude for earth's curvature
  const lat_min = user_lat - (radius / 69.0);
  const lat_max = user_lat + (radius / 69.0);
  const long_min = user_long - (radius / (69.0 * Math.cos(user_lat * Math.PI / 180)));
  const long_max = user_long + (radius / (69.0 * Math.cos(user_lat * Math.PI / 180)));

  console.log('Pre-query:', Date.now() - start, 'ms');
  
  connection.query(`
    WITH restaurant_base AS (
      SELECT
        r.business_id,
        r.name,
        r.address,
        r.city,
        r.state,
        r.stars AS yelp_stars,
        r.review_count,
        l.latitude,
        l.longitude,
        r.postal_code,
        (3959 * acos(
          cos(radians($1)) * cos(radians(l.latitude)) *
          cos(radians(l.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(l.latitude))
        )) AS distance
      FROM yelprestaurantinfo r
      JOIN yelplocationinfo l
        ON r.address = l.address
        AND r.city = l.city
        AND r.state = l.state
        AND r.postal_code = l.postal_code
      WHERE
        l.latitude BETWEEN $4 AND $5
        AND l.longitude BETWEEN $6 AND $7
    ),
    filtered_restaurants AS (
      SELECT * FROM restaurant_base
      WHERE distance <= $3
      LIMIT 30
    ),
    city_stats AS (
      SELECT
        city,
        AVG(stars) AS avg_rating,
        AVG(review_count) AS avg_reviews
      FROM yelprestaurantinfo
      WHERE city IN (SELECT DISTINCT city FROM filtered_restaurants)
      GROUP BY city
    ),
    restaurants_with_status AS (
      SELECT
        fr.*,
        CASE
          WHEN fr.yelp_stars > cs.avg_rating AND fr.review_count < cs.avg_reviews THEN 'Hidden Gem'
          WHEN fr.yelp_stars < cs.avg_rating AND fr.review_count > cs.avg_reviews THEN 'Overrated'
          ELSE 'Typical'
        END AS dishcord_status
      FROM filtered_restaurants fr
      JOIN city_stats cs ON fr.city = cs.city
    ),
    categories AS (
      SELECT
        business_id,
        array_agg(DISTINCT category) AS categories
      FROM yelprestaurantcategories
      WHERE business_id IN (SELECT business_id FROM restaurants_with_status)
      GROUP BY business_id
    ),
    restaurant_photos AS (
      SELECT
        yp.business_id,
        json_agg(
          json_build_object(
            'photo_id', yp.photo_id,
            'caption', yp.caption,
            'label', yp.label,
            'aws_url', yp.aws_url
          )
        ) AS photos
      FROM (
        SELECT * FROM yelpphotos
        WHERE business_id IN (SELECT business_id FROM restaurants_with_status)
      ) yp
      WHERE yp.aws_url IS NOT NULL
      GROUP BY yp.business_id
    ),
    restaurant_reviews AS (
      SELECT
        r.business_id,
        json_agg(
          json_build_object(
            'review_id', r.review_id,
            'stars', r.stars,
            'text', r.text,
            'date', r.date
          ) ORDER BY r.useful DESC
        ) AS reviews
      FROM (
        SELECT * FROM yelpreviewinfo
        WHERE business_id IN (SELECT business_id FROM restaurants_with_status)
      ) r
      GROUP BY r.business_id
    ),
    michelin_data AS (
      SELECT
        yri.business_id,
        json_build_object(
          'award', mri.award,
          'price', mri.price,
          'greenStar', mri.greenstar,
          'description', mri.description
        ) AS michelin
      FROM michelinrestaurantinfo mri
      JOIN michelinlocationinfo mli ON mri.address = mli.address
      JOIN yelprestaurantinfo yri ON LOWER(TRIM(yri.name)) = LOWER(TRIM(mri.name))
      JOIN yelplocationinfo yli
        ON yri.address = yli.address
        AND yri.city = yli.city
        AND yri.state = yli.state
        AND yri.postal_code = yli.postal_code
      WHERE ABS(mli.latitude - yli.latitude) < 0.0005
        AND ABS(mli.longitude - yli.longitude) < 0.0005
        AND yri.business_id IN (SELECT business_id FROM restaurants_with_status)
    )
    SELECT
      rws.*,
      COALESCE(cat.categories, ARRAY[]::text[]) AS categories,
      COALESCE(rp.photos, '[]'::json) AS photos,
      COALESCE(rr.reviews, '[]'::json) AS reviews,
      md.michelin
    FROM restaurants_with_status rws
    LEFT JOIN categories cat ON rws.business_id = cat.business_id
    LEFT JOIN restaurant_photos rp ON rws.business_id = rp.business_id
    LEFT JOIN restaurant_reviews rr ON rws.business_id = rr.business_id
    LEFT JOIN michelin_data md ON rws.business_id = md.business_id
    ORDER BY rws.distance;

  `, [user_lat, user_long, radius, lat_min, lat_max, long_min, long_max], (err, data) => {
    console.log('Query complete:', Date.now() - start, 'ms');
    if (err) {
      console.error(err);
      res.status(500).json([]);
    } else {
      res.json(data.rows);
    }
  });
};
  


/************************
 * IMAGE URL ROUTE    *
 ************************/

// Route: GET /photos/:business_id
// Description: Return all AWS URLs for photos belonging to a given business
const list_business_photos = async function(req, res) {
  const businessId = req.params.business_id;

  if (!businessId) {
    return res.status(400).json({ error: "Missing required parameter: business_id" });
  }

  connection.query(
    `
    SELECT aws_url
    FROM yelpphotos
    WHERE business_id = $1
      AND aws_url IS NOT NULL
    ORDER BY photo_id
    LIMIT 10
    `,
    [businessId],
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).json([]);
      } else {
        return res.json(data.rows.map(row => row.aws_url));
      }
    }
  );
};

/************************
 * IMAGE FETCH ROUTE    *
 ************************/
// this handles fetching images from s3 buckets
// supports both public http urls and s3:// urls

const axios = require("axios");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { parse } = require("url");

// Initialize S3 client with credentials from config.json
const s3Config = {
  region: config.aws_region || "us-east-2"
};

// Add credentials if provided in config
if (config.aws_access_key_id && config.aws_secret_access_key) {
  s3Config.credentials = {
    accessKeyId: config.aws_access_key_id,
    secretAccessKey: config.aws_secret_access_key
  };
}

const s3 = new S3Client(s3Config);

// Route: GET /fetch-image
// Description: Fetch a JPEG image from an AWS S3 URL (public or private) and return it
const fetch_image = async function(req, res) {
  const aws_url = req.query.aws_url;

  if (!aws_url) {
    return res.status(400).json({ error: "Missing parameter: aws_url" });
  }

  try {
    if (aws_url.startsWith("http")) {
      const response = await axios.get(aws_url, { responseType: "arraybuffer" });
      res.set("Content-Type", "image/jpeg");
      return res.send(response.data);
    }

    if (aws_url.startsWith("s3://")) {
      const parsed = parse(aws_url);
      const bucket = parsed.host;
      const key = parsed.path.replace(/^\//, "");

      const cmd = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const s3resp = await s3.send(cmd);

      const chunks = [];
      for await (const chunk of s3resp.Body) {
        chunks.push(chunk);
      }

      res.set("Content-Type", "image/jpeg");
      return res.send(Buffer.concat(chunks));
    }

    return res.status(400).json({ error: "Invalid AWS URL format" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch image", details: err.message });
  }
};

/************************
 * USER AUTH ROUTES   *
 ************************/
// supports local login (email/password), google oauth, and github oauth

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// creates new user with local auth (email/password)
const create_user_auth = async function(req, res) {
  const { name, email, password, city = null, state = null } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  try {
    // check if email already exists
    const existing = await connection.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const userResult = await connection.query(
      `INSERT INTO users (name, email, city, state)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, city, state`,
      [name, email, city, state]
    );
    const user = userResult.rows[0];

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await connection.query(
      `INSERT INTO userauth (user_id, provider, provider_id, password_hash)
       VALUES ($1, 'local', NULL, $2)`,
      [user.user_id, hash]
    );

    return res.status(201).json({ user });

  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Route: POST /auth/login
// Body: { email, password }
const login_local = async function(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const userResult = await connection.query(
      'SELECT user_id, name, email, city, state FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = userResult.rows[0];

    const authResult = await connection.query(
      `SELECT password_hash FROM userauth
       WHERE user_id = $1 AND provider = 'local'`,
      [user.user_id]
    );

    if (authResult.rows.length === 0) {
      return res.status(401).json({ error: 'No local login registered for this account' });
    }

    const { password_hash } = authResult.rows[0];

    const match = await bcrypt.compare(password, password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({ user });

  } catch (err) {
    console.error('Error in login_local:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(config.google_client_id);

// Route: POST /auth/google
// Body: { idToken }
// verifies google id token and creates/logs in user
const login_google = async function(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google_client_id
    });
    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email;

    console.log('Google login attempt:', { email, name, googleId });

    const authResult = await connection.query(
      `SELECT user_id FROM userauth
       WHERE provider = 'google' AND provider_id = $1`,
      [googleId]
    );

    let user;

    if (authResult.rows.length > 0) {
      // Existing Google auth user
      const userId = authResult.rows[0].user_id;
      const userResult = await connection.query(
        `SELECT user_id, name, email, city, state FROM users WHERE user_id = $1`,
        [userId]
      );
      user = userResult.rows[0];
    } else {
      // New Google auth - check if user exists by email
      const existingUserResult = await connection.query(
        `SELECT user_id, name, email, city, state FROM users WHERE email = $1`,
        [email]
      );

      if (existingUserResult.rows.length > 0) {
        // User exists but no Google auth yet
        user = existingUserResult.rows[0];
      } else {
        // Create new user
        const newUserResult = await connection.query(
          `INSERT INTO users (name, email, city, state)
           VALUES ($1, $2, NULL, NULL)
           RETURNING user_id, name, email, city, state`,
          [name, email]
        );
        user = newUserResult.rows[0];
      }

      // Add Google auth entry - check first, then insert
    
      const checkAuth = await connection.query(
        `SELECT user_id FROM userauth 
         WHERE provider = 'google' AND provider_id = $1`,
        [googleId]
      );
     

      if (checkAuth.rows.length === 0) {
        try {
          const authInsertResult = await connection.query(
            `INSERT INTO userauth (user_id, provider, provider_id, password_hash)
             VALUES ($1, 'google', $2, NULL)`,
            [user.user_id, googleId]
          );
        } catch (insertErr) {
          throw insertErr;
        }
      } else {
        console.log('STEP 3: Auth already exists, skipping insert');
      }
    }

    return res.status(200).json({ user });

  } catch (err) {
    return res.status(500).json({ error: 'Google login failed', details: err.message });
  }
};

const crypto = require('crypto');
const GITHUB_CLIENT_ID = config.github_client_id;
const GITHUB_CLIENT_SECRET = config.github_client_secret;
const FRONTEND_URL = config.frontend_url || 'http://localhost:3000';

// Route: GET /auth/github/start
// Description: Redirect user to GitHub OAuth consent screen
// github oauth is a 2-step process - this starts it by redirecting to github
const github_start = async function(req, res) {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('gh_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
    });

    const redirectUri = `https://github.com/login/oauth/authorize` +
      `?client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent('http://localhost:8080/auth/github/callback')}` +
      `&scope=${encodeURIComponent('read:user user:email')}` +
      `&state=${encodeURIComponent(state)}`;

    return res.redirect(redirectUri);
  } catch (err) {
    console.error('Error in github_start:', err);
    return res.status(500).json({ error: 'Failed to start GitHub login' });
  }
};

// Route: GET /auth/github/callback
// Description: Handle GitHub OAuth callback, create/login user, then redirect to frontend
// github redirects back here with a code, we exchange it for user info
const github_callback = async function(req, res) {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code from GitHub' });
  }

  try {
    const cookieState = req.cookies?.gh_oauth_state;
    if (!cookieState || cookieState !== state) {
      console.warn('GitHub OAuth state mismatch');
   }

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:8080/auth/github/callback',
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      console.error('No access token from GitHub:', tokenRes.data);
      return res.status(500).json({ error: 'Failed to get access token from GitHub' });
    }

    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'dishcord-app',
      },
    });

    const ghUser = userRes.data;
    let email = ghUser.email;
    const githubId = ghUser.id?.toString();
    const name = ghUser.name || ghUser.login || email || 'GitHub User';

    if (!email) {
      const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'dishcord-app',
        },
      });

      const emails = emailRes.data || [];
      const primary = emails.find((e) => e.primary && e.verified) ||
                      emails.find((e) => e.verified) ||
                      emails[0];

      if (primary && primary.email) {
        email = primary.email;
      }
    }

    if (!githubId) {
      return res.status(500).json({ error: 'GitHub user ID missing' });
    }

    let user;

    const authResult = await connection.query(
      `SELECT user_id FROM userauth
       WHERE provider = 'github' AND provider_id = $1`,
      [githubId]
    );

    if (authResult.rows.length > 0) {
      const userId = authResult.rows[0].user_id;
      const userResult = await connection.query(
        `SELECT user_id, name, email, city, state
         FROM users
         WHERE user_id = $1`,
        [userId]
      );
      user = userResult.rows[0];
    } else {
      const existingUserResult = await connection.query(
        `SELECT user_id, name, email, city, state
         FROM users
         WHERE email = $1`,
        [email]
      );

      if (existingUserResult.rows.length > 0) {
        user = existingUserResult.rows[0];
      } else {
        const newUserResult = await connection.query(
          `INSERT INTO users (name, email, city, state)
           VALUES ($1, $2, NULL, NULL)
           RETURNING user_id, name, email, city, state`,
          [name, email]
        );
        user = newUserResult.rows[0];
      }

      await connection.query(
        `INSERT INTO userauth (user_id, provider, provider_id, password_hash)
         VALUES ($1, 'github', $2, NULL)`,
        [user.user_id, githubId]
      );
    }

    const redirectUrl = `${FRONTEND_URL}/auth-complete?userId=${user.user_id}`;
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error('Error in github_callback:', err);
    return res
      .status(500)
      .json({ error: 'GitHub login failed', details: err.message });
  }
};



// Route: GET /all-cities
// Description: Get all distinct city/state pairs from YelpRestaurantInfo
// used for the city dropdown on explore cities page
const all_cities = async function(req, res) {
  connection.query(
    `
    SELECT DISTINCT
      LOWER(TRIM(city)) AS city,
      LOWER(TRIM(state)) AS state
    FROM yelprestaurantinfo
    WHERE city IS NOT NULL AND state IS NOT NULL
    ORDER BY city ASC, state ASC
    `,
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
};

// Route: GET /city-photo/:city
// Description: Get random photos from restaurants in a given city
const city_photo = async function(req, res) {
  let city = req.params.city;
  
  if (city) {
    city = decodeURIComponent(city);
  }

  if (!city) {
    return res.status(400).json({ error: "Missing required parameter: city" });
  }

  connection.query(
    `
    SELECT p.aws_url
    FROM YelpPhotos p
    JOIN yelprestaurantinfo r ON p.business_id = r.business_id
    WHERE LOWER(TRIM(r.city)) = LOWER(TRIM($1))
      AND p.aws_url IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 12
    `,
    [city],
    (err, data) => {
      if (err) {
        console.error("Error fetching city photos:", err);
        return res.status(500).json({ error: "Failed to fetch photos" });
      } else if (data.rows && data.rows.length > 0) {
        const photoUrls = data.rows.map(row => row.aws_url);
        return res.json({ photo_urls: photoUrls });
      } else {
        return res.status(404).json({ error: "No photos found for this city" });
      }
    }
  );
};



module.exports = {
  // User profile
  get_user,
  update_user_name,
  update_user_email,
  update_user_home_city,
  update_user_home_state,
  add_favorite,
  remove_favorite,
  list_favorites,
  add_visited,
  remove_visited,
  list_visited,

  // Auth
  create_user_auth,
  login_local,
  login_google,
  github_start,
  github_callback,

  // Leaderboard
  michelin_engagement_stats,
  most_adventurous_user,
  top_influencers,

  // City insights
  city_stats,
  city_top_restaurants,
  hidden_gems,

  // Search/browse
  search_restaurants_by_name,
  restaurants_by_zip,

  // Restaurants & maps
  get_restaurant,
  map_restaurants,
  michelin_yelp_matches,

  // Media
  list_business_photos,
  fetch_image,
  all_cities,
  city_photo,

  // Removed unused/legacy routes
};