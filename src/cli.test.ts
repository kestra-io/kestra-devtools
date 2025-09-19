import { describe, it, expect, vi } from "vitest";
import { main } from "./cli";

describe("cli tests", () => {
    it("prints hello with default", async () => {
      const logs: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation(l => logs.push(l));
        await main(["node", "cli"]);
        expect(spy).toHaveBeenCalled();
        expect(logs.reduce((a, b) => a+'___'+b)).contain("Show help")
        spy.mockRestore();
    });
});
