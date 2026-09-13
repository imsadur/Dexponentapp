export function isFarmWizardRoute(segments: string[]) {
  return (
    segments[0] === "app" &&
    segments[1] === "farms" &&
    (segments[2] === "new" ||
      segments[2] === "edit" ||
      segments[3] === "edit")
  );
}

export function farmDetailHref(id: string) {
  return `/app/farms/manage/?farm=${encodeURIComponent(id)}`;
}

export function farmEditHref(id: string) {
  return `/app/farms/edit/?farm=${encodeURIComponent(id)}`;
}

export function farmTradeHref(id: string, market?: string) {
  const pair = market ? `&market=${encodeURIComponent(market)}` : "";
  return `/app/trade/?farm=${encodeURIComponent(id)}${pair}`;
}
