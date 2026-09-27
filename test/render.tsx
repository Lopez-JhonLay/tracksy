import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { AppProviders } from "@/providers";

export function renderWithAppProviders(element: ReactElement) {
  return render(element, { wrapper: AppProviders });
}
