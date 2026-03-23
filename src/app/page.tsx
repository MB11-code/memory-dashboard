import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientPage from "./ClientPage";

export const dynamic = "force-dynamic";

export default function Home() {
  const cookieStore = cookies();
  const session = cookieStore.get("memory_session");

  if (!session || session.value !== "authenticated") {
    redirect("/login");
  }

  return <ClientPage />;
}
