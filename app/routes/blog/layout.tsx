// Libs
import { Outlet } from "react-router";

// Components
import Header from "~/components/header";

export default function Blog() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
