# Dishcord 🍽️✨

Find what’s overrated, underrated, or just right — by blending real diners’ voices from Yelp with culinary acclaim from the Michelin Guide. Skip the hype, eat smarter. 🔍🍜⚖️

## Motivation 💡
We’ve all had that moment: you finally try a buzzy, critically acclaimed spot only to walk out thinking… that wasn’t it. 😅💸 Popular review sites and critics can tell different stories, and what “great” means in NYC can differ wildly from LA. Dishcord bridges that gap by aligning Yelp sentiment with Michelin recognition to reveal a balanced view of quality versus hype — and how it varies by city, cuisine, and price.

## What the App Does 🚀
Dishcord aggregates Yelp and Michelin data to:
- 🧭 Classify each restaurant as overrated, underrated, or just right.
- 🔗 Present concise summaries with quick links to Yelp and Michelin details.
- 🔥 Compute a novel “hype” score from combined signals.
- 🌎 Help you explore cities and cuisines and make better dining decisions at home or while traveling.

## Core Features 🎯
- 🔎 Search: Find restaurants by name and location.
- 🧰 Sorting & Filtering: Filter by cuisine, price, location, plus preset underrated/overrated toggles.
- 🏠 Homepage Feed: Browse by area, cuisine, and price with personalized recommendations.
- 🏷️ Restaurant Summaries: See the overrated/underrated/just-right label, Michelin info, Yelp ratings, and quick links.
- 🔥 Hype Score: A computed metric blending Yelp and Michelin signals to quantify restaurant “hype.”
- 🖼️ Photo Gallery: Visual previews using the Yelp Photos dataset.
- 📌 Save Lists: Track “want to try” and “have tried” restaurants.
- 🎛️ User Preferences: Store cuisine, price, and location preferences to personalize your experience.
- 📊 Visualizations: Charts showing relationships between Yelp ratings and Michelin status.

## Data & Databases 🗄️
- 🐘 PostgreSQL (AWS RDS):
	- `Restaurant(Restaurant_ID, Name, Categories, Attributes, City, State, Longitude, Latitude, Address, Postal_Code, Rating_Quantity, Agg_Yelp_Rating)`
	- `Michelin(Name, Address, Michelin_Stars, Bib_Gourmands)` with FK to `Restaurant(Name, Address)`
	- `Photos(Restaurant_ID, Photo_ID, Caption, Label)` with FK to `Restaurant(Restaurant_ID)`
- 🖼️ Yelp Photos Dataset: Large image corpus for the photo gallery (stored/retrieved via cloud storage such as AWS S3).
- 🧹 Data Preparation: Remove records missing essentials; resolve duplicates; perform cross-source entity matching; validate coordinates for map/location features.

## Tech Stack 🧰
- **Frontend:** React (Create React App), React Router, Material UI (`@mui/material`), Emotion (`@emotion/*`), Axios, Web Vitals
- **Mapping:** `@react-google-maps/api` for map rendering and interactions
- **Backend:** Node.js, Express, CORS, Cookie Parser, Axios
- **Auth & Security:** Google Auth Library, Bcrypt
- **Database:** PostgreSQL (`pg`) on AWS RDS
- **Storage:** AWS S3 via `@aws-sdk/client-s3` for photos
- **Testing:** Jest, Supertest, React Testing Library
- **Dev Tools:** Nodemon, ESLint via `react-app` config, Browserslist
- **Data Science:** Jupyter Notebooks (`*.ipynb`) for preprocessing, statistics, and formatting
- **Languages:** JavaScript (frontend and backend), SQL (PostgreSQL), Python (notebooks)

---
Questions or feedback? Open an issue and we’ll take a look. 💬

