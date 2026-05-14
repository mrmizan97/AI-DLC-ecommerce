const promClient = require("prom-client");

const register = new promClient.Registry();
register.setDefaultLabels({ app: "ai-dlc-backend" });
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestsTotal);

function metricsMiddleware(req, res, next) {
  if (req.path === "/metrics") return next();
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = req.route?.path || req.baseUrl + (req.route?.path || "") || req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
}

async function metricsHandler(req, res) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler, register };
