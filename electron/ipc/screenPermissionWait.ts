export interface ScreenPermissionWaitResult {
	success: boolean;
	cancelled?: boolean;
}

export interface ScreenPermissionWaitControllerHandlers {
	/** Called when a wait begins — show the awaiting-permission overlay. */
	onWaitStarted: () => void;
	/**
	 * Called when the wait settles.
	 * `granted: true` → clear the awaiting state and keep the overlay alive
	 * for the countdown that follows; `granted: false` → close the overlay.
	 */
	onWaitEnded: (granted: boolean) => void;
}

export interface ScreenPermissionWaitController {
	/** Starts a wait; returns null when one is already pending. */
	begin(): Promise<ScreenPermissionWaitResult> | null;
	/** Settles the pending wait; returns false when nothing is pending. */
	end(granted: boolean): boolean;
	/** Settles the pending wait as user-cancelled; returns false when nothing is pending. */
	cancel(): boolean;
	isPending(): boolean;
}

/**
 * Coordinates the "waiting for screen permission" IPC flow between the
 * renderer hook and the countdown overlay window. Pure state — window and
 * IPC wiring are injected by the caller.
 */
export function createScreenPermissionWaitController(
	handlers: ScreenPermissionWaitControllerHandlers,
): ScreenPermissionWaitController {
	let pendingResolve: ((result: ScreenPermissionWaitResult) => void) | null = null;

	const settle = (granted: boolean) => {
		const resolve = pendingResolve;
		pendingResolve = null;
		resolve?.({ success: granted, cancelled: !granted });
		handlers.onWaitEnded(granted);
	};

	return {
		begin() {
			if (pendingResolve) {
				return null;
			}
			const promise = new Promise<ScreenPermissionWaitResult>((resolve) => {
				pendingResolve = resolve;
			});
			handlers.onWaitStarted();
			return promise;
		},
		end(granted) {
			if (!pendingResolve) {
				return false;
			}
			settle(granted);
			return true;
		},
		cancel() {
			if (!pendingResolve) {
				return false;
			}
			settle(false);
			return true;
		},
		isPending() {
			return pendingResolve !== null;
		},
	};
}
