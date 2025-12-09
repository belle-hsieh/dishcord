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
const michelin_engagement_stats = async function(req, res) {
  connection.query(
    `
    WITH photo_counts AS (
      SELECT p.business_id, COUNT(p.photo_id) AS num_photos
      FROM photos p
      GROUP BY p.business_id
    ),
    review_counts AS (
      SELECT r.business_id, COUNT(r.review_id) AS num_reviews
      FROM yelpreviewinfo r
      GROUP BY r.business_id
    ),
    joined AS (
      SELECT
        b.business_id,
        b.name,
        COALESCE(pc.num_photos, 0) AS num_photos,
        COALESCE(rc.num_reviews, 0) AS num_reviews,
        CASE
          WHEN mri.name IS NOT NULL THEN 'Michelin'
          ELSE 'Non-Michelin'
        END AS michelin_status
      FROM yelprestaurantinfo b
      LEFT JOIN photo_counts pc ON b.business_id = pc.business_id
      LEFT JOIN review_counts rc ON b.business_id = rc.business_id
      LEFT JOIN michelinrestaurantinfo mri
        ON LOWER(TRIM(b.name)) = LOWER(TRIM(mri.name))
      LEFT JOIN michelinlocationinfo mli
        ON mri.address = mli.address
    )
    SELECT
      michelin_status,
      AVG(
        CASE
          WHEN num_reviews > 0 THEN num_photos::decimal / num_reviews
          ELSE 0
        END
      ) AS avg_photos_per_review,
      COUNT(*) AS restaurant_count
    FROM joined
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

// Route: GET /most-adventurous-user
// Description: Find the user who has reviewed the highest number of distinct cuisines
const most_adventurous_user = async function(req, res) {
  connection.query(
    `
    WITH user_reviews AS (
      SELECT
        rv.user_id,
        rv.business_id
      FROM yelpreviewinfo rv
    ),
    user_cuisines AS (
      SELECT
        ur.user_id,
        LOWER(TRIM(rc.category)) AS cuisine
      FROM user_reviews ur
      JOIN yelprestaurantcategories rc
        ON ur.business_id = rc.business_id
    ),
    cleaned AS (
      SELECT user_id, cuisine
      FROM user_cuisines
      WHERE cuisine IS NOT NULL AND cuisine <> ''
    ),
    cuisine_counts AS (
      SELECT
        user_id,
        COUNT(DISTINCT cuisine) AS num_cuisines
      FROM cleaned
      GROUP BY user_id
    )
    SELECT
      cc.user_id,
      yi.name AS user_name,
      cc.num_cuisines
    FROM cuisine_counts cc
    JOIN yelpuserinfo yi
      ON cc.user_id = yi.user_id
    WHERE cc.num_cuisines >= ALL (
      SELECT num_cuisines
      FROM cuisine_counts cc2
      WHERE cc2.user_id <> cc.user_id
    )
    ORDER BY cc.num_cuisines DESC
    LIMIT 1
    `,
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
    WITH user_reviews AS (
      SELECT
        rv.user_id,
        rv.business_id,
        rv.useful,
        rv.funny,
        rv.cool
      FROM yelpreviewinfo rv
    ),
    restaurant_popularity AS (
      SELECT
        business_id,
        review_count,
        NTILE(100) OVER (ORDER BY review_count) AS popularity_percentile
      FROM yelprestaurantinfo
    ),
    user_stats AS (
      SELECT
        ur.user_id,
        COUNT(*) AS num_reviews,
        AVG(ur.useful + ur.funny + ur.cool) AS avg_reactions,
        AVG(rp.popularity_percentile) AS avg_restaurant_popularity
      FROM user_reviews ur
      JOIN restaurant_popularity rp
        ON ur.business_id = rp.business_id
      GROUP BY ur.user_id
    ),
    influence_scores AS (
      SELECT
        user_id,
        (LN(num_reviews + 1)
        + COALESCE(avg_reactions, 0)
        + COALESCE(avg_restaurant_popularity / 20.0, 0)) AS influence_score
      FROM user_stats
    )
    SELECT
      u.user_id,
      yi.name AS user_name,
      u.influence_score
    FROM influence_scores u
    JOIN yelpuserinfo yi
      ON yi.user_id = u.user_id
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
        yri.business_id,
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
        business_id,
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

      // Get Michelin award if applicable (optional)
      connection.query(
        `
        SELECT DISTINCT mri.award
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
            restaurant.award = michelinData.rows[0].award;
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

              res.json(restaurant);
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
const map_restaurants = async function(req, res) {
  const user_lat = parseFloat(req.query.latitude);
  const user_long = parseFloat(req.query.longitude);
  const radius = parseFloat(req.query.radius) || 5; // Default 5 miles
  
  // Fail if invalid loc
  if (isNaN(user_lat) || isNaN(user_long)) {
    return res.status(400).json({ error: 'Missing or invalid latitude/longitude' });
  }
  
  connection.query(`
    WITH restaurant_base AS (
      SELECT DISTINCT
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
        l.latitude BETWEEN $1 - ($3 / 69.0) AND $1 + ($3 / 69.0)
        AND l.longitude BETWEEN $2 - ($3 / (69.0 * cos(radians($1)))) AND $2 + ($3 / (69.0 * cos(radians($1))))
    ),
    filtered_restaurants AS (
      SELECT * FROM restaurant_base
      WHERE distance <= $3
      LIMIT 100
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
        p.business_id, 
        json_agg(
          json_build_object(
            'photo_id', p.photo_id, 
            'caption', p.caption, 
            'label', p.label
          )
        ) AS photos
      FROM (
        SELECT DISTINCT ON (business_id, photo_id) * FROM yelpphotos 
        WHERE business_id IN (SELECT business_id FROM restaurants_with_status)
      ) p
      GROUP BY p.business_id
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
        SELECT DISTINCT ON (business_id, review_id) * FROM yelpreviewinfo 
        WHERE business_id IN (SELECT business_id FROM restaurants_with_status)
      ) r
      GROUP BY r.business_id
    )
    SELECT
      rws.*,
      COALESCE(cat.categories, ARRAY[]::text[]) AS categories,
      COALESCE(rp.photos, '[]'::json) AS photos,
      COALESCE(rr.reviews, '[]'::json) AS reviews
    FROM restaurants_with_status rws
    LEFT JOIN categories cat ON rws.business_id = cat.business_id
    LEFT JOIN restaurant_photos rp ON rws.business_id = rp.business_id
    LEFT JOIN restaurant_reviews rr ON rws.business_id = rr.business_id
    ORDER BY rws.distance ASC
  `, [user_lat, user_long, radius], (err, data) => {
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
    FROM photos
    WHERE business_id = $1
    ORDER BY photo_id
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

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const create_user_auth = async function(req, res) {
  const { name, email, password, city = null, state = null } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  try {
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





module.exports = {
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
    cuisine_ratings,
    get_restaurant,
    list_business_photos,
    fetch_image,
    michelin_engagement_stats,
    most_adventurous_user,
    top_influencers,
    map_restaurants,
    create_user_auth,
    login_local,
    login_google
};