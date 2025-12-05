import { notFound } from "next/navigation";
import { isValidNsid } from "@atproto/syntax";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!isValidNsid(id)) {
    notFound();
  }

  return <div>{id}</div>;
}
