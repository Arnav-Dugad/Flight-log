# Flight Log

Flight Log is a private, Firebase-backed aviation atlas for single flights and multi-leg journeys. It is India-first in its defaults and airline ordering, with worldwide airport coverage.

## What is included

- Connected journeys with any number of flight segments
- 7,743 searchable IATA airports and cities worldwide
- 50 Indian and international airlines with live logo imagery
- Email/password and Google authentication through Firebase Auth
- Per-user realtime Firestore storage at `users/{uid}/journeys/{journeyId}`
- Connection Shield minimum-buffer analysis and a delay What-if Lab
- Timezone, distance, carbon, India network and spend intelligence
- Magic itinerary text parser
- Cloud JSON import/export and complete journey deletion
- Downloadable privacy-safe Flightprint cards
- Responsive globe UI, motion controls and reduced-motion support
- Automatic footer year

The UI deliberately contains no sample journeys. A signed-out visitor sees an empty private-atlas state, and journeys can only be saved after authentication.

## Firebase setup required

The web configuration for project `flight-log-b2146` is already in `app.js`. Firebase web API keys identify the project; access control comes from Authentication and Firestore Security Rules.

In the Firebase console:

1. Open **Authentication → Sign-in method** and enable **Email/Password**.
2. Optionally enable **Google** to activate the Google sign-in button.
3. Add `flight-log-olive.vercel.app` and any custom production domain under **Authentication → Settings → Authorized domains**.
4. Create a Firestore database.
5. Deploy the included rules:

   ```sh
   firebase deploy --only firestore:rules
   ```

The rules restrict user profiles and journeys to the matching authenticated Firebase UID and validate the main journey shape.

## Local development

This is a static ES-module app. Serve it over HTTP so the browser can fetch the airport atlas:

```sh
npx serve .
```

Opening `index.html` directly with a `file://` URL will prevent `data/airports.json` from loading in most browsers.

## Vercel

The repository can remain connected to the existing Vercel project. No build command is required; the root directory is the output. `vercel.json` adds security and cache headers.

## Airport data

The committed airport atlas is generated from the MIT-licensed [mwgg/Airports](https://github.com/mwgg/Airports) dataset and contains every entry with a valid IATA code, city and coordinates after deduplication. The upstream license is preserved in `data/LICENSE.airports.txt`.

To rebuild after cloning the upstream dataset into `.airports-source`:

```sh
node scripts/prepare-airports.mjs .airports-source/airports.json data/airports.json
```

## Data model

Each journey stores its metadata plus a `segments` array. A segment can record origin, destination, local departure/arrival time, airline, flight number, cabin, seat, terminals, fare, currency, checked baggage and self-transfer status. Derived distance and carbon estimates are cached for fast dashboards but recalculated by the client when editing.

Connection and carbon results are estimates for personal reflection, not airline, airport, visa, safety or operational advice.
