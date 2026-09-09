import { describe, expect, it, vi } from "vitest";

import { isWaylandSession } from "./hudOverlaySession";
import { hideHudOverlayWindow } from "./hudOverlayWindowActions";

function createHudStub() {
	return {
		hide: vi.fn(),
		minimize: vi.fn(),
	};
}

describe("hideHudOverlayWindow", () => {
	it("hides instead of minimizing on Linux Wayland (compositors ignore minimize and there is no taskbar)", () => {
		const hud = createHudStub();

		hideHudOverlayWindow(hud, "linux", true);

		expect(hud.hide).toHaveBeenCalledOnce();
		expect(hud.minimize).not.toHaveBeenCalled();
	});

	it("minimizes on Linux X11 so the taskbar entry restores the HUD, matching main", () => {
		const hud = createHudStub();

		hideHudOverlayWindow(hud, "linux", false);

		expect(hud.minimize).toHaveBeenCalledOnce();
		expect(hud.hide).not.toHaveBeenCalled();
	});

	it("minimizes on Windows so the taskbar entry restores the HUD", () => {
		const hud = createHudStub();

		hideHudOverlayWindow(hud, "win32", false);

		expect(hud.minimize).toHaveBeenCalledOnce();
		expect(hud.hide).not.toHaveBeenCalled();
	});

	it("minimizes on macOS so the Dock restores the HUD", () => {
		const hud = createHudStub();

		hideHudOverlayWindow(hud, "darwin", false);

		expect(hud.minimize).toHaveBeenCalledOnce();
		expect(hud.hide).not.toHaveBeenCalled();
	});

	it("ignores the Wayland flag outside Linux (win32 sessions are never Wayland)", () => {
		const hud = createHudStub();

		hideHudOverlayWindow(hud, "win32", true);

		expect(hud.minimize).toHaveBeenCalledOnce();
		expect(hud.hide).not.toHaveBeenCalled();
	});

	it("defaults to the current process platform and session", () => {
		const hud = createHudStub();

		hideHudOverlayWindow(hud);

		if (process.platform === "linux" && isWaylandSession()) {
			expect(hud.hide).toHaveBeenCalledOnce();
			expect(hud.minimize).not.toHaveBeenCalled();
		} else {
			expect(hud.minimize).toHaveBeenCalledOnce();
			expect(hud.hide).not.toHaveBeenCalled();
		}
	});
});
