import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function isValidLexiconId(id: string): boolean {
  const reverseDnsPattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/;
  return reverseDnsPattern.test(id);
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!isValidLexiconId(id)) {
    notFound();
  }

  return <div>{id}</div>;
}
