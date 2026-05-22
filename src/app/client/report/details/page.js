import ReportDetailsPage from "../[id]/page";

export default function ReportDetailsByQueryPage({ searchParams }) {
  const id = (searchParams && searchParams.id) || "";

  return <ReportDetailsPage params={{ id }} />;
}
