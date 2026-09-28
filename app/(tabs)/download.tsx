import { testAdaptersEnabled } from "@/config";
import { DownloadScreen } from "@/features/converter/components";
import { FAKE_CONVERTER_SOURCE } from "@/features/converter/testing";

export default function DownloadRoute() {
  return (
    <DownloadScreen
      converterSource={
        testAdaptersEnabled ? FAKE_CONVERTER_SOURCE : undefined
      }
    />
  );
}
