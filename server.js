require('dotenv').config();
const express = require('express');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const session = require('express-session');
const { MongoClient } = require('mongodb');
const { Dropbox } = require('dropbox');

const app = express();
let db;

// Auth0 Setup
passport.use(new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/callback'
}, (token, refresh, extra, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(session({ secret: 'mysecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB
MongoClient.connect(process.env.MONGODB_URI).then(client => {
  db = client.db('myapp');
  console.log('✓ MongoDB connected');
}).catch(err => console.log('MongoDB error:', err));

// Routes
app.get('/', (req, res) => {
  if (req.user) {
    res.send(`<h1>Hi ${req.user.displayName}!</h1>
              <a href="/dropbox">View Dropbox Files</a> | 
              <a href="/logout">Logout</a>`);
  } else {
    res.send('<h1>Welcome</h1><a href="/login">Login with Auth0</a>');
  }
});

app.get('/login', passport.authenticate('auth0'));

app.get('/callback', passport.authenticate('auth0'), (req, res) => {
  if (db) {
    db.collection('users').insertOne({ 
      name: req.user.displayName, 
      loginDate: new Date() 
    });
  }
  res.redirect('/');
});

app.get('/dropbox', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const files = await new Dropbox({ accessToken: process.env.DROPBOX_TOKEN }).filesListFolder({ path: '' });
  res.json(files.result.entries);
});

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.listen(4000, () => console.log('✓ Server running on http://localhost:4000'));