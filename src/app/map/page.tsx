import Header from "@/components/Header";
import MapGame from "@/components/MapGame";

export default function MapPage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <Header />
      <div className="mt-6 flex w-full flex-col items-center gap-6 px-4 pb-12">
        <MapGame />
      </div>
    </main>
  );
}
