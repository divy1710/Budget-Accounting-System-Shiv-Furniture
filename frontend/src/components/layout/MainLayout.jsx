import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Header />
      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
