import { toast } from "@/components/ui/toast";

/**
 * Thin wrapper over the Base UI toast manager. Takes words, never chooses
 * them: the error toast's title and fallback come from the catalog through
 * `useErrorToast()`, and success toasts are titled by their caller.
 *
 * `toast` is a module-level singleton, so these are callable from mutation
 * callbacks and event handlers — which is the whole reason the two call sites
 * that previously used `window.alert()` reached for it: they are inside
 * `onError`, where no component is rendering.
 */
export function toastError(title: string, description: string) {
  toast.add({ title, description, type: "error" });
}

export function toastSuccess(title: string, description?: string) {
  toast.add({ title, description, type: "success" });
}
