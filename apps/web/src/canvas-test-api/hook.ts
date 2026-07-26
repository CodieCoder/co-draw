import { parseWebConfiguration } from "@vega/config/web";

import { installCanvasTestApi } from "./initializer.js";

try {
  const configuration = parseWebConfiguration(import.meta.env);
  installCanvasTestApi(configuration);
} catch {
  /* The application will render its own configuration-failure state.
     The test API simply remains absent. */
}
