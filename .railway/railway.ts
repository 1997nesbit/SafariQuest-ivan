import { defineRailway, github, postgres, preserve, project, service } from "railway/iac";

export default defineRailway((ctx) => {
  const db = postgres("Postgres");

  const Backend = service("Backend", {
    source: github("1997nesbit/SafariQuest-ivan", {
      checkSuites: false,
      rootDirectory: "/backend",
    }),
    build: "pip install -r requirements.txt",
    // Collect static files, apply migrations, then boot gunicorn.
    start:
      "python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn config.wsgi --bind 0.0.0.0:$PORT --access-logfile - --error-logfile -",
    healthcheck: "/api/destinations/",
    healthcheckTimeout: 100,
    replicas: { "us-west2": 1 },
    env: {
      SECRET_KEY: ctx.randomString("backend-secret-key", 50),
      DEBUG: "False",
      ALLOWED_HOSTS:
        ".up.railway.app,.railway.internal,healthcheck.railway.app,pandewildernesstravels.com,localhost,127.0.0.1,[::1]",
      DATABASE_URL: db.env.DATABASE_URL,
      CORS_ALLOWED_ORIGINS: "https://pandewildernesstravels.com",
      CSRF_TRUSTED_ORIGINS: "https://pandewildernesstravels.com",
      FRONTEND_URL: "https://pandewildernesstravels.com",
    },
  });

  const SafariQuest = service("SafariQuest", {
    source: github("SvanteRomero/SafariQuest", {
      checkSuites: false,
      rootDirectory: "/website"
    }),
    // Serve the built Vite SPA (dist/) via `serve` on $PORT.
    start: "pnpm start",
    healthcheck: "/",
    healthcheckTimeout: 100,
    replicas: { "us-west2": 1 },
    domains: ["pandewildernesstravels.com"],
    networking: { privateNetworkEndpoint: "safariquest" },
    env: {
      VITE_CONTACT_ADDRESS: preserve(),
      VITE_CONTACT_EMAIL: preserve(),
      VITE_CONTACT_PHONE: preserve(),
      VITE_CONTACT_PHONE_HREF: preserve(),
      VITE_SOCIAL_FACEBOOK: preserve(),
      VITE_SOCIAL_INSTAGRAM: preserve(),
      VITE_SOCIAL_WHATSAPP: preserve(),
      VITE_API_URL: "https://backend-production-ea816.up.railway.app",
    },
  });

  return project("renewed-cooperation", {
    resources: [db, Backend, SafariQuest],
  });
});
