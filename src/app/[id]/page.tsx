import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Validates Namespaced Identifiers (NSIDs) according to AT Protocol spec
 * https://atproto.com/specs/nsid
 */
const SPEC_NSID_REGEX =
  /^[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(\.[a-zA-Z]([a-zA-Z0-9]{0,62})?)$/;
function isValidLexiconNSID(nsid: string): boolean {
  return SPEC_NSID_REGEX.test(nsid);
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!isValidLexiconNSID(id)) {
    notFound();
  }

  return <div>{id}</div>;
}
