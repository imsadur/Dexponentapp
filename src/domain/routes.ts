export function isFarmWizardRoute(segments: string[]) {
  return (
    segments[0] === "app" &&
    segments[1] === "farms" &&
    (segments[2] === "new" || segments[3] === "edit")
  );
}
