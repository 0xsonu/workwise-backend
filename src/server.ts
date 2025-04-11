import app from "./app";
import { config } from "./config/config";
import logger from "./utils/logger";

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
