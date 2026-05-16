"use client";

import dynamic from "next/dynamic";
import React from "react";

const ToeicFullTestPlayer = dynamic(
  () => import("./ToeicFullTestPlayer"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-500 font-bold animate-pulse">Đang chuẩn bị đề thi...</p>
        </div>
      </div>
    )
  }
);

export default function ToeicFullTestClientWrapper(props: any) {
  return <ToeicFullTestPlayer {...props} />;
}
