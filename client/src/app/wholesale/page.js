import Portal from "./Portal";
import "./portal.css";

export const metadata = {
  title: { absolute: "Wholesale Order Dashboard | MWP Supplements" },
  robots: { index: false, follow: false },
};

// Private link given to wholesale partners by the MWP team. Not linked from the store menu.
export default function WholesalePage() {
  return <Portal />;
}
