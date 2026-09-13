import { receive_file_list } from "@/action/fileHandler";
import { Receive } from "./_components/Receive";
import { auth } from "@/auth";

interface PageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

const ReceivePage = async ({ searchParams }: PageProps) => {
  // 1. Await the searchParams Promise
  const resolvedSearchParams = await searchParams;

  // 2. Safely parse page and limit from resolved searchParams
  const fileData = await receive_file_list({
    page: Number(resolvedSearchParams.page) || 1,
    limit: Number(resolvedSearchParams.limit) || 10,
  });

  const session = await auth();

  return (
    <div className="p-4">
      <Receive
        data={fileData.files}
        total={fileData.results}
        token={session?.user.accessToken || null}
      />
    </div>
  );
};

export default ReceivePage;
