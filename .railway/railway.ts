import { defineRailway, github, postgres, preserve, project, service } from "railway/iac";

export default defineRailway((ctx) => {
  const db = postgres("Postgres");

  // NOTE on MinIO: object storage for uploaded images (Bucket + Console
  // services, "MinIO" group) is provisioned via the
  // `railwayapp-templates/minio` marketplace template
  // (`railway deploy -t SMKOEA`), and deliberately NOT declared as a
  // resource in this file. A first attempt at declaring it here (to match
  // the template's build/start/healthcheck) still produced a plan that
  // deleted the group and several Railway-injected variables Console
  // needs to function (MINIO_PUBLIC_ENDPOINT, CONSOLE_MINIO_SERVER,
  // USERNAME, PASSWORD, ...) — this beta IaC engine can't yet round-trip
  // a marketplace template's own generated config losslessly. Manage
  // Bucket/Console directly (dashboard or `railway variable`/`railway
  // ssh`/etc, service-scoped with `--service Bucket`), never through
  // `railway config apply`. Before ever running `apply` on this file,
  // run `railway config plan` first and check there is no
  // "Delete service Bucket|Console" or "Delete group MinIO" line.

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
      // Frontend and backend are on different domains, so the auth cookies
      // need SameSite=None (with Secure, already forced by AUTH_COOKIE_SECURE
      // when DEBUG=False) to be sent on cross-site fetch requests.
      AUTH_COOKIE_SAMESITE: "None",
      // Uploaded images live in the MinIO Bucket service above. These four
      // were set directly with `railway variable set` (bucket name/endpoint
      // are non-secret but easiest to keep alongside the credentials; the
      // access key/secret came from Bucket's MINIO_ROOT_USER/PASSWORD) and
      // are preserved here on purpose, not inlined — keeps the root
      // credential out of source control. Values, for reference:
      //   AWS_STORAGE_BUCKET_NAME = safariquest-media
      //   AWS_S3_ENDPOINT_URL     = http://bucket.railway.internal:9000
      //   AWS_S3_CUSTOM_DOMAIN    = bucket-production-1dbe.up.railway.app/safariquest-media
      AWS_STORAGE_BUCKET_NAME: preserve(),
      AWS_S3_ENDPOINT_URL: preserve(),
      AWS_S3_CUSTOM_DOMAIN: preserve(),
      AWS_ACCESS_KEY_ID: preserve(),
      AWS_SECRET_ACCESS_KEY: preserve(),
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
