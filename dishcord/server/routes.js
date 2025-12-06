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

/******************
 * USER PROFILE ROUTES *
 ******************/

// Route: POST /users
// Description: Creates a new Dishcord user
const create_user = async function(req, res) {
    const { name, email, password, home_city, home_state } = req.body;
  
    connection.query(
      `
      INSERT INTO users (name, email, password, home_city, home_state)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING name, email, password, home_city, home_state, time_created
      `,
      [name, email, password, home_city, home_state],
      (err, data) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json(data.rows[0]);
        }
      }
    );
  };

// Route: GET /users/:id
// Description: Retrieves all information about a user by their user_id
const get_user = async function(req, res) {
    connection.query(
        `
        SELECT name, email, password, home_city, home_state
        FROM users
        WHERE user_id = ${req.params.user_id}
        `,
        (err, data) => {
        if (err) {
            console.log(err);
            res.json({});
        } else {
            res.json(data.rows[0] || {});
        }
        }
    );
};

// Route: PUT /users/:id/name
// Description: Updates user's name
const update_user_name = async function(req, res) {
    connection.query(
      `
      UPDATE users
      SET name = ${req.body}
      WHERE user_id = ${req.params.user_id}
      `,
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
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
    connection.query(
      `
      UPDATE users
      SET email = ${req.body}
      WHERE user_id = ${req.params.user_id}
      `,
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
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
// Description: Updates user's home_city
const update_user_home_city = async function(req, res) {
    connection.query(
      `
      UPDATE users
      SET home_city = ${req.body}
      WHERE user_id = ${req.params.user_id}
      `,
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json({
            user_id: userId,
            updated_field: "home_city",
            status: "success"
          });
        }
      }
    );
};

// Route: PUT /users/:id/home_city
// Description: Updates user's home_city
const update_user_home_state = async function(req, res) {
    connection.query(
      `
      UPDATE users
      SET home_city = ${req.body}
      WHERE user_id = ${req.params.user_id}
      `,
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json({
            user_id: userId,
            updated_field: "home_state",
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
    const { restaurant_id } = req.body;
  
    connection.query(
      `
      INSERT INTO favorites (user_id, business_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [userId, restaurant_id],
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json({
            user_id: userId,
            business_id: restaurant_id,
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
            restaurant_id: business_id,
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
      JOIN restaurants r
        ON r.business_id = f.business_id
      WHERE f.user_id = $1
      `,
      [req.params.id],
      (err, data) => {
        if (err) {
          console.log(err);
          res.json([]);
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
    const { restaurant_id } = req.body;
  
    connection.query(
      `
      INSERT INTO visited (user_id, business_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [userId, restaurant_id],
      (err) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json({
            user_id: userId,
            business_id: restaurant_id,
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
            restaurant_id: business_id,
            status: "removed",
          });
        }
      }
    );
  };

// Route: GET /users/:id/visited
// Description: Lists all of a user's visited
const list_visited = async function(req, res) {
    connection.query(
      `
      SELECT r.*
      FROM visited v
      JOIN restaurants r
        ON r.business_id = v.business_id
      WHERE v.user_id = $1
      `,
      [req.params.id],
      (err, data) => {
        if (err) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  };
