import { useQueryClient } from "@tanstack/react-query";
import { Text } from "react-native";

import { useRuntimeConfig } from "@/config";
import { useTheme } from "@/theme";
import { renderWithAppProviders } from "../../test/render";

function ProviderProbe() {
  const queryClient = useQueryClient();
  const runtimeConfig = useRuntimeConfig();
  const theme = useTheme();

  const providersAreReady =
    queryClient !== undefined &&
    runtimeConfig.status !== undefined &&
    theme.name !== undefined;

  return <Text>{providersAreReady ? "providers-ready" : "providers-missing"}</Text>;
}

describe("AppProviders", () => {
  it("renders children with the shared application providers", async () => {
    const screen = await renderWithAppProviders(<ProviderProbe />);

    expect(screen.getByText("providers-ready")).toBeTruthy();
  });
});
