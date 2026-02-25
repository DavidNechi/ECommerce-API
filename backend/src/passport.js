const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("../model/db");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    async (email, password, done) => {
      try {
        const result = await pool.query(
          "SELECT id, name, email, address, created_at, password_hash FROM users WHERE email = $1",
          [email]
        );

        if (result.rows.length === 0) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          created_at: user.created_at,
        };

        return done(null, safeUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, address, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return done(null, false);
    }

    return done(null, result.rows[0]);
  } catch (error) {
    return done(error);
  }
});

module.exports = passport;
