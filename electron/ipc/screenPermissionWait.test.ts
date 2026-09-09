import { describe, expect, it } from "vitest";
import { createScreenPermissionWaitController } from "./screenPermissionWait";

function createHarness() {
	const events: string[] = [];
	const controller = createScreenPermissionWaitController({
		onWaitStarted: () => {
			events.push("started");
		},
		onWaitEnded: (granted) => {
			events.push(granted ? "ended:granted" : "ended:denied");
		},
	});
	return { controller, events };
}

describe("createScreenPermissionWaitController", () => {
	it("reports the wait as started when begun", async () => {
		const { controller, events } = createHarness();

		const wait = controller.begin();
		expect(events).toEqual(["started"]);
		expect(controller.isPending()).toBe(true);

		controller.end(true);
		await expect(wait).resolves.toEqual({ success: true, cancelled: false });
	});

	it("rejects a second begin while a wait is already pending", async () => {
		const { controller } = createHarness();

		const wait = controller.begin();
		expect(controller.begin()).toBeNull();

		controller.end(false);
		await expect(wait).resolves.toEqual({ success: false, cancelled: true });
	});

	it("resolves granted when the renderer reports acceptance", async () => {
		const { controller, events } = createHarness();

		const wait = controller.begin();
		controller.end(true);

		await expect(wait).resolves.toEqual({ success: true, cancelled: false });
		expect(events).toEqual(["started", "ended:granted"]);
		expect(controller.isPending()).toBe(false);
	});

	it("resolves cancelled when the renderer reports denial", async () => {
		const { controller, events } = createHarness();

		const wait = controller.begin();
		controller.end(false);

		await expect(wait).resolves.toEqual({ success: false, cancelled: true });
		expect(events).toEqual(["started", "ended:denied"]);
	});

	it("resolves cancelled when the user cancels from the overlay", async () => {
		const { controller, events } = createHarness();

		const wait = controller.begin();
		controller.cancel();

		await expect(wait).resolves.toEqual({ success: false, cancelled: true });
		expect(events).toEqual(["started", "ended:denied"]);
		expect(controller.isPending()).toBe(false);
	});

	it("end and cancel are no-ops when nothing is pending", () => {
		const { controller, events } = createHarness();

		expect(controller.end(true)).toBe(false);
		expect(controller.cancel()).toBe(false);
		expect(events).toEqual([]);
	});

	it("supports a new cycle after the previous wait settles", async () => {
		const { controller } = createHarness();

		const first = controller.begin();
		controller.end(true);
		await first;

		const second = controller.begin();
		expect(controller.isPending()).toBe(true);
		controller.cancel();
		await expect(second).resolves.toEqual({ success: false, cancelled: true });
	});
});
