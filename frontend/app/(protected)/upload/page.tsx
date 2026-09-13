import { send_file_list } from "@/action/fileHandler";
import { Upload } from "./_components/Upload";

interface UploadPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

const UploadPage = async ({ searchParams }: UploadPageProps) => {
  // 1. Await the searchParams promise (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // 2. Parse numbers with safe fallbacks
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = Number(resolvedSearchParams.limit) || 10;

  const fileData = await send_file_list({ page, limit });

  return (
    <div className="p-4">
      <Upload
        data={fileData?.files ?? []}
        total={fileData?.results ?? 0}
      />
    </div>
  );
};

export default UploadPage;
