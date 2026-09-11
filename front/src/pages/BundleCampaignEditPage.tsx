import { useParams } from "react-router-dom";
import { BundleCampaignForm } from "./BundleCampaignCreatePage";

export default function BundleCampaignEditPage() {
  const { id } = useParams();
  return <BundleCampaignForm mode="edit" bundleId={id} />;
}
