import { CombinedPermissionsWrapper } from "@/components/combined-permissions-wrapper";
import { MainContent } from "@/components/main-content";

export default function Home() {
  return (
    <CombinedPermissionsWrapper>
      <MainContent />
    </CombinedPermissionsWrapper>
  );
}
