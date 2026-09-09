import type { BrowserWindow } from "electron";

import { isWaylandSession } from "./hudOverlaySession";

export type HudOverlayHideTarget = Pick<BrowserWindow, "hide" | "minimize">;

export function hideHudOverlayWindow(
	hud: HudOverlayHideTarget,
	platform: NodeJS.Platform = process.platform,
	waylandSession: boolean = isWaylandSession(),
): void {
	// Wayland compositors ignore minimize() and there is no taskbar entry
	// to restore from, so the "−" control must hide the window instead.
	// Gated to Wayland sessions: on X11 minimize() works and the taskbar
	// restores the HUD — main's behavior. The tray "Show HUD" action
	// (showHudOverlayFromTray) restores a hidden window with show(), which
	// works on every platform.
	if (platform === "linux" && waylandSession) {
		hud.hide();
		return;
	}

	hud.minimize();
}
