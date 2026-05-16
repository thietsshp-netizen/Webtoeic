import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  // Chuyển hướng người dùng từ /dashboard sang trang chủ với tab dashboard
  redirect("/?tab=dashboard");
}
