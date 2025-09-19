// If executed directly, run main()
import { main } from "./cli";

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .then((code) => process.exit(code))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
