import app from '../server/src/app.js';

// Vercel catch-all function for the existing Express API. The frontend and API
// can therefore be deployed from this repository without requiring a second
// hostname or a client-side proxy workaround.
export default app;
