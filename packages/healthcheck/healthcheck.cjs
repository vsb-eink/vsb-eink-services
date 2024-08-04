#!/usr/bin/env node

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const ROUTE = process.env.ROUTE || '/health';
const HEALTHCHECK_URL = `http://${HOSTNAME}:${PORT}${ROUTE}`;

const healthcheck = async () => {
  try {
    const response = await fetch(HEALTHCHECK_URL);
    if (!response.ok) {
      console.error(`Healthcheck failed with status ${response.status}`);
      process.exit(1);
    }
    const data = await response.json();
    console.log(`Healthcheck passed with status ${response.status}`);
    process.exit(0);
  } catch (error) {
    console.error(`Healthcheck failed with error ${JSON.stringify(error.message)}`);
    process.exit(1);
  }
}

healthcheck();