/** Bring a newly opened page or form step back into view. */
export function scrollPageToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/** Scroll to and focus the first field that needs the user's attention. */
export function focusFormField(container: HTMLElement | null, name: string) {
  if (!container) return;

  const field = Array.from(container.querySelectorAll<HTMLElement>("[name], [data-field]")).find(
    (element) => element.getAttribute("name") === name || element.getAttribute("data-field") === name,
  );
  if (!field) return;

  const target = field.hasAttribute("data-field") && !field.matches("input, textarea, select, button, [tabindex]")
    ? Array.from(field.querySelectorAll<HTMLElement>("input, textarea, select, button, [tabindex]:not([tabindex='-1'])"))
      .find((element) => element.getClientRects().length > 0 && !element.hasAttribute("disabled")) ?? field
    : field;

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    if (target.isConnected) target.focus({ preventScroll: true });
  }, 250);
}

/** Wait for a wizard step to render before locating one of its fields. */
export function focusFormFieldAfterRender(container: HTMLElement | null, name: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => focusFormField(container, name));
  });
}
