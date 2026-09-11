"use client";

import dynamic from "next/dynamic";

const GlobalScreenDraw = dynamic(
  () => import("@/components/Common/GlobalScreenDraw").then((m) => m.GlobalScreenDraw),
  { ssr: false }
);

const GlobalClassCalling = dynamic(
  () => import("@/components/Common/GlobalClassCalling").then((m) => m.GlobalClassCalling),
  { ssr: false }
);

const AdminScreenRecorder = dynamic(
  () => import("@/components/Admin/AdminScreenRecorder").then((m) => m.AdminScreenRecorder),
  { ssr: false }
);

export default function ClientBackgroundTools() {
  return (
    <>
      <GlobalScreenDraw />
      <GlobalClassCalling />
      <AdminScreenRecorder />
    </>
  );
}
