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

/***********************
 * USER PROFILE ROUTES *
 ***********************/

// Route: POST /users
// Description: Creates a new Dishcord user
const create_user = async function(req, res) {
    const { name, email, password, city = null, state = null } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required parameters: name, email, password' });
    }

    connection.query(
      `
      INSERT INTO users (name, email, password, city, state)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, name, email, city, state, time_created
      `,
      [name, email, password, city, state],
      (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).json({});
        } else {
          res.json(data.rows[0]);
        }
      }
    );
  };

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
// Description: Lists all of a user's favorites
const list_favorites = async function(req, res) {
    connection.query(
      `
      SELECT r.*
      FROM favorites f
      JOIN yelprestaurantinfo r
        ON r.business_id = f.business_id
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
// Description: Lists all of a user's visited restaurants ordered by stars
const list_visited = async function(req, res) {
    connection.query(
      `
      SELECT r.*, v.stars
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
// Description: Get matched Michelin and Yelp restaurants with proximity check
const michelin_yelp_matches = async function(req, res) {
  connection.query(
    `
    SELECT
        yri.name AS yelp_name,
        yri.address AS yelp_address,
        yri.city,
        yri.state,
        yri.stars,
        mri.award
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

// Route: GET /top-restaurants/:city
// Description: Get top 10 restaurants in a city by review count
const top_restaurants_by_city = async function(req, res) {
  const city = req.params.city;
  
  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }
  
  connection.query(
    `
    SELECT
        name,
        address,
        review_count,
        stars
    FROM yelprestaurantinfo
    WHERE city = $1
    ORDER BY review_count DESC
    LIMIT 10
    `,
    [city],
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

// Route: GET /nearby-restaurants
// Description: Find highly-rated restaurants near user location
const nearby_restaurants = async function(req, res) {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const max_distance = parseFloat(req.query.max_distance);
  
  if (!lat || !lon || !max_distance) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lon, max_distance' });
  }
  
  connection.query(
    `
    SELECT
        r.name,
        r.address,
        r.city,
        r.state,
        r.stars,
        r.review_count,
        6371 * 2 * ASIN(
            SQRT(
                POWER(SIN(RADIANS($1 - l.latitude) / 2), 2) +
                COS(RADIANS(l.latitude)) * COS(RADIANS($1)) *
                POWER(SIN(RADIANS($2 - l.longitude) / 2), 2)
            )
        ) AS distance_km
    FROM yelprestaurantinfo r
    JOIN yelplocationinfo l
        ON r.address = l.address
       AND r.city = l.city
       AND r.state = l.state
       AND r.postal_code = l.postal_code
    WHERE r.stars >= 4.5
      AND r.review_count > 300
      AND 6371 * 2 * ASIN(
            SQRT(
                POWER(SIN(RADIANS($1 - l.latitude) / 2), 2) +
                COS(RADIANS(l.latitude)) * COS(RADIANS($1)) *
                POWER(SIN(RADIANS($2 - l.longitude) / 2), 2)
            )
        ) <= $3
    ORDER BY
        distance_km ASC,
        r.stars DESC,
        r.review_count DESC
    `,
    [lat, lon, max_distance],
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

// Route: GET /michelin-vs-yelp-stats
// Description: Compare average review coverage for Michelin vs non-Michelin restaurants
const michelin_vs_yelp_stats = async function(req, res) {
  connection.query(
    `
    WITH reviews_per_business AS (
        SELECT
            b.business_id,
            b.name,
            b.address,
            b.city,
            b.state,
            b.review_count,
            COUNT(r.review_id) AS review_entries,
            CASE
                WHEN b.review_count > 0
                    THEN COUNT(r.review_id)::decimal / b.review_count
                ELSE 0
            END AS reviews_per_review
        FROM yelprestaurantinfo b
        LEFT JOIN yelpreviewinfo r
            ON b.business_id = r.business_id
        GROUP BY
            b.business_id, b.name, b.address, b.city, b.state, b.review_count
    ),
    labeled AS (
        SELECT
            rb.*,
            CASE
                WHEN mri.name IS NOT NULL THEN 'Michelin'
                ELSE 'Non-Michelin'
            END AS michelin_status
        FROM reviews_per_business rb
        LEFT JOIN michelinrestaurantinfo mri
            ON LOWER(TRIM(rb.name)) = LOWER(TRIM(mri.name))
        JOIN michelinlocationinfo mli
            ON mri.address = mli.address
    )
    SELECT
        michelin_status,
        AVG(reviews_per_review) AS avg_reviews_per_review,
        COUNT(*) AS restaurant_count
    FROM labeled
    GROUP BY michelin_status
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

// Route: GET /restaurants-by-zip
// Description: Find restaurants by zip code and optional category filter
const restaurants_by_zip = async function(req, res) {
  const zip_code = req.query.zip_code || req.body.zip_code;
  const category = req.query.category || req.body.category;
  
  if (!zip_code) {
    return res.status(400).json({ error: 'Missing required parameter: zip_code' });
  }
  
  connection.query(
    `
    SELECT DISTINCT
        r.name,
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
    `,
    [zip_code, category],
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

// Route: GET /michelin-yelp-rating-comparison
// Description: Compare Michelin scores with Yelp ratings by city
const michelin_yelp_rating_comparison = async function(req, res) {
  connection.query(
    `
    WITH yelp_michelin_join AS (
        SELECT
            r.business_id,
            r.city,
            r.state,
            r.stars AS yelp_stars,
            CASE
                WHEN mri.award ILIKE '3%' THEN 5
                WHEN mri.award ILIKE '2%' THEN 4
                WHEN mri.award ILIKE '1%' THEN 3
                WHEN mri.award ILIKE 'Bib%' THEN 2
                WHEN mri.award ILIKE 'Selected%' THEN 1
                ELSE NULL
            END AS michelin_score
        FROM yelprestaurantinfo r
        JOIN yelpreviewinfo yr
            ON r.business_id = yr.business_id
        JOIN michelinrestaurantinfo mri
            ON LOWER(TRIM(r.name)) = LOWER(TRIM(mri.name))
        JOIN michelinlocationinfo mli
            ON mri.address = mli.address
    ),
    city_stats AS (
        SELECT
            city,
            state,
            AVG(yelp_stars) AS avg_yelp_rating,
            AVG(michelin_score) AS avg_michelin_score
        FROM yelp_michelin_join
        WHERE michelin_score IS NOT NULL
        GROUP BY city, state
    )
    SELECT
        city,
        state,
        avg_yelp_rating,
        avg_michelin_score,
        (avg_yelp_rating - avg_michelin_score) AS diff,
        ABS(avg_yelp_rating - avg_michelin_score) AS abs_diff
    FROM city_stats
    ORDER BY abs_diff DESC
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

// Route: GET /hidden-gems/:city
// Description: Find underrated restaurants (high rating, low review count) vs peers in a city
const hidden_gems = async function(req, res) {
  const city = req.params.city;
  const category = req.query.category || req.body.category;
  
  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }
  
  connection.query(
    `
    WITH group_restaurants AS (
      SELECT
        r.business_id,
        r.name,
        r.city,
        r.stars AS yelp_stars,
        r.review_count,
        array_remove(array_agg(DISTINCT c.category), NULL) AS categories,
        r.attributes ->> 'RestaurantsPriceRange2' AS price
      FROM yelprestaurantinfo r
      LEFT JOIN yelprestaurantcategories c
        ON r.business_id = c.business_id
      WHERE r.city = $1
        AND (
          $2 IS NULL
          OR EXISTS (
            SELECT 1
            FROM yelprestaurantcategories c2
            WHERE c2.business_id = r.business_id
              AND LOWER(c2.category) LIKE '%' || LOWER($2) || '%'
          )
          )
      GROUP BY r.business_id, r.name, r.city, r.stars, r.review_count, r.attributes
    ),
    peer_stats AS (
        SELECT
            AVG(yelp_stars) AS avg_rating,
            AVG(review_count) AS avg_reviews
        FROM group_restaurants
    )
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
    JOIN peer_stats ps
    ORDER BY label DESC, g.yelp_stars DESC
    `,
    [city, category],
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

// Route: GET /restaurant-ratings-over-time/:city
// Description: Track average restaurant ratings by year for a city
const restaurant_ratings_over_time = async function(req, res) {
  const city = req.params.city;
  
  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }
  
  connection.query(
    `
    WITH reviews_with_year AS (
        SELECT
            r.business_id,
            yr.city,
            yr.state,
            EXTRACT(YEAR FROM r.date) AS review_year,
            r.stars
        FROM yelprestaurantinfo yr
        JOIN yelpreviewinfo r
            ON yr.business_id = r.business_id
    )
    SELECT
        city,
        state,
        review_year,
        AVG(stars) AS avg_yelp_rating
    FROM reviews_with_year
    WHERE city = $1
    GROUP BY city, state, review_year
    ORDER BY city, state, review_year
    `,
    [city],
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

// Route: GET /cuisine-ratings/:city
// Description: Get average rating by cuisine type in a city
const cuisine_ratings = async function(req, res) {
  const city = req.params.city;
  
  if (!city) {
    return res.status(400).json({ error: 'Missing required parameter: city' });
  }
  
  connection.query(
    `
    SELECT
      TRIM(c.category) AS cuisine,
      AVG(r.stars) AS avg_rating,
      COUNT(DISTINCT r.business_id) AS num_restaurants
    FROM yelprestaurantinfo r
    JOIN yelprestaurantcategories c
      ON r.business_id = c.business_id
    WHERE r.city = $1
    GROUP BY TRIM(c.category)
    ORDER BY avg_rating DESC
    `,
    [city],
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


module.exports = {
    create_user,
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
    michelin_yelp_matches,
    top_restaurants_by_city,
    nearby_restaurants,
    michelin_vs_yelp_stats,
    restaurants_by_zip,
    michelin_yelp_rating_comparison,
    hidden_gems,
    restaurant_ratings_over_time,
    cuisine_ratings
};