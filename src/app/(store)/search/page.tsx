import { Suspense } from "react";
import SearchClient from "./search-client";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Qidiruv natijalari</h1>
      <Suspense>
        <SearchClient />
      </Suspense>
    </div>
  );
}
