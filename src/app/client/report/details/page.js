"use client";

import { useSearchParams } from "next/navigation";
import ReportDetailsPage from "../[id]/page";

export default function ReportDetailsByQueryPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  return <ReportDetailsPage params={{ id }} />;
}
