// If executed directly, run main()
import { main } from "./cli";

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
